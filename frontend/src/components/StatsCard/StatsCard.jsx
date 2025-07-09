import React from 'react';

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
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="text-blue-600 p-2 rounded-lg bg-blue-50">
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

export default StatsCard; 