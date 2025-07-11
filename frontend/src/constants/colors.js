/**
 * Color Constants for Project Planner
 * 
 * This file provides centralized color definitions and utility functions
 * for consistent theming across the application.
 * 
 * Use:
 * - Use semantic color classes (e.g., 'bg-surface-primary', 'text-text-primary')
 * - Use utility functions for dynamic color selection
 * - All colors are defined in tailwind.config.js for consistency
 */

// Semantic color class mappings
export const COLOR_CLASSES = {
  // Surface colors
  surface: {
    primary: 'bg-surface-primary',
    secondary: 'bg-surface-secondary',
    tertiary: 'bg-surface-tertiary',
    card: 'bg-surface-card',
    cardHover: 'hover:bg-surface-cardHover',
    navbar: 'bg-surface-navbar',
    footer: 'bg-surface-footer',
  },
  
  // Text colors
  text: {
    primary: 'text-text-primary',
    secondary: 'text-text-secondary',
    tertiary: 'text-text-tertiary',
    inverse: 'text-text-inverse',
    link: 'text-text-link',
    linkHover: 'hover:text-text-linkHover',
  },
  
  // Border colors
  border: {
    primary: 'border-border-primary',
    secondary: 'border-border-secondary',
    focus: 'focus:border-border-focus',
  },
  
  // Status colors
  status: {
    success: {
      bg: 'bg-status-success-light',
      text: 'text-status-success-text',
      border: 'border-status-success-main',
    },
    warning: {
      bg: 'bg-status-warning-light',
      text: 'text-status-warning-text',
      border: 'border-status-warning-main',
    },
    error: {
      bg: 'bg-status-error-light',
      text: 'text-status-error-text',
      border: 'border-status-error-main',
    },
    info: {
      bg: 'bg-status-info-light',
      text: 'text-status-info-text',
      border: 'border-status-info-main',
    },
  },
  
  // Experience level colors
  experience: {
    beginner: {
      bg: 'bg-experience-beginner-bg',
      text: 'text-experience-beginner-text',
    },
    intermediate: {
      bg: 'bg-experience-intermediate-bg',
      text: 'text-experience-intermediate-text',
    },
    advanced: {
      bg: 'bg-experience-advanced-bg',
      text: 'text-experience-advanced-text',
    },
    expert: {
      bg: 'bg-experience-expert-bg',
      text: 'text-experience-expert-text',
    },
  },
  
  // Scope colors
  scope: {
    mvp: {
      bg: 'bg-scope-mvp-bg',
      text: 'text-scope-mvp-text',
    },
    fullFeatured: {
      bg: 'bg-scope-fullFeatured-bg',
      text: 'text-scope-fullFeatured-text',
    },
    enterprise: {
      bg: 'bg-scope-enterprise-bg',
      text: 'text-scope-enterprise-text',
    },
  },
};

// Utility functions for dynamic color selection
export const getExperienceColor = (level) => {
  const colors = {
    'Beginner': COLOR_CLASSES.experience.beginner,
    'Intermediate': COLOR_CLASSES.experience.intermediate,
    'Advanced': COLOR_CLASSES.experience.advanced,
    'Expert': COLOR_CLASSES.experience.expert,
  };
  
  return colors[level] || COLOR_CLASSES.experience.beginner;
};

export const getScopeColor = (scope) => {
  const colors = {
    'MVP': COLOR_CLASSES.scope.mvp,
    'Full-featured': COLOR_CLASSES.scope.fullFeatured,
    'Enterprise-level': COLOR_CLASSES.scope.enterprise,
  };
  
  return colors[scope] || COLOR_CLASSES.scope.mvp;
};

export const getStatusColor = (status) => {
  const colors = {
    'success': COLOR_CLASSES.status.success,
    'warning': COLOR_CLASSES.status.warning,
    'error': COLOR_CLASSES.status.error,
    'info': COLOR_CLASSES.status.info,
  };
  
  return colors[status] || COLOR_CLASSES.status.info;
};

// Common color combinations for frequently used patterns
export const COLOR_PATTERNS = {
  // Card styling
  card: {
    container: `${COLOR_CLASSES.surface.card} ${COLOR_CLASSES.border.primary} shadow-sm`,
    hover: `${COLOR_CLASSES.surface.cardHover} ${COLOR_CLASSES.border.primary} shadow-md`,
  },
  
  // Button styling
  button: {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900',
    outline: 'border border-gray-300 hover:bg-gray-50 text-gray-700',
  },
  
  // Form styling
  form: {
    input: `${COLOR_CLASSES.border.primary} focus:${COLOR_CLASSES.border.focus}`,
    label: COLOR_CLASSES.text.secondary,
    error: COLOR_CLASSES.status.error,
    success: COLOR_CLASSES.status.success,
  },
  
  // Navigation styling
  nav: {
    active: 'bg-primary-100 text-primary-700',
    inactive: COLOR_CLASSES.text.secondary,
    hover: 'hover:bg-gray-100 hover:text-gray-900',
  },
};

// Export default
export default {
  CLASSES: COLOR_CLASSES,
  PATTERNS: COLOR_PATTERNS,
  getExperienceColor,
  getScopeColor,
  getStatusColor,
}; 