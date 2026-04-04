import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { getDisplayName, isEmailUser, getAvatarUrl } from '@/utils/userUtils';
import { API_ENDPOINTS } from '@/config/api';
import {
  updateUserPassword,
  updateUserProfile,
  deleteUserAccount,
  signOutUser,
  validatePassword,
  uploadAvatar,
} from '@/services/profileService';

export const useProfile = () => {
  const { user, signOut, updatePassword, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarTimestamp, setAvatarTimestamp] = useState(Date.now());

  const displayName = getDisplayName(user);
  const emailUser = isEmailUser(user);
  const avatarUrl = getAvatarUrl(user);

  // Keep form values in sync with current user data
  useEffect(() => {
    if (user) {
      setProfileData({
        fullName: user.user_metadata?.full_name || user.user_metadata?.name || '',
        email: user.email || '',
      });
    }
  }, [user]);

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

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setError('');

    const result = await updateUserProfile(supabase, profileData, user?.email);
    if (result.success) {
      await refreshUser();
      setSuccess('Profile updated successfully.');
    } else {
      setError(result.error);
    }

    setProfileSaving(false);
  };

  const handleAvatarUpload = async (file) => {
    setAvatarLoading(true);
    const { success, error, url } = await uploadAvatar(supabase, user.id, file);
    if (success) {
      setAvatarTimestamp(Date.now());
    }
    if (error) {
      setError(error);
    }
    setAvatarLoading(false);
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    setError('');

    const session = await supabase.auth.getSession();
    const accessToken = session?.data?.session?.access_token;
    if (!accessToken) {
      setError('Unable to delete account. Please sign in again.');
      setDeleteLoading(false);
      return;
    }

    const result = await deleteUserAccount(API_ENDPOINTS.USER_ACCOUNT, accessToken);
    if (result.success) {
      await signOutUser(signOut, navigate);
    } else {
      setError(result.error);
    }

    setDeleteLoading(false);
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
    profileData,
    setProfileData,
    showPasswordForm,
    setShowPasswordForm,
    passwordData,
    setPasswordData,
    isLoading,
    profileSaving,
    deleteLoading,
    error,
    success,
    handlePasswordChange,
    handleProfileSave,
    handleSignOut,
    handleAvatarUpload,
    handleDeleteAccount,
    avatarLoading,
    resetPasswordForm,
    clearErrorOnInput,
  };
};
