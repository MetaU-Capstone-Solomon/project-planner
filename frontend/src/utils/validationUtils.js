/**
 * Validation utility functions for forms
 * 
 * Provides reusable validation functions that follow the app's validation patterns
 * and use constants from the messages and forms configuration.
 */

import { EMAIL_REGEX, FORM_LIMITS } from '@/constants/forms';
import { MESSAGES } from '@/constants/messages';

/**
 * Validate email format
 * 
 * @param {string} email - Email to validate
 * @returns {boolean} - Whether email is valid
 */
export const validateEmail = (email) => {
  return EMAIL_REGEX.test(email);
};

/**
 * Validate email with error message
 * 
 * @param {string} email - Email to validate
 * @returns {Object} - Validation result with isValid and error message
 */
export const validateEmailWithMessage = (email) => {
  if (!email || !email.trim()) {
    return {
      isValid: false,
      error: MESSAGES.VALIDATION.EMAIL_REQUIRED
    };
  }
  
  if (!validateEmail(email)) {
    return {
      isValid: false,
      error: MESSAGES.VALIDATION.EMAIL_INVALID
    };
  }
  
  return {
    isValid: true,
    error: null
  };
};

/**
 * Validate text length
 * 
 * @param {string} text - Text to validate
 * @param {number} maxLength - Maximum allowed length
 * @returns {Object} - Validation result with isValid and error message
 */
export const validateTextLength = (text, maxLength) => {
  if (text && text.length > maxLength) {
    return {
      isValid: false,
      error: MESSAGES.VALIDATION.MESSAGE_TOO_LONG
    };
  }
  
  return {
    isValid: true,
    error: null
  };
};

/**
 * Validate required field
 * 
 * @param {string} value - Value to validate
 * @param {string} fieldName - Name of the field for error message
 * @returns {Object} - Validation result with isValid and error message
 */
export const validateRequired = (value, fieldName = 'Field') => {
  if (!value || !value.trim()) {
    return {
      isValid: false,
      error: `${fieldName} is required`
    };
  }
  
  return {
    isValid: true,
    error: null
  };
};

/**
 * Get form validation state
 * 
 * @param {Object} errors - Object containing field errors
 * @returns {boolean} - Whether form is valid (no errors)
 */
export const isFormValid = (errors) => {
  return Object.keys(errors).length === 0;
};

export default {
  validateEmail,
  validateEmailWithMessage,
  validateTextLength,
  validateRequired,
  isFormValid,
};
