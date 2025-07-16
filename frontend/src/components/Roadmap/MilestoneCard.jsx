import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Target, Calendar } from 'lucide-react';
import TaskCard from './TaskCard';
import { calculateMilestoneProgress } from '@/utils/roadmapUtils';
import { COLOR_CLASSES } from '../../constants/colors';

/**
 * MilestoneCard - Displays a milestone with expandable functionality and task management
 * 
 * Features:
 * - Shows milestone title and timeline
 * - Expandable/collapsible design with chevron indicators
 * - Progress percentage and task count display
 * - Displays expandable task cards when milestone is expanded
 * - Handles task status updates and recalculates progress

 * - Calculates progress based on completed tasks
 * 
 * @param {Object} props - Component props
 * @param {Object} props.milestone - The milestone data object
 * @param {string} props.milestone.id - Unique identifier for the milestone
 * @param {string} props.milestone.title - Title of the milestone
 * @param {string} props.milestone.timeline - Timeline information
 * @param {Array} props.milestone.tasks - Array of task objects
 * @param {boolean} props.isExpanded - Whether the milestone is expanded (controlled by parent)
 * @param {Function} props.onToggle - Callback function to toggle expansion state
 * @param {Function} props.onTaskUpdate - Callback function when task status changes
 */
const MilestoneCard = ({ milestone, isExpanded = false, onToggle, onTaskUpdate }) => {
  const {
    total: totalTasks,
    completed: completedTasks,
    percentage: progress,
  } = calculateMilestoneProgress(milestone);

  const handleTaskUpdate = (taskId, newStatus) => {
    // Create updated tasks without mutating the original milestone data
    if (milestone.tasks) {
      const updatedTasks = milestone.tasks.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task
      );

      // Notify parent components of the change with immutable data
      if (onTaskUpdate) {
        onTaskUpdate(milestone.id, taskId, newStatus, updatedTasks);
      }
    }
  };

  return (
    <div className={`${COLOR_CLASSES.surface.tertiary} rounded-lg ${COLOR_CLASSES.border.primary}`}>
      <div
        className={`cursor-pointer p-4 ${COLOR_CLASSES.surface.cardHover} transition-colors duration-200`}
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isExpanded ? (
              <ChevronDown className={`h-4 w-4 ${COLOR_CLASSES.text.tertiary}`} />
            ) : (
              <ChevronRight className={`h-4 w-4 ${COLOR_CLASSES.text.tertiary}`} />
            )}
            <Target className="h-5 w-5 text-status-info-main" />
            <div>
              <h4 className={`font-semibold ${COLOR_CLASSES.text.primary}`}>{milestone.title}</h4>
              <div
                className={`mt-1 flex items-center space-x-1 text-sm ${COLOR_CLASSES.text.secondary}`}
              >
                <Calendar className="h-3 w-3" />
                <span>{milestone.timeline}</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className={`text-lg font-semibold ${COLOR_CLASSES.text.primary}`}>{progress}%</div>
            <div className={`text-xs ${COLOR_CLASSES.text.tertiary}`}>
              {completedTasks}/{totalTasks}
            </div>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4">
          <div className="space-y-3">
            {milestone.tasks &&
              milestone.tasks.map((task) => (
                <TaskCard key={task.id} task={task} onTaskUpdate={handleTaskUpdate} />
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MilestoneCard;
