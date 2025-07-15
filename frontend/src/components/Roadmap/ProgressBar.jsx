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
    <div
      className="rounded-lg shadow-sm mb-6 p-6 bg-white border border-blue-500"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Overall Progress</h3>
        <span className="text-2xl font-bold text-blue-600">
          {overallProgress}%
        </span>
      </div>

      <div className="h-3 w-full rounded-full bg-gray-200 shadow-inner">
        <div
          className="h-3 rounded-full bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 transition-all duration-300 ease-out shadow-sm"
          style={{ width: `${overallProgress}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;
