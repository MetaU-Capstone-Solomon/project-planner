import React from 'react';
import { Calendar, Clock, CheckCircle, Edit2, Trash2, ArrowLeft, ArrowRight } from 'lucide-react';
import { calculatePhaseProgress } from '@/utils/roadmapUtils';
import { TASK_STATUS } from '@/constants/roadmap';
import { getButtonClasses, getDisabledButtonClasses } from '@/utils/buttonUtils';
import { COLOR_CLASSES, COLOR_PATTERNS } from '@/constants/colors';
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
 * @param {Function} [props.onEdit] - Optional edit handler for editing phase title
 * @param {Function} [props.onDelete] - Optional delete handler for deleting phase
 * @param {Function} [props.onReorder] - Optional reorder handler for reordering phase
 * @param {boolean} [props.isFirst] - Whether this is the first phase
 * @param {boolean} [props.isLast] - Whether this is the last phase
 */
const PhaseCardNew = ({ phase, onClick, onEdit, onDelete, onReorder, isFirst, isLast }) => {
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
      className={`${COLOR_PATTERNS.landing.card} border-l-4 ${phaseColorClasses} cursor-pointer`}
      onClick={onClick}
    >
      <div className="px-1 py-4">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <h3
              className={`text-lg font-semibold ${COLOR_CLASSES.text.heading} truncate text-left`}
            >
              Phase {phase.order}: {phase.title}
            </h3>
          </div>
          <div className="flex items-center space-x-1">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(phase);
                }}
                className={`rounded p-0.5 ${COLOR_CLASSES.surface.cardHover} transition-colors ${COLOR_CLASSES.action.edit.hover}`}
                aria-label="Edit phase title"
              >
                <Edit2 className={`h-3 w-3 ${COLOR_CLASSES.action.edit.icon}`} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(phase);
                }}
                className={`rounded p-0.5 ${COLOR_CLASSES.surface.cardHover} transition-colors ${COLOR_CLASSES.action.delete.hover}`}
                aria-label="Delete phase"
              >
                <Trash2 className={`h-3 w-3 ${COLOR_CLASSES.action.delete.icon}`} />
              </button>
            )}
          </div>
        </div>

        {/* Progress */}
        <div className="mb-3">
          <div className="mb-2 flex items-center justify-between">
            <span className={`text-sm font-medium ${COLOR_CLASSES.text.body}`}>Progress</span>
            <span className={`text-sm font-semibold ${COLOR_CLASSES.text.heading}`}>
              {progress}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Metadata */}
        <div className="space-y-2">
          <div className={`flex items-center text-sm ${COLOR_CLASSES.text.body}`}>
            <Calendar className="mr-2 h-4 w-4" />
            <span>{phase.timeline}</span>
          </div>

          <div className={`flex items-center text-sm ${COLOR_CLASSES.text.body}`}>
            <Clock className="mr-2 h-4 w-4" />
            <span>
              {completedTasks}/{totalTasks} tasks completed
            </span>
          </div>

          <div className={`flex items-center text-sm ${COLOR_CLASSES.text.body}`}>
            <CheckCircle className="mr-2 h-4 w-4" />
            <span>{phase.milestones ? phase.milestones.length : 0} milestones</span>
          </div>
        </div>

        {/* Reorder Controls */}
        {onReorder && (
          <div className="mt-3 flex justify-end space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReorder(phase.id, 'previous');
              }}
              disabled={isFirst}
              className={`rounded p-1 transition-colors ${getButtonClasses(
                isFirst,
                `${COLOR_CLASSES.surface.cardHover} ${COLOR_CLASSES.action.reorder.hover}`,
                getDisabledButtonClasses()
              )}`}
              aria-label="Move phase earlier"
            >
              <ArrowLeft className={`h-4 w-4 ${COLOR_CLASSES.action.reorder.icon}`} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReorder(phase.id, 'next');
              }}
              disabled={isLast}
              className={`rounded p-1 transition-colors ${getButtonClasses(
                isLast,
                `${COLOR_CLASSES.surface.cardHover} ${COLOR_CLASSES.action.reorder.hover}`,
                getDisabledButtonClasses()
              )}`}
              aria-label="Move phase later"
            >
              <ArrowRight className={`h-4 w-4 ${COLOR_CLASSES.action.reorder.icon}`} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhaseCardNew;
