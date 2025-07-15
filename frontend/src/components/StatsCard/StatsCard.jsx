import React from 'react';
import { COLOR_CLASSES } from '../../constants/colors';

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
      className={`rounded-xl bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-gray-200 hover:border-blue-200 hover:shadow-blue-200`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium ${COLOR_CLASSES.text.secondary}`}>{title}</p>
          <p className={`text-2xl font-bold ${COLOR_CLASSES.text.primary}`}>{value}</p>
        </div>
        <div className={`${COLOR_CLASSES.status.info.bg} rounded-lg p-2`}>
          <Icon className="h-6 w-6 text-status-info-main" />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
