import React from 'react';
import { calculateOverallProgress, calculatePhaseProgress } from '@/utils/roadmapUtils';
import { COLOR_CLASSES, COLOR_PATTERNS } from '../../constants/colors';

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
    <div className={`${COLOR_PATTERNS.components.container} mb-6 p-6`}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className={`text-lg font-semibold ${COLOR_CLASSES.text.heading}`}>Overall Progress</h3>
        <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
          {overallProgress}%
        </span>
      </div>

      <div className="h-3 w-full rounded-full bg-gray-200 shadow-inner dark:bg-gray-700">
        <div
          className="h-3 rounded-full bg-indigo-500 shadow-sm transition-all duration-300 ease-out dark:bg-indigo-400"
          style={{ width: `${overallProgress}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;
