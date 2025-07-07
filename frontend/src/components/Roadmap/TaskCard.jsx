import React, { useState } from 'react';
import { CheckCircle, Circle, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * TaskCard - Displays a task with basic information and expandable details
 * 
 * Features:
 * - Shows task title and description3r
 * - Expandable/collapsible design with chevron indicators
 * - Status indicator (placeholder )
 * - TODO: Task completion toggling will be implemented in a separate PR
 * - TODO: Task assignment, resources, and timestamps 
 * 
 * @param {Object} task - The task data object
 * @param {string} task.id - Unique identifier for the task
 * @param {string} task.title - Title of the task
 * @param {string} task.description - Description of the task
 * @param {string} task.status - Task status (placeholder )
 */
const TaskCard = ({ task }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // TODO: Task completion toggling 
  const isCompleted = false;

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200">
      <div className="p-4">
        <div className="flex items-start space-x-3">
          <div className="mt-1 flex-shrink-0">
            {isCompleted ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <Circle className="h-5 w-5 text-gray-400" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h5 className={`font-medium ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                {task.title}
              </h5>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-gray-400 hover:text-gray-600"
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            </div>

            {isExpanded && (
              <div className="mt-4">
                <div>
                  <h6 className="font-medium text-gray-900 mb-2">Description</h6>
                  <p className="text-gray-700 text-sm leading-relaxed">{task.description}</p>
                </div>
                
                {/* TODO: Task assignment, resources, and timestamps */}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCard; 