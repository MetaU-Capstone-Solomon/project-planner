import React from 'react';
import { COLOR_CLASSES, COLOR_PATTERNS } from '@/constants/colors';

/**
 * StatsCard Component
 *
 * Displays a statistics card with title, value, and optional icon.
 *
 * @param {Object} props - Component props
 * @param {string} props.title - Card title
 * @param {string|number} props.value - Card value
 * @param {React.Component} [props.icon] - Optional icon component (Lucide React icon)
 * @param {string} [props.className] - Additional CSS classes
 */
const StatsCard = ({ title, value, icon: Icon, className = '' }) => {
  return (
    <div className={`${COLOR_PATTERNS.landing.card} ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium ${COLOR_CLASSES.text.body}`}>{title}</p>
          <p className={`text-2xl font-bold ${COLOR_CLASSES.text.heading}`}>{value}</p>
        </div>
        {Icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
            <Icon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
