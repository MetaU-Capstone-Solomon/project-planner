import React from 'react';
import { Calendar, Clock, CheckCircle } from 'lucide-react';
import { calculatePhaseProgress } from '@/utils/roadmapUtils';
import { TASK_STATUS } from '@/constants/roadmap';
import { COLOR_CLASSES } from '@/constants/colors';
import { getPhaseColor } from '@/utils/roadmapUtils';

/**
 * PhaseCardNew Component - Card-style phase display
 *
 * Displays a project phase as a card similar to dashboard ProjectCard.
 * Shows phase information, progress, and task counts with hover effects.
 *
 * CALCULATIONS PERFORMED:
 * 1. Phase Progress: Uses calculatePhaseProgress() utility to compute overall phase completion
 *    - Calculates percentage based on completed tasks vs total tasks across all milestones
 *    - Returns 0-100 percentage value for progress bar display
 *
 *
 * 3. Task Counts:
 *    - Total Tasks: Sums all tasks across all milestones in the phase
 *    - Completed Tasks: Counts only tasks with status === TASK_STATUS.COMPLETED
 *    - Handles missing milestones/tasks gracefully with null checks
 *
 * 4. Milestone Count: Displays total number of milestones in the phase
 *
 * @param {Object} props - Component props
 * @param {Object} props.phase - Phase data object
 * @param {number} props.phase.order - Phase sequence number (1, 2, 3, etc.)
 * @param {string} props.phase.title - Phase title/name
 * @param {string} props.phase.timeline - Phase timeline description
 * @param {Array} props.phase.milestones - Array of milestone objects
 * @param {Array} props.phase.milestones[].tasks - Array of task objects
 * @param {string} props.phase.milestones[].tasks[].status - Task status ('pending', 'completed', etc.)
 * @param {Function} [props.onClick] - Optional click handler for opening modal
 */
const PhaseCardNew = ({ phase, onClick }) => {
  // Calculate phase progress percentage (0-100)
  const progress = calculatePhaseProgress(phase);

  // Get phase color classes based on order (cycles through color palette)
  const phaseColorClasses = getPhaseColor(phase.order);

  // Calculate total tasks across all milestones in this phase
  const totalTasks = phase.milestones
    ? phase.milestones.reduce(
        (total, milestone) => total + (milestone.tasks ? milestone.tasks.length : 0),
        0
      )
    : 0;

  // Calculate completed tasks (status === 'completed') across all milestones
  const completedTasks = phase.milestones
    ? phase.milestones.reduce(
        (total, milestone) =>
          total +
          (milestone.tasks
            ? milestone.tasks.filter((task) => task.status === TASK_STATUS.COMPLETED).length
            : 0),
        0
      )
    : 0;

  return (
    <div
      className={`${COLOR_CLASSES.surface.card} rounded-lg shadow-sm ${COLOR_CLASSES.border.primary} border-l-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-blue-200 hover:shadow-blue-200 ${phaseColorClasses} cursor-pointer`}
      onClick={onClick}
    >
      <div className="p-6">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <h3 className={`text-lg font-semibold ${COLOR_CLASSES.text.primary} truncate`}>
              Phase {phase.order}: {phase.title}
            </h3>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <span className={`text-sm font-medium ${COLOR_CLASSES.text.secondary}`}>Progress</span>
            <span className={`text-sm font-semibold ${COLOR_CLASSES.text.primary}`}>
              {progress}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Metadata */}
        <div className="space-y-2">
          <div className={`flex items-center text-sm ${COLOR_CLASSES.text.secondary}`}>
            <Calendar className="mr-2 h-4 w-4" />
            <span>{phase.timeline}</span>
          </div>

          <div className={`flex items-center text-sm ${COLOR_CLASSES.text.secondary}`}>
            <Clock className="mr-2 h-4 w-4" />
            <span>
              {completedTasks}/{totalTasks} tasks completed
            </span>
          </div>

          <div className={`flex items-center text-sm ${COLOR_CLASSES.text.secondary}`}>
            <CheckCircle className="mr-2 h-4 w-4" />
            <span>{phase.milestones ? phase.milestones.length : 0} milestones</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhaseCardNew;
