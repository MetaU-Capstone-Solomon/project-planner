import { calculateOverallProgress } from '@/utils/roadmapUtils';

/**
 * Dashboard Statistics Calculator
 * 
 * Calculates real-time statistics from user's roadmap projects for dashboard display.
 * 
 * STATISTICS CALCULATED:
 * - Total Projects: Count of all user projects
 * - Completed Projects: Projects with 100% progress
 * - Overall Progress: Average progress across all projects
 * - Active Milestones: Completed milestones vs total milestones
 * 
 * CALCULATION LOGIC:
 * - Parses JSON roadmap content from each project
 * - Uses existing roadmap utilities for progress calculation
 * - Handles missing/invalid data gracefully
 * - Provides meaningful insights for user progress tracking
 * 
 * EXAMPLE RESULTS:
 * - 3 projects (60%, 80%, 100% progress) → Overall Progress: 80%
 * - 10 total milestones, 3 completed → Active Milestones: 3/10
 * 
 * @module dashboardUtils
 */

/**
 * Dashboard utility functions
 * 
 * Handles:
 * - Project statistics calculations
 * - Data processing and formatting
 * - Stats computation logic
 */

/**
 * Calculate project statistics from project data
 * 
 * @param {Array} projects - Array of project objects
 * @returns {Object} Calculated statistics
 */
export const calculateProjectStats = (projects) => {
  if (!projects || projects.length === 0) {
    return {
      totalProjects: 0,
      completedProjects: 0,
      overallProgress: '0%',
      activeMilestones: '0/0'
    };
  }

  let totalMilestones = 0;
  let completedMilestones = 0;
  let totalProgress = 0;
  let completedProjects = 0;

  projects.forEach(project => {
    try {
      const roadmapData = JSON.parse(project.content);
      if (roadmapData?.phases) {
        // Calculate project progress
        const projectProgress = calculateOverallProgress(roadmapData.phases);
        totalProgress += projectProgress;
        
        // Count as completed if progress is 100%
        if (projectProgress >= 100) {
          completedProjects++;
        }

        // Calculate milestone stats
        roadmapData.phases.forEach(phase => {
          if (phase.milestones) {
            totalMilestones += phase.milestones.length;
            
            // Count completed milestones (all tasks completed)
            phase.milestones.forEach(milestone => {
              if (milestone.tasks) {
                const allTasksCompleted = milestone.tasks.every(task => 
                  task.status === 'completed'
                );
                if (allTasksCompleted) {
                  completedMilestones++;
                }
              }
            });
          }
        });
      }
    } catch (error) {
      console.warn('Failed to parse project content:', error);
    }
  });

  const averageProgress = projects.length > 0 ? Math.round(totalProgress / projects.length) : 0;

  return {
    totalProjects: projects.length,
    completedProjects,
    overallProgress: `${averageProgress}%`,
    activeMilestones: `${completedMilestones}/${totalMilestones}`
  };
};

/**
 * Calculate completion percentage for a project
 * 
 * @param {Object} project - Project object with phases and tasks
 * @returns {number} Completion percentage (0-100)
 */
export const calculateProjectCompletion = (project) => {
  try {
    const roadmapData = JSON.parse(project.content);
    if (roadmapData?.phases) {
      return calculateOverallProgress(roadmapData.phases);
    }
  } catch (error) {
    console.warn('Failed to parse project content:', error);
  }
  return 0;
};

/**
 * Calculate total milestones across all projects
 * 
 * @param {Array} projects - Array of project objects
 * @returns {Object} Milestone statistics
 */
export const calculateMilestoneStats = (projects) => {
  let total = 0;
  let completed = 0;
  let active = 0;

  projects.forEach(project => {
    try {
      const roadmapData = JSON.parse(project.content);
      if (roadmapData?.phases) {
        roadmapData.phases.forEach(phase => {
          if (phase.milestones) {
            total += phase.milestones.length;
            
            phase.milestones.forEach(milestone => {
              if (milestone.tasks) {
                const allTasksCompleted = milestone.tasks.every(task => 
                  task.status === 'completed'
                );
                const hasCompletedTasks = milestone.tasks.some(task => 
                  task.status === 'completed'
                );
                
                if (allTasksCompleted) {
                  completed++;
                } else if (hasCompletedTasks) {
                  active++;
                }
              }
            });
          }
        });
      }
    } catch (error) {
      console.warn('Failed to parse project content:', error);
    }
  });

  return { total, completed, active };
}; 