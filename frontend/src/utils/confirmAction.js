/**
 * confirmAction.js.
 *
 * This function provides ask users for confirmation clearing the New Project Chat state.
 *
 * Usage:
 *   import confirmAction from '@/utils/confirmAction';
 *   const shouldProceed = confirmAction('Are you sure you want to start over?');
 *   if (shouldProceed) {
 *     // Proceed with action
 *   }
 *
 * @param {string} message - The confirmation message to display
 * @param {string} title - Optional title for the dialog (defaults to 'Confirm Action')
 * @returns {boolean} - True if user confirmed, false if cancelled
 */

const confirmAction = (message, title = 'Confirm Action') => {
  return window.confirm(`${title}\n\n${message}`);
};

export default confirmAction; 