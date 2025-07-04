import { DateTime } from 'luxon';

/**
 * Date formatting utilities using Luxon
 * 
 * Provides consistent date formatting across the application
 * with proper timezone handling and localization
 */

/**
 * Create an ISO timestamp for database storage
 * 
 * @returns {string} ISO timestamp string
 */
export const createISOTimestamp = () => {
  return DateTime.now().toISO();
};

/**
 * Format a date string for display in a user-friendly format
 * 
 * @param {string} dateString - ISO date string
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString, options = {}) => {
  if (!dateString) return 'N/A';

  try {
    const date = DateTime.fromISO(dateString);
    
    if (!date.isValid) {
      console.warn('Invalid date string:', dateString);
      return 'Invalid Date';
    }

    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };

    const formatOptions = { ...defaultOptions, ...options };
    
    return date.toLocaleString(DateTime.DATETIME_FULL);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
}; 