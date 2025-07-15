import React from 'react';
import { COLOR_CLASSES, COLOR_PATTERNS } from '../../constants/colors';

/**
 * StatsCard Component
 *
 * Displays a statistic card with title, value, and icon
 *
 *
 * @param {Object} props - Component props
 * @param {string} props.title - The title of the statistic
 * @param {string|number} props.value - The value to display
 * @param {React.Component} props.icon - Lucide React icon component
 */
const StatsCard = ({ title, value, icon: Icon }) => {
  return (
    <div
      className={`${COLOR_PATTERNS.landing.card} hover:border-purple-200 dark:hover:border-purple-300 hover:shadow-purple-100 dark:hover:shadow-purple-300/30`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className="bg-purple-100 dark:bg-purple-900/50 rounded-lg p-2">
          <Icon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
