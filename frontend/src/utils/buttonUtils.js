/**
 * Button utility functions
 * 
/**
 * Get button classes based on disabled state
 * 
 * This function returns CSS classes:
 * - If isDisabled is true: returns disabledClasses
 * - If isDisabled is false: returns baseClasses
 * 
 * @param {boolean} isDisabled - Whether the button should be disabled
 * @param {string} baseClasses - CSS classes for enabled state 
 * @param {string} disabledClasses - CSS classes for disabled state 
 * @returns {string} Combined CSS classes based on disabled state
 * 
 */
export const getButtonClasses = (isDisabled, baseClasses, disabledClasses) => {
  return isDisabled ? disabledClasses : baseClasses;
};

/**
 * Get reorder button state for a list item
 *
 * This function calculates the position-based states for reorder buttons:
 * - canMoveUp: true if item can move up (not first)
 * - canMoveDown: true if item can move down (not last)
 * - isFirst: true if item is at position 0
 * - isLast: true if item is at the last position
 *
 * @param {number} currentIndex - Current position in the list (0-based)
 * @param {number} totalItems - Total number of items in the list
 * @returns {Object} Object containing reorder button states
 */
export const getReorderButtonState = (currentIndex, totalItems) => {
  return {
    canMoveUp: currentIndex > 0, // Can move up if not at position 0
    canMoveDown: currentIndex < totalItems - 1, // Can move down if not at last position
    isFirst: currentIndex === 0, // Is first if at position 0
    isLast: currentIndex === totalItems - 1, // Is last if at last position
  };
};

/**
 * Get disabled button classes with consistent styling
 *
 * @returns {string} CSS classes for disabled buttons
 */
export const getDisabledButtonClasses = () => {
  return 'cursor-not-allowed opacity-50';
};
