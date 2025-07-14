/**
 * resetNewProjectState.js
 *
 * Utility function to completely reset the New Project Chat flow.
 *
 * This function clears localStorage AND provides a callback mechanism to reset
 * React component states, giving a complete fresh start.
 *
 * Keys cleared: New Project Chat state, New Project Chat form state, New Project Chat file state, New Project Chat processed file state.
 *
 * Usage:
 *   import resetNewProjectState from '@/utils/resetNewProjectState';
 *   resetNewProjectState(); // Clears localStorage
 */

const resetNewProjectState = () => {
  // Clear localStorage
  try {
    localStorage.removeItem('chatMessages');
    localStorage.removeItem('chatStage');
    localStorage.removeItem('projectTitle');
    localStorage.removeItem('projectForm');
    localStorage.removeItem('projectFile');
    localStorage.removeItem('processedFile');
  } catch (error) {

    console.warn('Failed to clear new project state from localStorage:', error);
  }


};

export default resetNewProjectState; 