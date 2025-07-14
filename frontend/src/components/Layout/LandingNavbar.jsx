import React from 'react';
import { COLOR_CLASSES } from '../../constants/colors';
import Logo from '../Logo/Logo';

/**
 * LandingNavbar Component - Simplified navbar for landing page
 *
 * Features:
 * - Logo only (no navigation links)
 * - Same styling as main navbar
 */
const LandingNavbar = () => {
  return (
    <header
      className={`${COLOR_CLASSES.surface.navbar} ${COLOR_CLASSES.border.primary} border-b shadow-sm`}
    >
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center">
          <div className="flex items-center space-x-2">
            <Logo className="h-8 w-8" />
            <span className={`text-xl font-bold ${COLOR_CLASSES.text.primary}`}>
              Project Planner
            </span>
          </div>
        </div>

        {/* Empty right side for balance */}
        <div className="flex items-center">
          {/* This space is intentionally empty to maintain layout balance */}
        </div>
      </div>
    </header>
  );
};

export default LandingNavbar;
