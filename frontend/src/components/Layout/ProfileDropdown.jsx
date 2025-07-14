import React, { useEffect, useRef } from 'react';
import { User, Settings, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getDisplayName, getAvatarUrl } from '@/utils/userUtils';
import { ROUTES } from '@/constants/routes';
import { signOutUser } from '@/services/profileService';

/**
 * ProfileDropdown Component - User profile dropdown menu
 *
 * Features:
 * - User information display (name, email, avatar)
 * - Settings and sign out actions
 * - Responsive design for all screen sizes
 * - Keyboard navigation support
 * - Click outside to close functionality
 * - name truncates if too long
 * // Example: User clicks "Settings" → navigates to /profile → closes dropdown
 */
const ProfileDropdown = ({ isOpen, onClose, triggerRef }) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const dropdownRef = useRef(null);

  const userProfile = {
    name: getDisplayName(user),
    email: user?.email,
    image: getAvatarUrl(user),
  };

  // Handle click outside to close dropdown
  // Example: User clicks anywhere outside the dropdown or avatar button
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose, triggerRef]);

  // Handle escape key to close dropdown
  const handleEscapeKey = (event) => {
    if (event.key === 'Escape') {
      onClose();
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      const result = await signOutUser(signOut, navigate);
      if (!result.success) {
        console.error('Sign out failed:', result.error);
      }
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Handle navigation
  const handleNavigation = (route) => {
    navigate(route);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-gray-200 bg-white shadow-lg md:w-72"
    >
      {/* User Info Section */}
      <div className="border-b border-gray-100 p-4">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {userProfile.image ? (
              <img
                src={userProfile.image}
                alt={userProfile.name}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
                <User className="h-5 w-5 text-gray-500" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">{userProfile.name}</p>
            <p className="truncate text-xs text-gray-500">{userProfile.email}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="py-2">
        <button
          onClick={() => handleNavigation(ROUTES.PROFILE)}
          className="flex w-full items-center px-4 py-2 text-sm text-gray-700 transition-colors duration-150 hover:bg-gray-50"
        >
          <Settings className="mr-3 h-4 w-4 text-gray-400" />
          Settings
        </button>

        <div className="my-1 border-t border-gray-100" />

        <button
          onClick={handleSignOut}
          className="flex w-full items-center px-4 py-2 text-sm text-red-600 transition-colors duration-150 hover:bg-red-50"
        >
          <LogOut className="mr-3 h-4 w-4 text-red-400" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default ProfileDropdown;
