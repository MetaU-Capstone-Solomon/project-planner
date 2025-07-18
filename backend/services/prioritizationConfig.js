const fs = require('fs');
const path = require('path');

/**
 * Prioritization Configuration Service
 * 
 * Loads and manages prioritization configuration from external JSON files.
 * Provides dynamic configuration based on project type and domain detection.
 */
class PrioritizationConfig {
  constructor() {
    this.config = this.loadConfig();
  }

  /**
   * Loads configuration from JSON file with fallback to defaults
   * @returns {Object} Configuration object
   */
  loadConfig() {
    try {
      const configPath = path.join(__dirname, '../config/prioritization.json');
      const configData = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(configData);
    } catch (error) {
      console.warn('Failed to load prioritization config, using defaults:', error.message);
      return this.getDefaultConfig();
    }
  }

  /**
   * Returns default configuration if file loading fails
   * @returns {Object} Default configuration
   */
  getDefaultConfig() {
    return {
      weights: {
        default: {
          logical_order: 0.35,
          timeline_optimization: 0.25,
          experience_alignment: 0.20,
          scope_relevance: 0.15,
          risk_assessment: 0.05
        }
      },
      domain_keywords: {
        'mobile-app': [
          'react native', 'flutter', 'ios', 'android', 'mobile', 'app store',
          'xcode', 'android studio', 'swift', 'kotlin', 'mobile app', 'native app'
        ],
        'ai-project': [
          'tensorflow', 'pytorch', 'machine learning', 'ml', 'ai', 'neural',
          'model training', 'data science', 'deep learning', 'artificial intelligence',
          'natural language processing', 'nlp', 'computer vision', 'cv'
        ],
        'web-app': [
          'react', 'angular', 'vue', 'node.js', 'express', 'frontend', 'backend',
          'api', 'javascript', 'html', 'css', 'web app', 'website', 'web application'
        ]
      },
      risk_matrices: {
        'web-app': {
          setup: { risk: 1, impact: 3, complexity: 1 },
          development: { risk: 2, impact: 3, complexity: 2 },
          deployment: { risk: 2, impact: 3, complexity: 2 }
        }
      },
      learning_patterns: {
        beginner: ['foundation', 'basic-concepts', 'testing', 'deployment'],
        intermediate: ['foundation', 'development', 'testing', 'deployment'],
        advanced: ['foundation', 'development', 'optimization', 'deployment'],
        expert: ['foundation', 'development', 'optimization', 'deployment']
      },
      timeline_parsers: {
        day: { pattern: '/day[s]? (\\d+)/i', multiplier: 1 },
        week: { pattern: '/week[s]? (\\d+)/i', multiplier: 7 },
        month: { pattern: '/month[s]? (\\d+)/i', multiplier: 30 }
      },
      task_patterns: {
        setup: { keywords: ['setup', 'install', 'configure'], score: 100 },
        development: { keywords: ['development', 'build', 'create'], score: 80 },
        testing: { keywords: ['testing', 'test'], score: 60 },
        deployment: { keywords: ['deploy', 'deployment'], score: 40 }
      },
      phase_patterns: {
        setup: { keywords: ['setup', 'planning', 'foundation'], score: 100 },
        development: { keywords: ['development', 'build', 'implementation'], score: 80 },
        testing: { keywords: ['testing', 'test', 'deploy'], score: 60 },
        documentation: { keywords: ['documentation', 'maintenance'], score: 40 }
      }
    };
  }

  /**
   * Detects project type based on roadmap content
   * @param {Object} roadmap - The roadmap to analyze
   * @returns {string} Project type (mvp, full-featured, enterprise-level, default)
   */
  detectProjectType(roadmap) {
    const content = JSON.stringify(roadmap).toLowerCase();
    
    // Check for enterprise indicators
    if (content.includes('enterprise') || content.includes('scalable') || 
        content.includes('microservices') || content.includes('distributed')) {
      return 'enterprise-level';
    }
    
    // Check for MVP indicators
    if (content.includes('mvp') || content.includes('minimum viable') || 
        content.includes('core features') || content.includes('basic')) {
      return 'mvp';
    }
    
    // Check for full-featured indicators
    if (content.includes('full') || content.includes('complete') || 
        content.includes('advanced features') || content.includes('comprehensive')) {
      return 'full-featured';
    }
    
    return 'default';
  }

  /**
   * Detects project domain based on keyword frequency analysis
   * @param {Object} roadmap - The roadmap to analyze
   * @returns {string} Domain (web-app, mobile-app, ai-project, default)
   */
  detectDomain(roadmap) {
    const content = JSON.stringify(roadmap).toLowerCase();
    
    // Get domain keywords from configuration
    const domainKeywords = this.config.domain_keywords || this.getDefaultDomainKeywords();
    
    // Initialize domain scores
    const domainScores = {};
    Object.keys(domainKeywords).forEach(domain => {
      domainScores[domain] = 0;
    });
    
    // Count keyword frequency for each domain
    Object.entries(domainKeywords).forEach(([domain, keywords]) => {
      keywords.forEach(keyword => {
        const regex = new RegExp(keyword, 'gi');
        const matches = content.match(regex);
        if (matches) {
          domainScores[domain] += matches.length;
        }
      });
    });
    
    // Find domain with highest score
    const maxScore = Math.max(...Object.values(domainScores));
    const detectedDomain = Object.keys(domainScores).find(domain => 
      domainScores[domain] === maxScore
    );
    
    // Return detected domain or default
    return detectedDomain || 'web-app';
  }

  /**
   * Returns default domain keywords configuration
   * @returns {Object} Default domain keywords
   */
  getDefaultDomainKeywords() {
    return {
      'mobile-app': [
        'react native', 'flutter', 'ios', 'android', 'mobile', 'app store',
        'xcode', 'android studio', 'swift', 'kotlin', 'mobile app', 'native app'
      ],
      'ai-project': [
        'tensorflow', 'pytorch', 'machine learning', 'ml', 'ai', 'neural',
        'model training', 'data science', 'deep learning', 'artificial intelligence',
        'natural language processing', 'nlp', 'computer vision', 'cv'
      ],
      'web-app': [
        'react', 'angular', 'vue', 'node.js', 'express', 'frontend', 'backend',
        'api', 'javascript', 'html', 'css', 'web app', 'website', 'web application'
      ]
    };
  }

  /**
   * Gets weights configuration for a specific project type
   * @param {string} projectType - The detected project type
   * @returns {Object} Weights configuration
   */
  getWeights(projectType = 'default') {
    return this.config.weights[projectType] || this.config.weights.default;
  }

  /**
   * Gets risk matrix for a specific domain
   * @param {string} domain - The detected domain
   * @returns {Object} Risk matrix
   */
  getRiskMatrix(domain = 'web-app') {
    return this.config.risk_matrices[domain] || this.config.risk_matrices['web-app'];
  }

  /**
   * Gets learning patterns for a specific experience level
   * @param {string} experienceLevel - User experience level
   * @returns {Array} Learning pattern
   */
  getLearningPatterns(experienceLevel = 'beginner') {
    return this.config.learning_patterns[experienceLevel.toLowerCase()] || 
           this.config.learning_patterns.beginner;
  }

  /**
   * Gets timeline parser configuration
   * @returns {Object} Timeline parser configuration
   */
  getTimelineParsers() {
    return this.config.timeline_parsers;
  }

  /**
   * Gets task patterns for scoring
   * @returns {Object} Task patterns configuration
   */
  getTaskPatterns() {
    return this.config.task_patterns;
  }

  /**
   * Gets phase patterns for scoring
   * @returns {Object} Phase patterns configuration
   */
  getPhasePatterns() {
    return this.config.phase_patterns;
  }

  /**
   * Gets complete configuration for a specific project
   * @param {Object} roadmap - The roadmap to analyze
   * @param {Object} userConstraints - User constraints
   * @returns {Object} Complete configuration object
   */
  getProjectConfig(roadmap, userConstraints) {
    const projectType = this.detectProjectType(roadmap);
    const domain = this.detectDomain(roadmap);
    
    return {
      weights: this.getWeights(projectType),
      riskMatrix: this.getRiskMatrix(domain),
      learningPatterns: this.getLearningPatterns(userConstraints?.experienceLevel),
      timelineParsers: this.getTimelineParsers(),
      taskPatterns: this.getTaskPatterns(),
      phasePatterns: this.getPhasePatterns(),
      metadata: {
        detectedProjectType: projectType,
        detectedDomain: domain,
        appliedConstraints: userConstraints
      }
    };
  }

  /**
   * Reloads configuration from file 
   */
  reloadConfig() {
    this.config = this.loadConfig();
  }
}

module.exports = PrioritizationConfig; 