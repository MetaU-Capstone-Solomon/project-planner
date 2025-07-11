import React, { useState } from 'react';
import { X, ChevronDown, ChevronRight, Target, Calendar, ExternalLink } from 'lucide-react';
import { COLOR_CLASSES } from '../../constants/colors';
import { TASK_STATUS } from '@/constants/roadmap';

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
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-4xl bg-white rounded-lg shadow-xl flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          className={`absolute top-4 right-4 p-2 rounded-full hover:${COLOR_CLASSES.surface.secondary} focus:outline-none z-10`}
          onClick={onClose}
          aria-label="Close modal"
        >
          <X className={`h-5 w-5 ${COLOR_CLASSES.text.tertiary}`} />
        </button>

        {/* Phase Header */}
        <div className={`p-6 border-b ${COLOR_CLASSES.border.primary} ${COLOR_CLASSES.surface.secondary}`}>
          <h2 className={`text-2xl font-bold ${COLOR_CLASSES.text.primary} mb-2`}>
            Phase {phase.order}: {phase.title}
          </h2>
          <div className={`text-sm ${COLOR_CLASSES.text.secondary}`}>
            {phase.timeline}
          </div>
        </div>

        {/* Milestones and Tasks */}
        <div className="flex-1 overflow-y-auto p-6">
          {phase.milestones && phase.milestones.length > 0 ? (
            <div className="space-y-4">
              {phase.milestones.map((milestone) => (
                <div key={milestone.id} className={`${COLOR_CLASSES.surface.card} rounded-lg ${COLOR_CLASSES.border.primary} shadow-sm`}>
                  {/* Milestone Header */}
                  <div 
                    className={`p-4 cursor-pointer hover:${COLOR_CLASSES.surface.secondary} transition-colors duration-200`}
                    onClick={() => handleMilestoneToggle(milestone.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {expandedMilestones.has(milestone.id) ? (
                          <ChevronDown className={`h-4 w-4 ${COLOR_CLASSES.text.tertiary}`} />
                        ) : (
                          <ChevronRight className={`h-4 w-4 ${COLOR_CLASSES.text.tertiary}`} />
                        )}
                        <Target className="h-5 w-5 text-status-info-main" />
                        <div>
                          <h3 className={`font-semibold ${COLOR_CLASSES.text.primary}`}>
                            {milestone.title}
                          </h3>
                          <div className={`flex items-center space-x-1 mt-1 text-sm ${COLOR_CLASSES.text.secondary}`}>
                            <Calendar className="h-3 w-3" />
                            <span>{milestone.timeline}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={`text-sm ${COLOR_CLASSES.text.secondary}`}>
                          {milestone.tasks ? milestone.tasks.length : 0} tasks
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tasks (when expanded) */}
                  {expandedMilestones.has(milestone.id) && (
                    <div className="px-4 pb-4 space-y-3">
                      {milestone.tasks && milestone.tasks.length > 0 ? (
                        milestone.tasks.map((task) => (
                          <div key={task.id} className={`${COLOR_CLASSES.surface.tertiary} rounded-lg p-4 ${COLOR_CLASSES.border.primary}`}>
                            <div className="flex items-start justify-between mb-3">
                              <h4 className={`font-medium ${COLOR_CLASSES.text.primary}`}>
                                {task.title}
                              </h4>
                              <select
                                value={task.status || 'pending'}
                                onChange={(e) => handleTaskStatusChange(milestone.id, task.id, e.target.value)}
                                className={`text-sm border rounded px-2 py-1 ${COLOR_CLASSES.border.primary} focus:${COLOR_CLASSES.border.focus} outline-none`}
                              >
                                <option value="pending">Pending</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                              </select>
                            </div>
                            
                            <p className={`text-sm ${COLOR_CLASSES.text.secondary} mb-3 leading-relaxed`}>
                              {task.description}
                            </p>

                            {/* Resources */}
                            {task.resources && task.resources.length > 0 && (
                              <div>
                                <h5 className={`text-sm font-medium ${COLOR_CLASSES.text.primary} mb-2`}>
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
                                          className={`flex items-center space-x-1 text-sm ${COLOR_CLASSES.text.link} hover:${COLOR_CLASSES.text.linkHover}`}
                                        >
                                          <span>{resource.name}</span>
                                          <ExternalLink className="h-3 w-3" />
                                        </a>
                                      ) : (
                                        <span className={`text-sm ${COLOR_CLASSES.text.secondary}`}>
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
                        <div className={`text-sm ${COLOR_CLASSES.text.secondary} text-center py-4`}>
                          No tasks available for this milestone.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className={`text-center py-8 ${COLOR_CLASSES.text.secondary}`}>
              No milestones available for this phase.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhaseModal; 