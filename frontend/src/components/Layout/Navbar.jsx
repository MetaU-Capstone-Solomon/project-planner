import React, { useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, Plus } from 'lucide-react';
import { COLOR_CLASSES } from '@/constants/colors';
import { ROUTES } from '@/constants/routes';
import Logo from '@/components/Logo/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { getDisplayName, getAvatarUrl } from '@/utils/userUtils';
import ProfileDropdown from './ProfileDropdown';
import ThemeToggle from './ThemeToggle';
import resetNewProjectState from '@/utils/resetNewProjectState';
import confirmAction from '@/utils/confirmAction';

/**
 * Navbar.jsx
 *
 * Main navigation header for the application.
 *
 * Features:
 * - Logo with home navigation
 * - Main navigation links
 * - Theme toggle
 * - Profile avatar with user image
 * - Responsive design
 * - "New Project" button clears all New Project Chat state (localStorage) before navigation
 *
 * Usage:
 *   The "New Project" button uses clearNewProjectState to ensure a fresh start.
 */
const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const profileButtonRef = useRef(null);

  const userProfile = {
    name: getDisplayName(user),
    image: getAvatarUrl(user),
  };

  // Handle profile dropdown toggle
  const handleProfileClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Handle new project creation
  const handleNewProject = React.useCallback(() => {
    // If already on the new project page, ask for confirmation before clearing
    if (location.pathname === ROUTES.NEW_PROJECT_CHAT) {
      const shouldProceed = confirmAction(
        'Are you sure you want to start over? This will clear all your current progress.'
      );

      if (!shouldProceed) {
        return; // User cancelled, nothing happens
      }

      // Reset state
      resetNewProjectState();
      // Trigger an event that the NewProjectChatPage can listen to
      window.dispatchEvent(new CustomEvent('resetNewProject'));
    } else {
      // Navigate to new project page
      resetNewProjectState();
      navigate(ROUTES.NEW_PROJECT_CHAT);
    }
  }, [navigate, location.pathname]);

  // Navigation items
  const navItems = [
    { path: ROUTES.DASHBOARD, label: 'Dashboard', isActive: location.pathname === ROUTES.DASHBOARD },
  ];

  return (
    <header className="relative z-50 border-b border-gray-100 bg-white/95 shadow-sm backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/95">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center">
          <Link to={ROUTES.DASHBOARD} className="flex items-center space-x-2">
            <Logo className="h-8 w-8" />
            <span className="hidden text-xl font-bold text-gray-900 dark:text-white md:inline">
              Project Planner
            </span>
            <span className="text-lg font-bold text-gray-900 dark:text-white md:hidden">PP</span>
          </Link>
        </div>

        {/* Navigation Links - Hidden on mobile */}
        <nav className="hidden items-center space-x-8 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="rounded-lg border border-blue-600 bg-blue-600 px-3 py-2 text-base font-medium text-white shadow-sm transition-all duration-200 hover:border-green-600 hover:bg-green-600 hover:shadow-md"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Mobile Navigation Links */}
        <nav className="flex items-center space-x-2 md:hidden">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="rounded border border-blue-600 bg-blue-600 px-1.5 py-0.5 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:border-green-600 hover:bg-green-600 hover:shadow-md"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center space-x-4">
          {/* New Project Button */}
          <button
            onClick={handleNewProject}
            className="flex items-center space-x-1 rounded-lg border border-blue-600 bg-blue-600 px-1.5 py-0.5 font-medium text-white shadow-sm transition-all duration-200 hover:border-green-600 hover:bg-green-600 hover:shadow-md md:space-x-2 md:px-3 md:py-2"
            aria-label="Create new project"
          >
            <Plus className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden text-sm font-medium md:inline">New Project</span>
            <span className="text-xs font-medium md:hidden">Create</span>
          </button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Profile Avatar with Dropdown */}
          <div className="relative">
            <button
              ref={profileButtonRef}
              onClick={handleProfileClick}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 ring-2 ring-transparent transition-colors duration-200 hover:text-gray-900 hover:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:hover:text-white"
              aria-label="User profile"
              aria-expanded={isDropdownOpen}
            >
              {userProfile.image ? (
                <img
                  src={userProfile.image}
                  alt={userProfile.name}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <User className="h-4 w-4" />
              )}
            </button>

            <ProfileDropdown
              isOpen={isDropdownOpen}
              onClose={() => setIsDropdownOpen(false)}
              triggerRef={profileButtonRef}
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
