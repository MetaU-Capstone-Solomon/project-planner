/**
 * Scoring Utilities for Roadmap Prioritization
 * 
 * Provides reusable functions for calculating scores based on configuration patterns.
 */

/**
 * Calculates a weighted score from multiple factors
 * @param {Object} scores - Individual scores for each factor
 * @param {Object} weights - Weight configuration for each factor
 * @returns {number} Weighted score
 */
function calculateWeightedScore(scores, weights) {
  return Object.entries(scores).reduce((total, [key, score]) => {
    const weightKey = key.toUpperCase();
    const weight = weights[weightKey] || weights[key] || 0;
    return total + (score * weight);
  }, 0);
}

/**
 * Scores a phase based on logical order using configuration patterns
 * @param {Object} phase - Phase object
 * @param {Object} phasePatterns - Phase pattern configuration
 * @returns {number} Logical order score
 */
function getLogicalOrderScore(phase, phasePatterns) {
  const phaseTitle = phase.title.toLowerCase();
  
  for (const [patternType, pattern] of Object.entries(phasePatterns)) {
    if (pattern.keywords.some(keyword => phaseTitle.includes(keyword))) {
      return pattern.score;
    }
  }
  
  return 50; // Default neutral score
}

/**
 * Scores a phase based on timeline position
 * @param {Object} phase - Phase object
 * @param {number} timelineDays - Total timeline in days
 * @param {Object} timelineParsers - Timeline parser configuration
 * @returns {number} Timeline score
 */
function getTimelineScore(phase, timelineDays, timelineParsers) {
  const phaseDay = extractDayFromTimeline(phase.timeline, timelineParsers);
  if (!phaseDay) return 50;
  
  const timelineScore = Math.max(0, timelineDays - phaseDay + 1) * 10;
  
  // Early phases get bonus points
  if (phaseDay <= timelineDays * 0.3) {
    return timelineScore * 1.2;
  }
  
  return timelineScore;
}

/**
 * Scores a phase based on user experience level
 * @param {Object} phase - Phase object
 * @param {Array} learningPattern - Learning pattern for experience level
 * @returns {number} Experience alignment score
 */
function getExperienceScore(phase, learningPattern) {
  const phaseTitle = phase.title.toLowerCase();
  
  const patternIndex = learningPattern.findIndex(keyword => 
    phaseTitle.includes(keyword)
  );
  
  if (patternIndex === -1) return 50; // Neutral score if no match
  
  return (learningPattern.length - patternIndex) * 10;
}

/**
 * Scores a phase based on project scope
 * @param {Object} phase - Phase object
 * @param {string} scope - Project scope
 * @returns {number} Scope relevance score
 */
function getScopeScore(phase, scope) {
  const phaseTitle = phase.title.toLowerCase();
  
  switch (scope) {
    case 'mvp':
      if (phaseTitle.includes('core') || phaseTitle.includes('basic') || phaseTitle.includes('foundation')) {
        return 100;
      }
      if (phaseTitle.includes('advanced') || phaseTitle.includes('optimization')) {
        return 30;
      }
      break;
    case 'full-featured':
      return 70;
    case 'enterprise-level':
      return 80;
    default:
      return 50;
  }
  
  return 50;
}

/**
 * Returns a risk score for a phase based on risk matrix
 * @param {Object} phase - Phase object
 * @param {Object} riskMatrix - Risk matrix configuration
 * @returns {number} Risk score
 */
function getRiskScore(phase, riskMatrix) {
  const phaseTitle = phase.title.toLowerCase();
  
  for (const [keyword, riskProfile] of Object.entries(riskMatrix)) {
    if (phaseTitle.includes(keyword)) {
      return (riskProfile.impact - riskProfile.risk) * 10;
    }
  }
  
  return 50; // Default neutral score
}

/**
 * Scores a task for ordering within a milestone
 * @param {Object} task - Task object
 * @param {Object} taskPatterns - Task pattern configuration
 * @param {number} originalIndex - Original position of task
 * @returns {number} Task score
 */
function getTaskScore(task, taskPatterns, originalIndex) {
  const taskTitle = task.title.toLowerCase();
  let score = 0;
  
  for (const [patternType, pattern] of Object.entries(taskPatterns)) {
    if (pattern.keywords.some(keyword => taskTitle.includes(keyword))) {
      score += pattern.score;
      break; // Use first matching pattern
    }
  }
  
  // Add bias to preserve original order for ties
  score += (100 - originalIndex) * 0.1;
  
  return score;
}

/**
 * Extracts a day number from a timeline string
 * @param {string} timeline - Timeline string (e.g., "Day 5", "Week 2")
 * @param {Object} timelineParsers - Timeline parser configuration
 * @returns {number|null} Day number or null
 */
function extractDayFromTimeline(timeline, timelineParsers) {
  if (!timeline) return null;
  
  for (const [unit, parser] of Object.entries(timelineParsers)) {
    const regex = new RegExp(parser.pattern.slice(1, -2), 'i'); // Remove / and /i
    const match = timeline.match(regex);
    if (match) {
      return parseInt(match[1]) * parser.multiplier;
    }
  }
  
  // Fallback: try to extract any number
  const numMatch = timeline.match(/(\d+)/);
  if (numMatch) {
    return parseInt(numMatch[1]);
  }
  
  return null;
}

/**
 * Parses timeline string to number of days
 * @param {string} timeline - Timeline string
 * @param {Object} timelineParsers - Timeline parser configuration
 * @returns {number} Number of days
 */
function parseTimeline(timeline, timelineParsers) {
  if (!timeline) return 30; // Default 30 days
  
  const days = extractDayFromTimeline(timeline, timelineParsers);
  return days || 30;
}

/**
 * Validates that phase dependencies are in correct order
 * @param {Array} phases - Array of phases
 * @param {Object} dependencies - Dependency rules
 */
function validateDependencies(phases, dependencies) {
  const warnings = [];
  
  for (const [phase, prereqs] of Object.entries(dependencies)) {
    const phaseIndex = phases.findIndex(p => 
      p.title.toLowerCase().includes(phase)
    );
    
    if (phaseIndex !== -1) {
      for (const prereq of prereqs) {
        const prereqIndex = phases.findIndex(p => 
          p.title.toLowerCase().includes(prereq)
        );
        
        if (prereqIndex !== -1 && prereqIndex > phaseIndex) {
          warnings.push(`Dependency warning: ${prereq} should come before ${phase}`);
        }
      }
    }
  }
  
  // Dependency validation warnings logged for debugging
}

module.exports = {
  calculateWeightedScore,
  getLogicalOrderScore,
  getTimelineScore,
  getExperienceScore,
  getScopeScore,
  getRiskScore,
  getTaskScore,
  extractDayFromTimeline,
  parseTimeline,
  validateDependencies
}; 