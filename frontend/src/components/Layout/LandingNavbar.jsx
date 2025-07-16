import React from 'react';
import Logo from '../Logo/Logo';
import ThemeToggle from './ThemeToggle';

/**
 * LandingNavbar Component - Simplified navbar for landing page
 *
 * Features:
 * - Logo only (no navigation links)
 * - Clean white background with subtle shadow
 * - Modern styling similar to GitHub, Notion, Linear
 * - Dark mode toggle
 */
const LandingNavbar = () => {
  return (
    <header className="absolute left-0 right-0 top-0 z-10 border-b border-gray-100 bg-white/95 shadow-sm backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/95">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center">
          <div className="flex items-center space-x-2">
            <Logo className="h-8 w-8" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">Project Planner</span>
          </div>
        </div>

        {/* Theme Toggle */}
        <div className="flex items-center">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

export default LandingNavbar;
