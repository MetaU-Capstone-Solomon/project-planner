import React from 'react';
// TODO: Import MilestoneCard component when created
// import MilestoneCard from './MilestoneCard';
import { ChevronDown, ChevronRight, Calendar, Clock } from 'lucide-react';
import { getPhaseColor } from '@/utils/roadmapUtils';

/**
 * PhaseCard Component
 * 
 * Displays a project phase with basic progress tracking and expansion functionality.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.phase - Phase data object
 * @param {string} props.phase.id - Phase unique identifier
 * @param {number} props.phase.order - Phase order/sequence number
 * @param {string} props.phase.title - Phase title
 * @param {string} props.phase.timeline - Phase timeline/date range
 * @param {boolean} props.isExpanded - Whether the phase is expanded (currently unused, for future milestone display)
 * @param {Function} props.onToggle - Callback function to toggle phase expansion
 * 
 * @returns {JSX.Element} Phase card with title, timeline, and placeholder progress
 */
const PhaseCard = ({ phase, isExpanded, onToggle }) => {
  const progress = 0; // TODO: Calculate progress when milestones are added
  const totalTasks = 0; // TODO: Count tasks when milestones are added
  const completedTasks = 0; // TODO: Count completed tasks when milestones are added
  const phaseColorClasses = getPhaseColor(phase.order);

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 border-l-4 ${phaseColorClasses} mb-4`}>
      <div 
        className="p-6 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isExpanded ? (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-500" />
            )}
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Phase {phase.order}: {phase.title}
              </h3>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
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
            <div className="text-2xl font-bold text-gray-900">{progress}%</div>
            <div className="text-sm text-gray-500">{completedTasks}/{totalTasks} completed</div>
          </div>
        </div>

        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* TODO: Add milestone display in future PR */}
      {/* {isExpanded && (
        <div className="px-6 pb-6">
          <div className="space-y-4">
            {phase.milestones.map((milestone) => (
              <MilestoneCard key={milestone.id} milestone={milestone} />
            ))}
          </div>
        </div>
      )} */}
    </div>
  );
};

export default PhaseCard;