import React, { useState } from 'react';
import MilestoneCard from './MilestoneCard';
import { ChevronDown, ChevronRight, Calendar, Clock } from 'lucide-react';
import { getPhaseColor, calculatePhaseProgress } from '@/utils/roadmapUtils';
import { TASK_STATUS } from '@/constants/roadmap';
import { COLOR_CLASSES } from '../../constants/colors';

/**
 * PhaseCard Component
 *
 * Displays a project phase with milestone expansion functionality and real progress tracking.
 *
 * @param {Object} props - Component props
 * @param {Object} props.phase - Phase data object
 * @param {string} props.phase.id - Phase unique identifier
 * @param {number} props.phase.order - Phase order/sequence number
 * @param {string} props.phase.title - Phase title
 * @param {string} props.phase.timeline - Phase timeline/date range
 * @param {Array} props.phase.milestones - Array of milestone objects
 * @param {boolean} props.isExpanded - Whether the phase is expanded
 * @param {Function} props.onToggle - Callback function to toggle phase expansion
 * @param {Set} props.expandedMilestones - Set of expanded milestone IDs
 * @param {Function} props.onMilestoneToggle - Callback function to toggle milestone expansion
 *
 * @returns {JSX.Element} Phase card with title, timeline, expandable milestones, and real progress
 */
const PhaseCard = ({
  phase,
  isExpanded,
  onToggle,
  onTaskUpdate,
  expandedMilestones,
  onMilestoneToggle,
}) => {
  const progress = calculatePhaseProgress(phase);
  const phaseColorClasses = getPhaseColor(phase.order);

  // Calculate task counts for display
  const totalTasks = phase.milestones
    ? phase.milestones.reduce(
        (total, milestone) => total + (milestone.tasks ? milestone.tasks.length : 0),
        0
      )
    : 0;

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

  const handleTaskUpdate = (milestoneId, taskId, newStatus, updatedTasks) => {
    // Create updated milestones without mutating the original phase data
    if (phase.milestones) {
      const updatedMilestones = phase.milestones.map((milestone) =>
        milestone.id === milestoneId ? { ...milestone, tasks: updatedTasks } : milestone
      );

      // Notify parent components of the change with immutable data
      if (onTaskUpdate) {
        onTaskUpdate(phase.id, milestoneId, taskId, newStatus, updatedMilestones);
      }
    }
  };

  return (
    <div
      className={`${COLOR_CLASSES.surface.card} rounded-lg shadow-sm ${COLOR_CLASSES.border.primary} border-l-4 ${phaseColorClasses} mb-4 transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-200`}
    >
      <div className="cursor-pointer p-6" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isExpanded ? (
              <ChevronDown className={`h-5 w-5 ${COLOR_CLASSES.text.tertiary}`} />
            ) : (
              <ChevronRight className={`h-5 w-5 ${COLOR_CLASSES.text.tertiary}`} />
            )}
            <div>
              <h3 className={`text-xl font-semibold ${COLOR_CLASSES.text.primary}`}>
                Phase {phase.order}: {phase.title}
              </h3>
              <div
                className={`mt-2 flex items-center space-x-4 text-sm ${COLOR_CLASSES.text.secondary}`}
              >
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{phase.timeline}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{totalTasks} tasks</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className={`text-2xl font-bold ${COLOR_CLASSES.text.primary}`}>{progress}%</div>
            <div className={`text-sm ${COLOR_CLASSES.text.tertiary}`}>
              {completedTasks}/{totalTasks} completed
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {isExpanded && phase.milestones && (
        <div className="px-6 pb-6">
          <div className="space-y-4">
            {phase.milestones.map((milestone) => (
              <MilestoneCard
                key={milestone.id}
                milestone={milestone}
                isExpanded={expandedMilestones.has(milestone.id)}
                onToggle={() => onMilestoneToggle(milestone.id)}
                onTaskUpdate={handleTaskUpdate}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PhaseCard;
