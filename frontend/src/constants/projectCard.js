/**
 * ProjectCard Constants
 * 
 * Color schemes and utility functions for project card display
 */

// Progress Threshold Constants
const PROGRESS_THRESHOLDS = {
  EXCELLENT: 80,
  GOOD: 60,
  FAIR: 40,
  POOR: 20
};

/**
 * Get progress bar color based on completion percentage
 * 
 * @param {number} progress - Progress percentage (0-100)
 * @returns {string} Tailwind CSS color class
 */
export const getProgressColor = (progress) => {
  if (progress >= PROGRESS_THRESHOLDS.EXCELLENT) return 'bg-green-500';
  if (progress >= PROGRESS_THRESHOLDS.GOOD) return 'bg-blue-500';
  if (progress >= PROGRESS_THRESHOLDS.FAIR) return 'bg-yellow-500';
  if (progress >= PROGRESS_THRESHOLDS.POOR) return 'bg-orange-500';
  return 'bg-gray-300';
}; 