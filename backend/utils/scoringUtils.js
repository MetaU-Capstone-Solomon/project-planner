/**
 * Scoring Utilities for Roadmap Prioritization
 * 
 * Core scoring functions that calculate priority scores for phases and tasks
 * based on various factors like logical order, timeline, experience level,
 * scope, and risk. These utilities implement the weighted scoring algorithm
 * used by the prioritization service.
 * 
 * Scoring Algorithm:
 * - Each function returns a score from 0-100 (higher = higher priority)
 * - Neutral scores (50) are returned when no patterns match (safe fallback)
 * - Scores are combined using weighted averages in calculateWeightedScore()
 * 
 * Key Functions:
 * - getLogicalOrderScore(): Prioritizes phases by development sequence
 * - getTimelineScore(): Aligns phases with project duration
 * - getExperienceScore(): Adapts to user skill level and learning curve
 * - getScopeScore(): Prioritizes based on project type (MVP vs Enterprise)
 * - getRiskScore(): Considers complexity and uncertainty factors
 * 
 * @example
 * // Complete scoring example for a "Development" phase:
 * // logicalOrder: 80 (development comes after setup)
 * // timeline: 70 (fits 3-month project timeline)
 * // experience: 60 (moderate complexity for intermediate user)
 * // scope: 70 (important for full-featured project)
 * // risk: 50 (moderate risk, neutral score)
 * // Final weighted score: (80*0.3 + 70*0.2 + 60*0.2 + 70*0.2 + 50*0.1) = 68
 * 
 * @module scoringUtils
 */

// Scoring Constants
const SCORING_CONSTANTS = {
  // Score ranges
  MAX_SCORE: 100,
  MIN_SCORE: 0,
  NEUTRAL_SCORE: 50,
  
  // Scope-specific scores
  MVP_CORE_FEATURE_SCORE: 100,
  MVP_ADVANCED_FEATURE_SCORE: 30,
  FULL_FEATURED_SCOPE_SCORE: 70,
  ENTERPRISE_SCOPE_SCORE: 80,
  
  // Timeline scoring
  TIMELINE_SCORE_MULTIPLIER: 10,
  EARLY_PHASE_BONUS_MULTIPLIER: 1.2,
  EARLY_PHASE_THRESHOLD: 0.3,
  
  // Task scoring
  TASK_ORDER_BIAS_MULTIPLIER: 0.1,
  
  // Default values
  DEFAULT_TIMELINE_DAYS: 30,
  
  // Risk scoring
  RISK_SCORE_MULTIPLIER: 10
};

/**
 * Calculates weighted score from multiple factors using configuration weights.
 * @param {Object} scores - Individual scores for each factor (0-100 range).
 * @param {Object} weights - Weight configuration for each factor (sums to 1.0).
 * @returns {number} Weighted score (0-100 range).
 */
function calculateWeightedScore(scores, weights) {
  return Object.entries(scores).reduce((total, [key, score]) => {
    // Convert variable names to match config file format
    const weightKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    const weight = weights[weightKey] || weights[key] || 0;
    return total + (score * weight);
  }, 0);
}

/**
 * Scores a phase based on logical order using configuration patterns.
 * @param {Object} phase - Phase object with title and description.
 * @param {Object} phasePatterns - Configuration patterns for different phase types.
 * @returns {number} Logical order score (0-100, higher = earlier in sequence).
 */
function getLogicalOrderScore(phase, phasePatterns) {
  const phaseTitle = phase.title.toLowerCase();
  
  for (const [patternType, pattern] of Object.entries(phasePatterns)) {
    if (pattern.keywords.some(keyword => phaseTitle.includes(keyword))) {
      return pattern.score;
    }
  }
  
  return SCORING_CONSTANTS.NEUTRAL_SCORE; // Default neutral score
}

/**
 * Scores a phase based on timeline position and project duration.
 * @param {Object} phase - Phase object with timeline property.
 * @param {number} timelineDays - Total project timeline in days.
 * @param {Object} timelineParsers - Configuration for parsing timeline strings.
 * @returns {number} Timeline score (0-100, higher = better timeline fit).
 */
function getTimelineScore(phase, timelineDays, timelineParsers) {
  const phaseDay = extractDayFromTimeline(phase.timeline, timelineParsers);
  if (!phaseDay) return SCORING_CONSTANTS.NEUTRAL_SCORE;
  
  const timelineScore = Math.max(SCORING_CONSTANTS.MIN_SCORE, timelineDays - phaseDay + 1) * SCORING_CONSTANTS.TIMELINE_SCORE_MULTIPLIER;
  
  // Early phases get bonus points
  if (phaseDay <= timelineDays * SCORING_CONSTANTS.EARLY_PHASE_THRESHOLD) {
    return timelineScore * SCORING_CONSTANTS.EARLY_PHASE_BONUS_MULTIPLIER;
  }
  
  return timelineScore;
}

/**
 * Scores a phase based on user experience level and learning progression.
 * @param {Object} phase - Phase object with title and description.
 * @param {Array} learningPattern - Array of keywords ordered by learning difficulty.
 * @returns {number} Experience alignment score (0-100, higher = better for user level).
 */
function getExperienceScore(phase, learningPattern) {
  const phaseTitle = phase.title.toLowerCase();
  
  const patternIndex = learningPattern.findIndex(keyword => 
    phaseTitle.includes(keyword)
  );
  
  if (patternIndex === -1) return SCORING_CONSTANTS.NEUTRAL_SCORE; // Neutral score if no match
  
  return (learningPattern.length - patternIndex) * SCORING_CONSTANTS.TIMELINE_SCORE_MULTIPLIER;
}

/**
 * Scores a phase based on project scope and feature complexity.
 * @param {Object} phase - Phase object with title and description.
 * @param {string} scope - Project scope ("mvp", "full-featured", "enterprise-level").
 * @returns {number} Scope relevance score (0-100, higher = better scope match).
 */
function getScopeScore(phase, scope) {
  const phaseTitle = phase.title.toLowerCase();
  
  switch (scope) {
    case 'mvp':
      if (phaseTitle.includes('core') || phaseTitle.includes('basic') || phaseTitle.includes('foundation')) {
        return SCORING_CONSTANTS.MVP_CORE_FEATURE_SCORE;
      }
      if (phaseTitle.includes('advanced') || phaseTitle.includes('optimization')) {
        return SCORING_CONSTANTS.MVP_ADVANCED_FEATURE_SCORE;
      }
      break;
    case 'full-featured':
      return SCORING_CONSTANTS.FULL_FEATURED_SCOPE_SCORE;
    case 'enterprise-level':
      return SCORING_CONSTANTS.ENTERPRISE_SCOPE_SCORE;
    default:
      return SCORING_CONSTANTS.NEUTRAL_SCORE;
  }
  
  return SCORING_CONSTANTS.NEUTRAL_SCORE;
}

/**
 * Returns a risk score for a phase based on risk matrix configuration.
 * @param {Object} phase - Phase object with title and description.
 * @param {Object} riskMatrix - Risk matrix with keywords and risk profiles.
 * @returns {number} Risk score (0-100, higher = lower risk, higher priority).
 */
function getRiskScore(phase, riskMatrix) {
  const phaseTitle = phase.title.toLowerCase();
  
  for (const [keyword, riskProfile] of Object.entries(riskMatrix)) {
    if (phaseTitle.includes(keyword)) {
      return (riskProfile.impact - riskProfile.risk) * SCORING_CONSTANTS.RISK_SCORE_MULTIPLIER;
    }
  }
  
  return SCORING_CONSTANTS.NEUTRAL_SCORE; // Default for neutral score
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
  score += (SCORING_CONSTANTS.MAX_SCORE - originalIndex) * SCORING_CONSTANTS.TASK_ORDER_BIAS_MULTIPLIER;
  
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
  if (!timeline) return SCORING_CONSTANTS.DEFAULT_TIMELINE_DAYS; // Default 30 days
  
  const days = extractDayFromTimeline(timeline, timelineParsers);
  return days || SCORING_CONSTANTS.DEFAULT_TIMELINE_DAYS;
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