import React, { useState } from 'react';
import { CheckCircle, Circle, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { TASK_STATUS } from '@/constants/roadmap';
import { COLOR_CLASSES } from '../../constants/colors';

/**
 * TaskCard - Displays a task with interactive completion toggling
 *
 * Features:
 * - Shows task title and description
 * - Expandable/collapsible design with chevron indicators
 * - Interactive completion checkbox with visual feedback
 * - Real-time status updates with backend integration
 * - Progress tracking integration with parent components
 * - Resources display with links when available
 *
 * @param {Object} props - Component props
 * @param {Object} props.task - The task data object
 * @param {string} props.task.id - Unique identifier for the task
 * @param {string} props.task.title - Title of the task
 * @param {string} props.task.description - Description of the task
 * @param {Array} props.task.resources - Array of resource objects with name and optional url
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
      className={`${COLOR_CLASSES.surface.tertiary} rounded-lg ${COLOR_CLASSES.border.primary}`}
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
              <CheckCircle className="h-5 w-5 text-status-success-main" />
            ) : (
              <Circle
                className={`h-5 w-5 ${COLOR_CLASSES.text.tertiary} hover:${COLOR_CLASSES.text.secondary}`}
              />
            )}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <h5
                className={`font-medium ${isCompleted ? `line-through ${COLOR_CLASSES.text.tertiary}` : COLOR_CLASSES.text.primary}`}
              >
                {task.title}
              </h5>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className={`${COLOR_CLASSES.text.tertiary} hover:${COLOR_CLASSES.text.secondary}`}
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            </div>

            {isExpanded && (
              <div className="mt-4 space-y-4">
                <div>
                  <h6 className={`font-medium ${COLOR_CLASSES.text.primary} mb-2`}>Description</h6>
                  <p className={`${COLOR_CLASSES.text.secondary} text-sm leading-relaxed`}>
                    {task.description}
                  </p>
                </div>

                {task.resources && task.resources.length > 0 && (
                  <div>
                    <h6 className={`font-medium ${COLOR_CLASSES.text.primary} mb-2`}>Resources</h6>
                    <div className="space-y-2">
                      {task.resources.map((resource, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          {resource.url ? (
                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex items-center space-x-2 ${COLOR_CLASSES.text.link} hover:${COLOR_CLASSES.text.linkHover} text-sm`}
                            >
                              <span>{resource.name}</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className={`${COLOR_CLASSES.text.secondary} text-sm`}>
                              {resource.name}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
