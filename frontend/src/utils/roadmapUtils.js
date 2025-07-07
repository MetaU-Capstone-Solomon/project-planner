/**
 * Roadmap Utility Functions
 * 
 * Utility functions for roadmap-related operations
 */

import { PHASE_COLORS, DEFAULT_PHASE_COLOR, TASK_STATUS } from '@/constants/roadmap';
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

/**
 * Calculate overall project progress based on completed tasks
 * 
 * @param {Array} phases - Array of phase objects
 * @returns {number} Overall progress percentage (0-100)
 */
export const calculateOverallProgress = (phases) => {
  if (!phases || phases.length === 0) return 0;
  
  let totalTasks = 0;
  let completedTasks = 0;

  phases.forEach(phase => {
    if (phase.milestones) {
      phase.milestones.forEach(milestone => {
        if (milestone.tasks) {
          milestone.tasks.forEach(task => {
            totalTasks++;
            if (task.status === TASK_STATUS.COMPLETED) {
              completedTasks++;
            }
          });
        }
      });
    }
  });

  return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
};

/**
 * Calculate phase progress based on completed tasks
 * 
 * @param {Object} phase - Phase object
 * @returns {number} Phase progress percentage (0-100)
 */
export const calculatePhaseProgress = (phase) => {
  if (!phase || !phase.milestones) return 0;
  
  const phaseTasks = phase.milestones.flatMap(milestone => 
    milestone.tasks ? milestone.tasks : []
  );
  
  if (phaseTasks.length === 0) return 0;
  
  const completedTasks = phaseTasks.filter(task => task.status === TASK_STATUS.COMPLETED).length;
  return Math.round((completedTasks / phaseTasks.length) * 100);
};

/**
 * Calculate milestone progress based on completed tasks
 * 
 * @param {Object} milestone - Milestone object
 * @returns {Object} Progress data with total, completed, and percentage
 */
export const calculateMilestoneProgress = (milestone) => {
  if (!milestone || !milestone.tasks) {
    return { total: 0, completed: 0, percentage: 0 };
  }
  
  const totalTasks = milestone.tasks.length;
  const completedTasks = milestone.tasks.filter(task => task.status === TASK_STATUS.COMPLETED).length;
  const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  return { total: totalTasks, completed: completedTasks, percentage };
};
