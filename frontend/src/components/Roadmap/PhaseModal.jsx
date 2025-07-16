import React, { useState } from 'react';
import { X, ChevronDown, ChevronRight, Target, Calendar, ExternalLink, Edit2 } from 'lucide-react';
import { COLOR_CLASSES, COLOR_PATTERNS } from '../../constants/colors';
import { TASK_STATUS } from '@/constants/roadmap';
import { calculateMilestoneProgress } from '@/utils/roadmapUtils';
import EditTaskModal from './EditTaskModal';

/**
 * PhaseModal - Responsive modal for displaying phase details, milestones, and tasks with modal editing
 *
 * COMPONENT:
 * This modal provides a detailed view of a project phase, allowing users to:
 * - View all milestones within the phase
 * - Expand milestones to see individual tasks
 * - Update task status (pending/in progress/completed)
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
 * MODAL TASK EDITING WORKFLOW:
 * 1. Edit Icon Click: handleStartEdit(taskId, task) - Opens edit modal
 * 2. Modal Editing: User types in dedicated modal form for title and description
 * 3. Save Action: handleSaveEdit(updatedTask) - Validates and saves
 * 4. Cancel Action: handleCloseEditModal() - Discards changes and closes edit modal
 *
 * @param {Object} props - Component props
 * @param {boolean} props.open - Whether the modal is open
 * @param {Function} props.onClose - Function to close the modal (handles overlay clicks)
 * @param {Object} props.phase - Phase data object with milestones and tasks
 * @param {Function} props.onTaskUpdate - Callback to update task status in parent state
 */
const PhaseModal = ({ open, onClose, phase, onTaskUpdate }) => {
  const [expandedMilestones, setExpandedMilestones] = useState(new Set());
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

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

  /**
   * Start editing a task
   * @param {string} taskId - The task ID to edit
   * @param {Object} task - The task data
   */
  const handleStartEdit = (taskId, task) => {
    setEditingTask(task);
    setIsEditModalOpen(true);
  };

  /**
   * Close edit modal and reopen phase modal
   */
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingTask(null);
  };

  /**
   * Save task changes
   * @param {Object} updatedTask - The updated task data
   */
  const handleSaveEdit = (updatedTask) => {
    if (onTaskUpdate && editingTask) {
      onTaskUpdate(phase.id, editingTask.milestoneId, editingTask.id, updatedTask);
    }
    handleCloseEditModal();
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
                        milestone.tasks.map((task) => {
                          // Add milestoneId to task for edit functionality
                          const taskWithMilestone = { ...task, milestoneId: milestone.id };
                          
                          return (
                            <div
                              key={task.id}
                              className={`rounded-lg border-2 p-4 ${
                                task.status === 'completed'
                                  ? `${COLOR_CLASSES.status.success.border} ${COLOR_CLASSES.status.success.bg}`
                                  : task.status === 'in-progress'
                                    ? `${COLOR_CLASSES.status.info.border}`
                                    : `${COLOR_CLASSES.status.warning.border}`
                              }`}
                            >
                              <div className="mb-3 flex items-start justify-between">
                                <div className="flex-1 mr-4">
                                  <h4 className={`font-medium ${COLOR_CLASSES.text.heading}`}>
                                    {task.title}
                                  </h4>
                                </div>
                                <div className="flex items-center space-x-2 flex-shrink-0">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStartEdit(task.id, taskWithMilestone);
                                    }}
                                    className={`p-1 rounded ${COLOR_CLASSES.surface.cardHover} transition-colors`}
                                    aria-label="Edit task"
                                  >
                                    <Edit2 className="h-4 w-4 text-gray-900 dark:text-white" />
                                  </button>
                                <select
                                  value={task.status || 'pending'}
                                  onChange={(e) =>
                                    handleTaskStatusChange(milestone.id, task.id, e.target.value)
                                  }
                                  className={`rounded ${COLOR_CLASSES.border.input} px-2 py-1 text-sm ${COLOR_CLASSES.surface.input} ${COLOR_CLASSES.text.heading} focus:${COLOR_CLASSES.border.focus} focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400`}
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
                                          className={`flex items-center space-x-1 text-sm ${COLOR_CLASSES.text.link} hover:${COLOR_CLASSES.text.linkHover} transition-colors duration-200`}
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
                        );
                      })
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

      {/* Edit Task Modal */}
      <EditTaskModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        task={editingTask}
        onSave={handleSaveEdit}
      />
    </div>
  );
};

export default PhaseModal;
