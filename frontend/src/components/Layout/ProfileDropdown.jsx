import React, { useEffect, useRef } from 'react';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getDisplayName, getAvatarUrl } from '@/utils/userUtils';
import { COLOR_CLASSES } from '@/constants/colors';
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
    image: getAvatarUrl(user)
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
        console.error('Sign out error:', result.error);
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
      className="absolute right-0 top-full mt-2 w-64 md:w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
    >
      {/* User Info Section */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {userProfile.image ? (
              <img
                src={userProfile.image}
                alt={userProfile.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="h-5 w-5 text-gray-500" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {userProfile.name}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {userProfile.email}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="py-2">
        <button
          onClick={() => handleNavigation(ROUTES.PROFILE)}
          className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
        >
          <Settings className="h-4 w-4 mr-3 text-gray-400" />
          Settings
        </button>
        
        <div className="border-t border-gray-100 my-1" />
        
        <button
          onClick={handleSignOut}
          className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
        >
          <LogOut className="h-4 w-4 mr-3 text-red-400" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default ProfileDropdown; 