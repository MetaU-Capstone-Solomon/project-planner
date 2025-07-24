import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { getDisplayName, isEmailUser, getAvatarUrl } from '@/utils/userUtils';
import {
  updateUserPassword,
  signOutUser,
  validatePassword,
  uploadAvatar,
} from '@/services/profileService';

export const useProfile = () => {
  const { user, signOut, updatePassword } = useAuth();
  const navigate = useNavigate();

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarTimestamp, setAvatarTimestamp] = useState(Date.now());

  const displayName = getDisplayName(user);
  const emailUser = isEmailUser(user);
  const avatarUrl = getAvatarUrl(user);

  // Add cache busting to avatar URL
  const avatarUrlWithCache = avatarUrl ? `${avatarUrl}?t=${avatarTimestamp}` : avatarUrl;

  // Auto-dismiss success messages after 5 seconds (errors persist until user action)
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [success]);

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    const validation = validatePassword(passwordData.newPassword, passwordData.confirmPassword);
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    setIsLoading(true);
    setError('');

    const result = await updateUserPassword(updatePassword, passwordData.newPassword);

    if (result.success) {
      setSuccess(result.message);
      setPasswordData({ newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
    } else {
      setError(result.error);
    }

    setIsLoading(false);
  };

  const handleAvatarUpload = async (file) => {
    setAvatarLoading(true);
    const { success, error, url } = await uploadAvatar(supabase, user.id, file);
    if (!success) {
      setError(error);
    } else {
      // Update timestamp immediately for instant display
      setAvatarTimestamp(Date.now());
      setSuccess('Avatar updated successfully!');
    }
    setAvatarLoading(false);
  };

  const handleSignOut = async () => {
    try {
      const result = await signOutUser(signOut, navigate);
      if (!result.success) {
        setError(result.error);
      }
    } catch (error) {
      console.error('Sign out error in useProfile:', error);
      setError('Failed to sign out. Please try again.');
    }
  };

  const resetPasswordForm = () => {
    setShowPasswordForm(false);
    setPasswordData({ newPassword: '', confirmPassword: '' });
    setError('');
  };

  // Clear error state when user starts typing in password fields
  const clearErrorOnInput = () => {
    if (error) {
      setError('');
    }
  };

  return {
    user,
    displayName,
    emailUser,
    avatarUrl: avatarUrlWithCache, // Use the cached avatar URL
    showPasswordForm,
    setShowPasswordForm,
    passwordData,
    setPasswordData,
    isLoading,
    error,
    success,
    handlePasswordChange,
    handleSignOut,
    handleAvatarUpload,
    avatarLoading,
    resetPasswordForm,
    clearErrorOnInput,
  };
};
