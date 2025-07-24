/**
 * Roadmap Prioritization Service
 * 
 * Reorders project roadmap phases and tasks based on user constraints
 * using a weighted scoring algorithm. The service analyzes project characteristics
 * and user inputs to optimize the development sequence for better efficiency and
 * learning progression.
 * 
 * Key Features:
 * - Phase reordering based on logical dependencies and project timeline
 * - Task reordering within milestones for optimal learning flow
 * - Experience-level adaptive prioritization (beginner vs expert)
 * - Risk-aware scheduling for complex vs simple features
 * - Timeline-constrained optimization for MVP vs enterprise projects
 * 
 * Algorithm Overview:
 * 1. Analyzes project scope and user experience level
 * 2. Calculates weighted scores for each phase using 5 factors:
 *    - Logical order (30%): Respects development dependencies
 *    - Timeline fit (20%): Aligns with project duration
 *    - Experience match (20%): Adapts to user skill level
 *    - Scope alignment (20%): Prioritizes based on project type
 *    - Risk assessment (10%): Considers complexity and uncertainty
 * 3. Reorders phases by score while preserving important dependencies
 * 4. Optimizes task order within each milestone for learning efficiency
 * 
 * @example
 * // Complete prioritization example:
 * // Input: 3-month project, intermediate user, full-featured scope
 * // Phases: ["Setup", "Development", "Testing", "Deployment"]
 * // Scores: Setup(85), Development(78), Testing(72), Deployment(68)
 * // Result: ["Setup", "Development", "Testing", "Deployment"] (optimized order)
 * // Tasks within each phase are also reordered for optimal learning flow
 * 
 * @module prioritizationService
 */

const PrioritizationConfig = require('./prioritizationConfig');
const {
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
} = require('../utils/scoringUtils');

/**
 * RoadmapPrioritizationService
 *
 * This service implements the roadmap optimization algorithm. Takes a validated
 * roadmap and user constraints, then returns an optimized version with reordered
 * phases and tasks for better development efficiency and learning progression.
 * 
 * The service uses a configuration approach where scoring weights and
 * patterns are defined externally, making the algorithm adaptable to different
 * project types and user preferences.
 */
class RoadmapPrioritizationService {
  /**
   * Initializes the prioritization service with configuration management.
   */
  constructor() {
    this.config = new PrioritizationConfig();
  }

  /**
   * Returns a new roadmap object with phases and tasks reordered based on user constraints.
   * @param {Object} roadmap - The validated roadmap JSON with phases and milestones.
   * @param {Object} userConstraints - User's project constraints.
   * @param {string} userConstraints.timeline - Project timeline (e.g., "1 month", "6 weeks").
   * @param {string} userConstraints.experienceLevel - User experience level ("beginner", "intermediate", "expert").
   * @param {string} userConstraints.scope - Project scope ("mvp", "full-featured", "enterprise-level").
   * @returns {Object} Optimized roadmap with reordered phases and tasks.
   */
  async prioritizeRoadmap(roadmap, userConstraints) {
    try {
      this._validateInputs(roadmap, userConstraints);
      
      // Get dynamic configuration based on project analysis
      const projectConfig = this.config.getProjectConfig(roadmap, userConstraints);
      const constraints = this._parseConstraints(userConstraints, projectConfig.timelineParsers);
      
      const optimizedPhases = this._optimizePhaseOrder(roadmap.phases, constraints, projectConfig);
      const finalPhases = this._optimizeTaskOrder(optimizedPhases, constraints, projectConfig);
      
      // Validate dependencies with standard rules
      const dependencies = {
        'development': ['setup', 'planning'],
        'testing': ['development'],
        'deployment': ['testing'],
        'optimization': ['development']
      };
      validateDependencies(finalPhases, dependencies);
      
      return {
        ...roadmap,
        phases: finalPhases,
        metadata: {
          ...roadmap.metadata,
          optimizedAt: new Date().toISOString(),
          optimizationFactors: projectConfig.metadata
        }
      };
    } catch (error) {
      return roadmap;
    }
  }

  /**
   * Orders phases by weighted score based on project constraints and configuration.
   * @param {Array} phases - Array of phase objects with milestones and tasks.
   * @param {Object} constraints - Parsed user constraints (timeline, experience, scope).
   * @param {Object} projectConfig - Configuration with weights and scoring patterns.
   * @returns {Array} Reordered phases with updated order property.
   */
  _optimizePhaseOrder(phases, constraints, projectConfig) {
    const scoredPhases = phases.map((phase, index) => ({
      phase,
      score: this._calculatePhaseScore(phase, constraints, projectConfig, index),
      originalIndex: index
    }));
    scoredPhases.sort((a, b) => b.score - a.score);
    return scoredPhases.map(({ phase }, newIndex) => ({
      ...phase,
      order: newIndex + 1
    }));
  }

  /**
   * Calculates a weighted score for a phase using configuration scoring.
   * @param {Object} phase - Phase object with name, description, and milestones.
   * @param {Object} constraints - User constraints (timeline, experience, scope).
   * @param {Object} projectConfig - Configuration with weights and patterns.
   * @param {number} originalIndex - Original position of the phase (for tie-breaking).
   * @returns {number} Weighted score (higher = higher priority).
   */
  _calculatePhaseScore(phase, constraints, projectConfig, originalIndex) {
    const scores = {
      logicalOrder: getLogicalOrderScore(phase, projectConfig.phasePatterns),
      timeline: getTimelineScore(phase, constraints.timeline, projectConfig.timelineParsers),
      experience: getExperienceScore(phase, projectConfig.learningPatterns),
      scope: getScopeScore(phase, constraints.scope),
      risk: getRiskScore(phase, projectConfig.riskMatrix)
    };
    
    const weightedScore = calculateWeightedScore(scores, projectConfig.weights);
    
    // Bias to preserve original order for ties
    const orderBias = (100 - originalIndex) * 0.01;
    return weightedScore + orderBias;
  }

  /**
   * Reorders tasks within each milestone for logical flow using configuration.
   * @param {Array} phases - Array of phases with milestones and tasks.
   * @param {Object} constraints - User constraints (timeline, experience, scope).
   * @param {Object} projectConfig - Configuration with task patterns and weights.
   * @returns {Array} Phases with reordered tasks within each milestone.
   */
  _optimizeTaskOrder(phases, constraints, projectConfig) {
    return phases.map(phase => ({
      ...phase,
      milestones: phase.milestones.map(milestone => ({
        ...milestone,
        tasks: this._reorderTasks(milestone.tasks, constraints, projectConfig)
      }))
    }));
  }

  /**
   * Orders tasks within a milestone by type and original order using configuration.
   * @param {Array} tasks - Array of task objects with name, description, and resources.
   * @param {Object} constraints - User constraints (timeline, experience, scope).
   * @param {Object} projectConfig - Configuration with task patterns and scoring.
   * @returns {Array} Reordered tasks based on priority scoring.
   */
  _reorderTasks(tasks, constraints, projectConfig) {
    const taskScores = tasks.map((task, index) => ({
      task,
      score: getTaskScore(task, projectConfig.taskPatterns, index),
      originalIndex: index
    }));
    taskScores.sort((a, b) => b.score - a.score);
    return taskScores.map(({ task }) => task);
  }

  /**
   * Parses and normalizes user constraints using configuration.
   * @param {Object} userConstraints - Raw user input constraints.
   * @param {Object} timelineParsers - Configuration for parsing timeline strings.
   * @returns {Object} Normalized constraints object.
   */
  _parseConstraints(userConstraints, timelineParsers) {
    return {
      timeline: parseTimeline(userConstraints.timeline, timelineParsers),
      experience: userConstraints.experienceLevel || 'beginner',
      scope: userConstraints.scope || 'mvp'
    };
  }

  /**
   * Validates roadmap and user constraints.
   * @param {Object} roadmap
   * @param {Object} userConstraints
   */
  _validateInputs(roadmap, userConstraints) {
    if (!roadmap || !roadmap.phases || !Array.isArray(roadmap.phases)) {
      throw new Error('Invalid roadmap structure');
    }
    if (!userConstraints) {
      throw new Error('User constraints are required');
    }
  }
}

module.exports = RoadmapPrioritizationService; 