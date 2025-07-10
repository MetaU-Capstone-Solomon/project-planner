import React from 'react';
import { calculateOverallProgress, calculatePhaseProgress } from '@/utils/roadmapUtils';
import { COLOR_CLASSES } from '../../constants/colors';

/**
 * ProgressBar - Displays overall project progress with real calculations
 * 
 * Features:
 * - Shows overall project progress percentage
 * - Displays progress bar visualization
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
    <div className={`${COLOR_CLASSES.surface.card} rounded-lg shadow-sm ${COLOR_CLASSES.border.primary} p-6 mb-6`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold ${COLOR_CLASSES.text.primary}`}>Overall Progress</h3>
        <span className={`text-2xl font-bold ${COLOR_CLASSES.status.info.main}`}>{overallProgress}%</span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div 
          className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${overallProgress}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar; 