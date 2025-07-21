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
    // Extended surface colors for common patterns
    page: 'bg-gray-100 dark:bg-gray-800',
    container: 'bg-white dark:bg-gray-900',
    section: 'bg-gray-50 dark:bg-gray-800',
    input: 'bg-gray-50 dark:bg-gray-700',
    modal: 'bg-white dark:bg-gray-900',
  },

  // Text colors
  text: {
    primary: 'text-text-primary',
    secondary: 'text-text-secondary',
    tertiary: 'text-text-tertiary',
    inverse: 'text-text-inverse',
    link: 'text-text-link',
    linkHover: 'hover:text-text-linkHover',
    // Extended text colors for common patterns
    heading: 'text-gray-900 dark:text-white',
    body: 'text-gray-600 dark:text-gray-100',
    muted: 'text-gray-500 dark:text-gray-200',
    placeholder: 'placeholder-gray-500 dark:placeholder-gray-400',
  },

  // Border colors
  border: {
    primary: 'border-border-primary',
    secondary: 'border-border-secondary',
    focus: 'focus:border-border-focus',
    // Extended border colors for common patterns
    input: 'border-gray-300 dark:border-gray-600',
    card: 'border-gray-200 dark:border-gray-600',
    divider: 'border-gray-200 dark:border-gray-700',
    focus: 'focus:border-blue-500 dark:focus:border-blue-400',
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

  // Action button colors
  action: {
    reorder: {
      icon: 'text-blue-600 dark:text-blue-400',
      hover: 'hover:bg-blue-100 dark:hover:bg-blue-900/30',
    },
    delete: {
      icon: 'text-red-600 dark:text-red-400',
      hover: 'hover:bg-red-100 dark:hover:bg-red-900/30',
    },
    edit: {
      icon: 'text-gray-900 dark:text-white',
      hover: 'hover:bg-gray-100 dark:hover:bg-gray-700',
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

  // Landing page specific colors
  landing: {
    // Background colors for landing page
    backgrounds: {
      primary: 'bg-white dark:bg-gray-800',
      secondary: 'bg-gray-50 dark:bg-gray-800',
      hero: 'bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800',
      content: 'bg-white dark:bg-gray-800',
      testimonials: 'bg-gray-50 dark:bg-gray-800',
      card: 'bg-white/95 dark:bg-gray-900/95',
    },

    // Text colors for landing page
    text: {
      primary: 'text-gray-900 dark:text-white',
      secondary: 'text-gray-700 dark:text-gray-100',
      muted: 'text-gray-600 dark:text-gray-200',
      accent: 'text-orange-300',
    },

    // Border colors for landing page
    border: {
      primary: 'border-gray-200 dark:border-gray-700',
      hover: 'hover:border-orange-200 dark:hover:border-orange-300',
    },

    // Button colors for landing page
    buttons: {
      hero: {
        background: 'bg-white',
        border: 'border-white',
        text: 'text-gray-900',
        hover: {
          background: 'hover:bg-orange-300',
          text: 'hover:text-gray-900',
        },
      },
    },

    // Shadow colors for landing page
    shadows: {
      cards: {
        light: 'shadow-lg hover:shadow-xl hover:shadow-orange-100',
        dark: 'dark:shadow-lg dark:hover:shadow-md dark:hover:shadow-orange-300/30',
      },
    },
  },
};

// Utility functions for dynamic color selection
export const getExperienceColor = (level) => {
  const colors = {
    Beginner: COLOR_CLASSES.experience.beginner,
    Intermediate: COLOR_CLASSES.experience.intermediate,
    Advanced: COLOR_CLASSES.experience.advanced,
    Expert: COLOR_CLASSES.experience.expert,
  };

  return colors[level] || COLOR_CLASSES.experience.beginner;
};

export const getScopeColor = (scope) => {
  const colors = {
    MVP: COLOR_CLASSES.scope.mvp,
    'Full-featured': COLOR_CLASSES.scope.fullFeatured,
    'Enterprise-level': COLOR_CLASSES.scope.enterprise,
  };

  return colors[scope] || COLOR_CLASSES.scope.mvp;
};

export const getStatusColor = (status) => {
  const colors = {
    success: COLOR_CLASSES.status.success,
    warning: COLOR_CLASSES.status.warning,
    error: COLOR_CLASSES.status.error,
    info: COLOR_CLASSES.status.info,
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
    input: `${COLOR_CLASSES.border.input} focus:${COLOR_CLASSES.border.focus}`,
    label: COLOR_CLASSES.text.body,
    error: COLOR_CLASSES.status.error,
    success: COLOR_CLASSES.status.success,
  },

  // Navigation styling
  nav: {
    active: 'bg-primary-100 text-primary-700',
    inactive: COLOR_CLASSES.text.secondary,
    hover: 'hover:bg-gray-100 hover:text-gray-900',
  },

  // Landing page specific patterns
  landing: {
    // Card styling for landing page
    card: `${COLOR_CLASSES.landing.backgrounds.card} ${COLOR_CLASSES.landing.border.primary} rounded-xl p-8 shadow-lg transition-all duration-300 hover:-translate-y-1 ${COLOR_CLASSES.landing.border.hover} ${COLOR_CLASSES.landing.shadows.cards.light} ${COLOR_CLASSES.landing.shadows.cards.dark}`,

    // Hero button styling
    heroButton: `${COLOR_CLASSES.landing.buttons.hero.background} ${COLOR_CLASSES.landing.buttons.hero.border} ${COLOR_CLASSES.landing.buttons.hero.text} border-2 font-semibold transition-colors duration-200 ${COLOR_CLASSES.landing.buttons.hero.hover.background} ${COLOR_CLASSES.landing.buttons.hero.hover.text}`,

    // Section backgrounds
    hero: `${COLOR_CLASSES.landing.backgrounds.hero} pb-16 pt-24`,
    contentSection: `${COLOR_CLASSES.landing.backgrounds.content} py-16`,
    testimonialsSection: `${COLOR_CLASSES.landing.backgrounds.testimonials} py-16`,
  },

  // Common component patterns
  components: {
    // Page layout
    page: `${COLOR_CLASSES.surface.page} min-h-screen p-6`,
    container: `${COLOR_CLASSES.surface.container} rounded-xl shadow-lg`,

    // Form elements
    input: `${COLOR_CLASSES.surface.input} ${COLOR_CLASSES.border.input} ${COLOR_CLASSES.text.heading} ${COLOR_CLASSES.text.placeholder} rounded-md px-3 py-2 w-full border shadow-sm hover:bg-gray-100 dark:hover:bg-gray-600 focus:${COLOR_CLASSES.border.focus} focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400`,

    // Section dividers
    divider: `${COLOR_CLASSES.border.divider} border-b pb-6`,

    // Modal styling
    modal: {
      overlay:
        'fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 p-4',
      container: `${COLOR_CLASSES.surface.modal} relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl shadow-2xl border border-gray-200 dark:border-gray-600`,
    },
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
