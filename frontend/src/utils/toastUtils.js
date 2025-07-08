import toast from 'react-hot-toast';

/**
 * Toast notification utilities
 * 
 * Provides standardized toast notifications with consistent styling
 * and configuration
 */

export const showSuccessToast = (message, options = {}) => {
  toast.success(message, {
    duration: 3000,
    position: 'top-right',
    style: {
      background: '#10B981',
      color: '#fff',
    },
    ...options,
  });
};

export const showErrorToast = (message, options = {}) => {
  toast.error(message, {
    duration: 4000,
    position: 'top-right',
    style: {
      background: '#EF4444',
      color: '#fff',
    },
    ...options,
  });
}; 