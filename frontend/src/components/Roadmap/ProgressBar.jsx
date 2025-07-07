import React from 'react';
import { calculateOverallProgress, calculatePhaseProgress } from '@/utils/roadmapUtils';

/**
 * ProgressBar - Displays overall project progress with real calculations
 * 
 * Features:
 * - Shows overall project progress percentage
 * - Displays progress bar visualization
 * - Shows individual phase progress with real calculations
 * - Calculates progress based on completed tasks
 * 
 * @param {Object} props - Component props
 * @param {Array} props.phases - Array of phase objects
 * @param {string} props.phases[].id - Phase unique identifier
 * @param {string} props.phases[].title - Phase title
 * @param {Array} props.phases[].milestones - Array of milestone objects
 */
const ProgressBar = ({ phases }) => {
  const overallProgress = calculateOverallProgress(phases);
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Overall Progress</h3>
        <span className="text-2xl font-bold text-blue-600">{overallProgress}%</span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div 
          className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${overallProgress}%` }}
        ></div>
      </div>
      
      <div className="mt-4 grid grid-cols-4 gap-4 text-center">
        {phases.map((phase, index) => {
          const phaseProgress = calculatePhaseProgress(phase);
          
          return (
            <div key={phase.id} className="text-sm">
              <div className="font-medium text-gray-900">Phase {index + 1}</div>
              <div className="text-gray-600">{phaseProgress}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressBar; 