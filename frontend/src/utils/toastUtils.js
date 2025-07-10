import toast from 'react-hot-toast';

/**
 * Toast notification utilities
 * 
 * Provides standardized toast notifications with consistent styling
 * and configuration
 * 
 * TODO: Add theme.js and refactor all toasts to use centralized theme configuration
 */

// Toast Configuration Constants
const TOAST_CONFIG = {
  SUCCESS_DURATION: 3000,
  ERROR_DURATION: 4000,
  POSITION: 'top-right',
  SUCCESS_BACKGROUND: '#10B981',
  ERROR_BACKGROUND: '#EF4444',
  TEXT_COLOR: '#fff'
};

export const showSuccessToast = (message, options = {}) => {
  toast.success(message, {
    duration: TOAST_CONFIG.SUCCESS_DURATION,
    position: TOAST_CONFIG.POSITION,
    style: {
      background: TOAST_CONFIG.SUCCESS_BACKGROUND,
      color: TOAST_CONFIG.TEXT_COLOR,
    },
    ...options,
  });
};

export const showErrorToast = (message, options = {}) => {
  toast.error(message, {
    duration: TOAST_CONFIG.ERROR_DURATION,
    position: TOAST_CONFIG.POSITION,
    style: {
      background: TOAST_CONFIG.ERROR_BACKGROUND,
      color: TOAST_CONFIG.TEXT_COLOR,
    },
    ...options,
  });
}; 