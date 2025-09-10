/**
 * Form Constants for Project Planner
 *
 * This file provides centralized form configuration constants
 * for consistent form behavior across the application.
 */

// Email validation regex
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Form field limits
export const FORM_LIMITS = {
  MESSAGE_MAX_LENGTH: 500,
  EMAIL_MAX_LENGTH: 255,
  TITLE_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 1000,
};

// Modal sizes
export const MODAL_SIZES = {
  SMALL: 'max-w-md',
  MEDIUM: 'max-w-lg',
  LARGE: 'max-w-2xl',
  EXTRA_LARGE: 'max-w-4xl',
};

// Form field types
export const FIELD_TYPES = {
  EMAIL: 'email',
  TEXT: 'text',
  TEXTAREA: 'textarea',
  SELECT: 'select',
  PASSWORD: 'password',
};

// Button configurations
export const BUTTON_CONFIGS = {
  INVITE_BUTTON: {
    CLASSES: 'flex items-center gap-3 rounded-full bg-blue-600 px-6 py-5 text-white shadow-lg transition-all duration-200 hover:bg-blue-700 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-800',
    ICON_SIZE: 'h-6 w-6',
    TEXT_SIZE: 'text-base font-medium',
    TITLE: 'Invite Collaborators',
    ARIA_LABEL: 'Invite team members to collaborate on this project',
  },
};

// Default form configurations
export const DEFAULT_FORM_CONFIG = {
  MODAL_SIZE: MODAL_SIZES.MEDIUM,
  EMAIL_VALIDATION: EMAIL_REGEX,
  MESSAGE_LIMIT: FORM_LIMITS.MESSAGE_MAX_LENGTH,
};

export default {
  EMAIL_REGEX,
  FORM_LIMITS,
  MODAL_SIZES,
  FIELD_TYPES,
  BUTTON_CONFIGS,
  DEFAULT_FORM_CONFIG,
};
