const { PROJECT_KEYWORDS, SUMMARIZATION_CONFIG } = require('../constants/keywords');

// Summarizes project documents by extracting key sentences based on relevance
class TextSummarizer {
  constructor(targetLength = SUMMARIZATION_CONFIG.DEFAULT_TARGET_LENGTH) {
    this.targetLength = targetLength;
    this.cache = new Map();
    this.keywordSet = new Set(PROJECT_KEYWORDS);
  }

  // Main entry point for text summarization with caching and length optimization
  summarize(text) {
    if (!text || text.length <= this.targetLength) {
      return text;
    }

    // Check cache first
    const cacheKey = this.generateCacheKey(text);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Quick mode for very large files
    if (text.length > SUMMARIZATION_CONFIG.QUICK_MODE_THRESHOLD) {
      const quickSummary = this.quickSummarize(text);
      this.cache.set(cacheKey, quickSummary);
      return quickSummary;
    }

    const cleanedText = this.cleanText(text);
    const sentences = this.splitIntoSentences(cleanedText);

    if (sentences.length > SUMMARIZATION_CONFIG.MAX_SENTENCES) {
      const quickSummary = this.quickSummarize(text);
      this.cache.set(cacheKey, quickSummary);
      return quickSummary;
    }

    const scoredSentences = this.scoreSentencesOptimized(sentences);
    const selectedSentences = this.selectSentencesOptimized(scoredSentences);
    const summary = this.reconstructSummary(selectedSentences);

    this.cache.set(cacheKey, summary);
    return summary;
  }

  // Simple word-based summary for large files
  quickSummarize(text) {
    const words = text.split(/\s+/);
    const targetWords = Math.floor(this.targetLength / 5);
    return words.slice(0, targetWords).join(' ') + '...';
  }

  // Creates a unique key for caching based on text length and content samples
  generateCacheKey(text) {
    return `${text.length}_${text.substring(0, 100)}_${text.substring(text.length - 100)}`;
  }

  // Normalizes whitespace and removes extra spaces
  cleanText(text) {
    return text.replace(/\s+/g, ' ').trim();
  }

  // Breaks text into sentences and filters out very short ones
  splitIntoSentences(text) {
    const sentences = text.split(/(?<=[.!?])\s+/);
    return sentences.filter(
      (sentence) => sentence.length > SUMMARIZATION_CONFIG.MIN_SENTENCE_LENGTH
    );
  }

  // Assigns importance scores to sentences based on keywords and position
  scoreSentencesOptimized(sentences) {
    const totalSentences = sentences.length;
    const results = new Array(totalSentences);
    const positionScores = this.calculatePositionScores(totalSentences);

    // Process in batches for better performance
    const batchSize = SUMMARIZATION_CONFIG.BATCH_SIZE;
    for (let i = 0; i < totalSentences; i += batchSize) {
      const end = Math.min(i + batchSize, totalSentences);
      for (let j = i; j < end; j++) {
        const sentence = sentences[j];
        const score = this.calculateSentenceScoreOptimized(
          sentence,
          j,
          totalSentences,
          positionScores
        );
        results[j] = { text: sentence, score, index: j };
      }
    }

    return results;
  }

  // Calculates scores based on sentence position in the document
  calculatePositionScores(total) {
    const scores = new Array(total);
    for (let i = 0; i < total; i++) {
      const normalizedPosition = i / total;
      // First and last 20% get higher scores
      if (normalizedPosition <= 0.2 || normalizedPosition >= 0.8) {
        scores[i] = 3;
      } else if (normalizedPosition <= 0.4 || normalizedPosition >= 0.6) {
        scores[i] = 2;
      } else {
        scores[i] = 1;
      }
    }
    return scores;
  }

  // Scores individual sentences based on multiple factors
  calculateSentenceScoreOptimized(sentence, index, total, positionScores) {
    let score = positionScores[index];

    // Prefer medium-length sentences
    const length = sentence.length;
    if (length >= 50 && length <= 150) score += 3;
    else if (length >= 30 && length <= 200) score += 2;
    else score += 1;

    // increase score for sentences with project keywords
    const lowerSentence = sentence.toLowerCase();
    let keywordCount = 0;
    for (const keyword of this.keywordSet) {
      if (lowerSentence.includes(keyword)) {
        keywordCount++;
        if (keywordCount >= 5) break;
      }
    }
    score += Math.min(
      keywordCount * SUMMARIZATION_CONFIG.KEYWORD_SCORE_MULTIPLIER,
      SUMMARIZATION_CONFIG.MAX_KEYWORD_SCORE
    );

    // Increase score for sentences with verbs, numbers, or formatting
    if (/\b(is|are|will|should|must|can)\b/.test(lowerSentence)) score += 2;
    if (/\d+/.test(sentence)) score += 1;
    if (/[:|-]/.test(sentence)) score += 1;

    return score;
  }

  // Picks the highest scoring sentences that fit within target length
  selectSentencesOptimized(scoredSentences) {
    const sorted = scoredSentences
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.ceil(this.targetLength / 50));

    const selected = [];
    let currentLength = 0;

    for (const sentence of sorted) {
      const sentenceLength = sentence.text.length + 1;
      if (currentLength + sentenceLength <= this.targetLength) {
        selected.push(sentence);
        currentLength += sentenceLength;
      } else {
        break;
      }
    }

    // Maintain original order
    return selected.sort((a, b) => a.index - b.index);
  }

  // Combines selected sentences into final summary text
  reconstructSummary(selectedSentences) {
    if (selectedSentences.length === 0) return '';

    const summary = selectedSentences.map((s) => s.text).join(' ');
    return summary.length > this.targetLength
      ? summary.substring(0, this.targetLength - 3) + '...'
      : summary;
  }

  // Clears the summary cache
  clearCache() {
    this.cache.clear();
  }

  // Returns current cache statistics
  getCacheStats() {
    return {
      size: this.cache.size,
      memoryUsage: this.cache.size * 100,
    };
  }
}

module.exports = TextSummarizer;
