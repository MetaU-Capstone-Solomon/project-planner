import { COLOR_CLASSES } from '@/constants/colors';

/**
 * Form utility functions for styling and behavior
 * 
 * Provides reusable styling functions that follow the app's design system
 * and color patterns using COLOR_CLASSES.
 */

/**
 * Get consistent input styling classes with error states and sizing options
 * 
 * @param {boolean} [hasError=false] - Whether to apply error styling
 * @param {'sm'|'default'|'lg'} [size='default'] - Input size variant
 * @returns {string} Tailwind CSS classes for input styling
 */
export const getInputClasses = (hasError = false, size = 'default') => {
  const baseClasses = `${COLOR_CLASSES.text.heading} bg-gray-100 dark:bg-gray-700 border rounded focus:${COLOR_CLASSES.border.focus} focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 outline-none transition-all duration-200`;
  
  const errorClasses = hasError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600';
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    default: 'text-sm px-3 py-2',
    lg: 'text-base px-4 py-3'
  };

  return `w-full ${sizeClasses[size]} ${baseClasses} ${errorClasses}`;
};

export const getResourceCountClasses = (hasResources) => {
  return `text-xs px-2 py-1 rounded-full ${
    hasResources 
      ? `${COLOR_CLASSES.status.info.bg} ${COLOR_CLASSES.status.info.text}` 
      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
  }`;
};

export const getButtonClasses = (type = 'secondary', size = 'default') => {
  const baseClasses = 'rounded transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800';
  
  const typeClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white',
    success: `${COLOR_CLASSES.status.success.bg} ${COLOR_CLASSES.status.success.text}`,
    error: `${COLOR_CLASSES.status.error.bg} ${COLOR_CLASSES.status.error.text}`,
    info: `${COLOR_CLASSES.status.info.bg} ${COLOR_CLASSES.status.info.text}`
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    default: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  };

  return `${baseClasses} ${typeClasses[type]} ${sizeClasses[size]}`;
}; 