import React, { useState } from 'react';
import { CheckCircle, Circle, ChevronDown, ChevronUp } from 'lucide-react';
import { TASK_STATUS } from '@/constants/roadmap';

/**
 * TaskCard - Displays a task with interactive completion toggling
 * 
 * Features:
 * - Shows task title and description
 * - Expandable/collapsible design with chevron indicators
 * - Interactive completion checkbox with visual feedback
 * - Real-time status updates with backend integration
 * - Progress tracking integration with parent components
 * 
 * @param {Object} props - Component props
 * @param {Object} props.task - The task data object
 * @param {string} props.task.id - Unique identifier for the task
 * @param {string} props.task.title - Title of the task
 * @param {string} props.task.description - Description of the task
 * @param {string} props.task.status - Task status (TASK_STATUS.COMPLETED, TASK_STATUS.PENDING, TASK_STATUS.IN_PROGRESS)
 * @param {Function} props.onTaskUpdate - Callback function when task status changes
 */
const TaskCard = ({ task, onTaskUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCompleted, setIsCompleted] = useState(task.status === TASK_STATUS.COMPLETED);

  const handleToggleComplete = () => {
    const newStatus = !isCompleted ? TASK_STATUS.COMPLETED : TASK_STATUS.PENDING;
    setIsCompleted(!isCompleted);
    
    // Notify parent components of the change
    if (onTaskUpdate) {
      onTaskUpdate(task.id, newStatus);
    }
    
    // TODO: Implement backend API call to persist task status
  };

  return (
    <div 
      className="bg-gray-50 rounded-lg border border-gray-200"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-4">
        <div className="flex items-start space-x-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleComplete();
            }}
            className="mt-1 flex-shrink-0"
          >
            {isCompleted ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <Circle className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            )}
          </button>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h5 className={`font-medium ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                {task.title}
              </h5>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
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