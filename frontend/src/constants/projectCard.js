/**
 * ProjectCard Constants
 * 
 * Color schemes and utility functions for project card display
 */

/**
 * Get progress bar color based on completion percentage
 * 
 * @param {number} progress - Progress percentage (0-100)
 * @returns {string} Tailwind CSS color class
 */
export const getProgressColor = (progress) => {
  if (progress >= 80) return 'bg-green-500';
  if (progress >= 60) return 'bg-blue-500';
  if (progress >= 40) return 'bg-yellow-500';
  if (progress >= 20) return 'bg-orange-500';
  return 'bg-gray-300';
}; 