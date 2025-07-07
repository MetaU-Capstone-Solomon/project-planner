import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Target, Calendar } from 'lucide-react';
import TaskCard from './TaskCard';
import { calculateMilestoneProgress } from '@/utils/roadmapUtils';

/**
 * MilestoneCard - Displays a milestone with expandable functionality
 * 
 * Features:
 * - Shows milestone title and timeline
 * - Expandable/collapsible design with chevron indicators
 * - Progress bar visualization with real calculations
 * - Task count display with real task counts
 * - Displays expandable task cards when milestone is expanded
 * - Calculates progress based on completed tasks
 * 
 * @param {Object} milestone - The milestone data object
 * @param {string} milestone.id - Unique identifier for the milestone
 * @param {string} milestone.title - Title of the milestone
 * @param {string} milestone.timeline - Timeline information
 * @param {Array} milestone.tasks - Array of task objects
 * @param {boolean} isExpanded - Whether the milestone is expanded (controlled by parent)
 * @param {Function} onToggle - Callback function to toggle expansion state
 */
const MilestoneCard = ({ milestone, isExpanded = false, onToggle }) => {
  const { total: totalTasks, completed: completedTasks, percentage: progress } = calculateMilestoneProgress(milestone);

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200">
      <div 
        className="p-4 cursor-pointer hover:bg-gray-100 transition-colors duration-200"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )}
            <Target className="h-5 w-5 text-blue-600" />
            <div>
              <h4 className="font-semibold text-gray-900">{milestone.title}</h4>
              <div className="flex items-center space-x-1 mt-1 text-sm text-gray-600">
                <Calendar className="h-3 w-3" />
                <span>{milestone.timeline}</span>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-lg font-semibold text-gray-900">{progress}%</div>
            <div className="text-xs text-gray-500">{completedTasks}/{totalTasks}</div>
          </div>
        </div>

        <div className="mt-3">
          <div className="w-full bg-gray-300 rounded-full h-1.5">
            <div 
              className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4">
          <div className="space-y-3">
            {milestone.tasks && milestone.tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MilestoneCard; 