/**
 * Roadmap Utility Functions
 * 
 * Utility functions for roadmap-related operations
 */

import { PHASE_COLORS, DEFAULT_PHASE_COLOR } from '@/constants/roadmap';
import { MESSAGES } from '@/constants/messages';

/**
 * Get phase color based on order
 * 
 * @param {number} order - Phase order number
 * @returns {string} CSS classes for phase color styling
 */
export const getPhaseColor = (order) => {
  if (!order || order < 1) return DEFAULT_PHASE_COLOR;
  return PHASE_COLORS[(order - 1) % PHASE_COLORS.length] || DEFAULT_PHASE_COLOR;
};

/**
 * Parse roadmap content from JSON string
 * 
 * @param {string} content - JSON string content
 * @returns {Object|null} Parsed roadmap data or null if invalid
 */
export const parseRoadmapContent = (content) => {
  if (!content) return null;
  
  try {
    const parsedContent = JSON.parse(content);
    if (parsedContent.metadata && parsedContent.phases) {
      return parsedContent;
    }
  } catch (error) {
    console.warn(MESSAGES.VALIDATION.INVALID_ROADMAP_CONTENT, error);
  }
  
  return null;
};

// TODO: Add progress and task count functions when milestones are implemented
// export const calculatePhaseProgress = (phase) => {
//   return 0;
// };
// export const getPhaseTaskCounts = (phase) => {
//   return { total: 0, completed: 0 };
// }; 