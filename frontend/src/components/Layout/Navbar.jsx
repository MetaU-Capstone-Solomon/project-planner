import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Sun, Moon, User, Plus } from 'lucide-react';
import { COLOR_CLASSES } from '../../constants/colors';
import { ROUTES } from '../../constants/routes';
import Logo from '../Logo/Logo';
import { useAuth } from '../../contexts/AuthContext';
import { getDisplayName, getAvatarUrl } from '../../utils/userUtils';

/**
 * Navbar Component - Main navigation header
 * 
 * Features:
 * - Logo with home navigation
 * - Main navigation links
 * - Theme toggle (placeholder)
 * - Profile avatar with user image
 * - Responsive design
 * - Industry standard layout
 */
const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const userProfile = {
    name: getDisplayName(user),
    image: getAvatarUrl(user)
  };

  const handleThemeToggle = () => {
    console.log('Theme toggle clicked - TODO: Implement theme switching');
  };

  // Handle profile navigation
  const handleProfileClick = () => {
    navigate(ROUTES.PROFILE);
  };

  // Handle new project creation
  const handleNewProject = () => {
    navigate(ROUTES.NEW_PROJECT_CHAT);
  };

  // Navigation items
  const navItems = [
    { path: ROUTES.DASHBOARD, label: 'Home', isActive: location.pathname === ROUTES.DASHBOARD },
  ];

  return (
    <header className={`${COLOR_CLASSES.surface.navbar} ${COLOR_CLASSES.border.primary} border-b shadow-sm`}>
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center">
          <Link to={ROUTES.DASHBOARD} className="flex items-center space-x-2">
            <Logo className="h-8 w-8" />
            <span className={`text-xl font-bold ${COLOR_CLASSES.text.primary} hidden md:inline`}>
              Project Planner
            </span>
            <span className={`text-lg font-bold ${COLOR_CLASSES.text.primary} md:hidden`}>
              PP
            </span>
          </Link>
        </div>

        {/* Navigation Links - Hidden on mobile */}
        <nav className="hidden md:flex items-center space-x-8">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`text-base font-bold px-3 py-2 rounded-lg transition-all duration-200 ${COLOR_CLASSES.surface.primary} ${COLOR_CLASSES.border.primary} border ${COLOR_CLASSES.text.primary} hover:${COLOR_CLASSES.text.link} hover:${COLOR_CLASSES.surface.secondary} hover:shadow-sm`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Mobile Navigation Links */}
        <nav className="flex md:hidden items-center space-x-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`text-xs font-bold px-1.5 py-0.5 rounded transition-all duration-200 ${COLOR_CLASSES.surface.primary} ${COLOR_CLASSES.border.primary} border ${COLOR_CLASSES.text.primary} hover:${COLOR_CLASSES.text.link} hover:${COLOR_CLASSES.surface.secondary}`}
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
            className={`flex items-center space-x-1 md:space-x-2 px-1.5 py-0.5 md:px-3 md:py-2 rounded-lg ${COLOR_CLASSES.surface.primary} ${COLOR_CLASSES.border.primary} border ${COLOR_CLASSES.text.primary} hover:${COLOR_CLASSES.surface.secondary} transition-colors duration-200`}
            aria-label="Create new project"
          >
            <Plus className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden md:inline text-sm font-medium">New Project</span>
            <span className="md:hidden text-xs font-medium">Create</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={handleThemeToggle}
            className={`p-2 rounded-lg ${COLOR_CLASSES.text.secondary} hover:${COLOR_CLASSES.text.primary} hover:${COLOR_CLASSES.surface.secondary} transition-colors duration-200`}
            aria-label="Toggle theme"
          >
            <Sun className="h-5 w-5" />
          </button>

          {/* Profile Avatar */}
          <button
            onClick={handleProfileClick}
            className={`flex items-center justify-center w-8 h-8 rounded-full ${COLOR_CLASSES.surface.secondary} ${COLOR_CLASSES.text.secondary} hover:${COLOR_CLASSES.text.primary} transition-colors duration-200`}
            aria-label="User profile"
          >
            {userProfile.image ? (
              <img 
                src={userProfile.image} 
                alt={userProfile.name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <User className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar; 