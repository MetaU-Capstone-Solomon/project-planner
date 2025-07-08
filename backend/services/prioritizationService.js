/**
 * Roadmap Prioritization Service
 * 
 * Optimizes project roadmap structure using configuration weighted scoring algorithms.
 * Reorders phases and tasks based on user constraints, dependencies, and project type detection.
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
 * Optimizes the order of phases and tasks in a software project roadmap using configuration scoring.
 * detects project type and domain to apply appropriate opt strategies.
 */
class RoadmapPrioritizationService {
  /**
   * Initializes the prioritization service with configuration management.
   */
  constructor() {
    this.config = new PrioritizationConfig();
  }

  /**
   * Returns a new roadmap object with phases and tasks reordered .
   *
   * @param {Object} roadmap - The validated roadmap JSON.
   * @param {Object} userConstraints - User's timeline, experience, and scope.
   * @returns {Object} Optimized roadmap.
   */
  async prioritizeRoadmap(roadmap, userConstraints) {
    try {
      this.validateInputs(roadmap, userConstraints);
      
      // Get dynamic configuration based on project analysis
      const projectConfig = this.config.getProjectConfig(roadmap, userConstraints);
      const constraints = this.parseConstraints(userConstraints, projectConfig.timelineParsers);
      
      const optimizedPhases = this.optimizePhaseOrder(roadmap.phases, constraints, projectConfig);
      const finalPhases = this.optimizeTaskOrder(optimizedPhases, constraints, projectConfig);
      
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
   * @param {Array} phases
   * @param {Object} constraints
   * @param {Object} projectConfig
   * @returns {Array} Reordered phases
   */
  optimizePhaseOrder(phases, constraints, projectConfig) {
    const scoredPhases = phases.map((phase, index) => ({
      phase,
      score: this.calculatePhaseScore(phase, constraints, projectConfig, index),
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
   * @param {Object} phase
   * @param {Object} constraints
   * @param {Object} projectConfig
   * @param {number} originalIndex
   * @returns {number}
   */
  calculatePhaseScore(phase, constraints, projectConfig, originalIndex) {
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
   * @param {Array} phases
   * @param {Object} constraints
   * @param {Object} projectConfig
   * @returns {Array}
   */
  optimizeTaskOrder(phases, constraints, projectConfig) {
    return phases.map(phase => ({
      ...phase,
      milestones: phase.milestones.map(milestone => ({
        ...milestone,
        tasks: this.reorderTasks(milestone.tasks, constraints, projectConfig)
      }))
    }));
  }

  /**
   * Orders tasks within a milestone by type and original order using configuration.
   * @param {Array} tasks
   * @param {Object} constraints
   * @param {Object} projectConfig
   * @returns {Array}
   */
  reorderTasks(tasks, constraints, projectConfig) {
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
   * @param {Object} userConstraints
   * @param {Object} timelineParsers
   * @returns {Object}
   */
  parseConstraints(userConstraints, timelineParsers) {
    return {
      timeline: parseTimeline(userConstraints.timeline, timelineParsers),
      experience: userConstraints.experienceLevel || 'beginner',
      scope: userConstraints.scope || 'mvp'
    };
  }

  /**
   * Converts a timeline string to a number of days.
   * @param {string} timeline
   * @returns {number}
   */
  parseTimeline(timeline) {
    if (!timeline) return 30;
    const dayMatch = timeline.match(/day[s]? (\d+)/i);
    const weekMatch = timeline.match(/week[s]? (\d+)/i);
    const monthMatch = timeline.match(/month[s]? (\d+)/i);
    const yearMatch = timeline.match(/year[s]? (\d+)/i);
    if (dayMatch) return parseInt(dayMatch[1]);
    if (weekMatch) return parseInt(weekMatch[1]) * 7;
    if (monthMatch) return parseInt(monthMatch[1]) * 30;
    if (yearMatch) return parseInt(yearMatch[1]) * 365;
    const numMatch = timeline.match(/(\d+)/);
    if (numMatch) return parseInt(numMatch[1]);
    return 30;
  }

  /**
   * Validates roadmap and user constraints.
   * @param {Object} roadmap
   * @param {Object} userConstraints
   */
  validateInputs(roadmap, userConstraints) {
    if (!roadmap || !roadmap.phases || !Array.isArray(roadmap.phases)) {
      throw new Error('Invalid roadmap structure');
    }
    if (!userConstraints) {
      throw new Error('User constraints are required');
    }
  }

  /**
   * Returns optimization factors for metadata.
   * @param {Object} constraints
   * @returns {Object}
   */
  getOptimizationFactors(constraints) {
    return {
      weights: this.weights,
      riskMatrix: this.riskMatrix,
      learningPatterns: this.learningPatterns,
      appliedConstraints: constraints
    };
  }
}

module.exports = RoadmapPrioritizationService; 