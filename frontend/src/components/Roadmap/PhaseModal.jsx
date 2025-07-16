import React, { useState } from 'react';
import { X, ChevronDown, ChevronRight, Target, Calendar, ExternalLink } from 'lucide-react';
import { COLOR_CLASSES, COLOR_PATTERNS } from '../../constants/colors';
import { TASK_STATUS } from '@/constants/roadmap';
import { calculateMilestoneProgress } from '@/utils/roadmapUtils';

/**
 * PhaseModal - Responsive modal for displaying phase details, milestones, and tasks
 *
 * COMPONENT:
 * This modal provides a detailed view of a project phase, allowing users to:
 * - View all milestones within the phase
 * - Expand milestones to see individual tasks
 * - Update task status (pending/in progress/completed) TODO: add colors or tags to show state
 * - Access learning resources and links
 * - Track progress through visual indicators
 *
 * KEY FEATURES:
 * - Responsive Design: Adapts to mobile, tablet, and desktop screens
 * - Interactive Milestones: Click to expand/collapse milestone details
 * - Task Management: Dropdown selectors for real-time status updates
 * - Resource Access: Clickable links to external learning materials
 * - Progress Tracking: Visual feedback for task completion status
 * - Accessibility: Proper ARIA labels and keyboard navigation support
 *
 * USER INTERACTION FLOW:
 * 1. User clicks phase card → Modal opens with phase overview
 * 2. User clicks milestone → Milestone expands to show tasks
 * 3. User changes task status → Updates immediately and persists to backend
 * 4. User clicks resource links → Opens in new tab
 * 5. User clicks overlay/close button → Modal closes
 *
 * STATE MANAGEMENT:
 * - Local state: expandedMilestones (Set of milestone IDs)
 * - Props: phase data, modal open/close state
 * - Parent state: task status updates via onTaskUpdate callback
 *
 * @param {Object} props - Component props
 * @param {boolean} props.open - Whether the modal is open
 * @param {Function} props.onClose - Function to close the modal (handles overlay clicks)
 * @param {Object} props.phase - Phase data object with milestones and tasks
 * @param {Function} props.onTaskUpdate - Callback to update task status in parent state
 */
const PhaseModal = ({ open, onClose, phase, onTaskUpdate }) => {
  const [expandedMilestones, setExpandedMilestones] = useState(new Set());

  if (!open || !phase) return null;

  // Toggle milestone expansion
  const handleMilestoneToggle = (milestoneId) => {
    setExpandedMilestones((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(milestoneId)) {
        newSet.delete(milestoneId);
      } else {
        newSet.add(milestoneId);
      }
      return newSet;
    });
  };

  // Handle task status update
  const handleTaskStatusChange = (milestoneId, taskId, newStatus) => {
    if (onTaskUpdate) {
      onTaskUpdate(phase.id, milestoneId, taskId, newStatus);
    }
  };

  return (
    <div className={`${COLOR_PATTERNS.components.modal.overlay}`} onClick={onClose}>
      <div
        className={`${COLOR_PATTERNS.components.modal.container}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          className="absolute right-4 top-4 z-10 rounded-full p-2 transition-colors duration-200 hover:bg-gray-100 focus:outline-none dark:hover:bg-gray-800"
          onClick={onClose}
          aria-label="Close modal"
        >
          <X className="h-5 w-5 text-gray-600 dark:text-white" />
        </button>

        {/* Phase Header */}
        <div
          className={`border-b border-gray-200 p-6 dark:border-gray-600 ${COLOR_CLASSES.surface.modal}`}
        >
          <h2 className={`text-2xl font-bold ${COLOR_CLASSES.text.heading} mb-2`}>
            Phase {phase.order}: {phase.title}
          </h2>
          <div className={`text-sm ${COLOR_CLASSES.text.body}`}>{phase.timeline}</div>
        </div>

        {/* Milestones and Tasks */}
        <div className={`flex-1 overflow-y-auto p-6 ${COLOR_CLASSES.surface.modal}`}>
          {phase.milestones && phase.milestones.length > 0 ? (
            <div className="space-y-4">
              {phase.milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="rounded-lg border border-gray-200 bg-gray-50 shadow-lg dark:border-gray-500 dark:bg-gray-800"
                >
                  {/* Milestone Header */}
                  <div
                    className="cursor-pointer p-4 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleMilestoneToggle(milestone.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {expandedMilestones.has(milestone.id) ? (
                          <ChevronDown className="h-4 w-4 text-blue-600 dark:text-cyan-200" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-blue-600 dark:text-cyan-200" />
                        )}
                        <Target className="h-5 w-5 text-blue-600 dark:text-cyan-200" />
                        <div>
                          <h3 className={`font-semibold ${COLOR_CLASSES.text.heading}`}>
                            {milestone.title}
                          </h3>
                          <div
                            className={`mt-1 flex items-center space-x-1 text-sm ${COLOR_CLASSES.text.body}`}
                          >
                            <Calendar className="h-3 w-3" />
                            <span>{milestone.timeline}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`text-sm ${COLOR_CLASSES.text.body}`}>
                          {milestone.tasks ? milestone.tasks.length : 0} tasks
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tasks (when expanded) */}
                  {expandedMilestones.has(milestone.id) && (
                    <div className="space-y-3 px-4 pb-4">
                      {milestone.tasks && milestone.tasks.length > 0 ? (
                        milestone.tasks.map((task) => (
                          <div
                            key={task.id}
                            className={`rounded-lg border-2 bg-white p-4 dark:bg-gray-700 ${
                              task.status === 'completed'
                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                                : task.status === 'in-progress'
                                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                                  : 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                            }`}
                          >
                            <div className="mb-3 flex items-start justify-between">
                              <h4 className={`font-medium ${COLOR_CLASSES.text.heading}`}>
                                {task.title}
                              </h4>
                              <select
                                value={task.status || 'pending'}
                                onChange={(e) =>
                                  handleTaskStatusChange(milestone.id, task.id, e.target.value)
                                }
                                className={`rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-400 ${COLOR_CLASSES.surface.input} ${COLOR_CLASSES.text.heading} focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:border-blue-400 dark:focus:ring-blue-400`}
                              >
                                <option
                                  value="pending"
                                  className={`${COLOR_CLASSES.surface.input} ${COLOR_CLASSES.text.heading}`}
                                >
                                  Pending
                                </option>
                                <option
                                  value="in-progress"
                                  className={`${COLOR_CLASSES.surface.input} ${COLOR_CLASSES.text.heading}`}
                                >
                                  In Progress
                                </option>
                                <option
                                  value="completed"
                                  className={`${COLOR_CLASSES.surface.input} ${COLOR_CLASSES.text.heading}`}
                                >
                                  Completed
                                </option>
                              </select>
                            </div>

                            <p
                              className={`text-sm ${COLOR_CLASSES.text.body} mb-3 leading-relaxed`}
                            >
                              {task.description}
                            </p>

                            {/* Resources */}
                            {task.resources && task.resources.length > 0 && (
                              <div>
                                <h5
                                  className={`text-sm font-medium ${COLOR_CLASSES.text.heading} mb-2`}
                                >
                                  Resources:
                                </h5>
                                <div className="space-y-1">
                                  {task.resources.map((resource, index) => (
                                    <div key={index} className="flex items-center space-x-2">
                                      {resource.url ? (
                                        <a
                                          href={resource.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center space-x-1 text-sm text-blue-600 transition-colors duration-200 hover:text-blue-500 dark:text-cyan-200 dark:hover:text-cyan-100"
                                        >
                                          <span>{resource.name}</span>
                                          <ExternalLink className="h-3 w-3" />
                                        </a>
                                      ) : (
                                        <span className={`text-sm ${COLOR_CLASSES.text.body}`}>
                                          {resource.name}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className={`text-sm ${COLOR_CLASSES.text.body} py-4 text-center`}>
                          No tasks available for this milestone.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className={`py-8 text-center ${COLOR_CLASSES.text.body}`}>
              No milestones available for this phase.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhaseModal;
