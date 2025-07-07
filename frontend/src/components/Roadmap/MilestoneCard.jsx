import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Target, Calendar } from 'lucide-react';

/**
 * MilestoneCard - Displays a milestone with expandable functionality
 * 
 * Features:
 * - Shows milestone title and timeline
 * - Expandable/collapsible design with chevron indicators
 * - Progress bar visualization (placeholder - 0% progress)
 * - Task count display (placeholder - 0/0 tasks)
 * - TODO: Progress tracking and calculations will be implemented in a separate PR
 * - TODO: Task cards will be implemented in a separate PR
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
  // TODO: Progress tracking and calculations will be implemented in a separate PR
  const completedTasks = 0;
  const totalTasks = 0;
  const progress = 0;

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
            {/* TODO: TaskCard components will be implemented in a separate PR */}
            <div className="text-center text-gray-500 text-sm py-4">
              Tasks
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MilestoneCard; 