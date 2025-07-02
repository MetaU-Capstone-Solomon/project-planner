import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getDisplayName, isEmailUser } from '@/utils/userUtils';
import { updateUserPassword, signOutUser, validatePassword } from '@/services/profileService';

export const useProfile = () => {
  const { user, signOut, updatePassword } = useAuth();
  const navigate = useNavigate();
  
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const displayName = getDisplayName(user);
  const emailUser = isEmailUser(user);

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

  const handleSignOut = async () => {
    const result = await signOutUser(signOut, navigate);
    if (!result.success) {
      setError(result.error);
    }
  };

  const resetPasswordForm = () => {
    setShowPasswordForm(false);
    setPasswordData({ newPassword: '', confirmPassword: '' });
    setError('');
  };

  return {
    user,
    displayName,
    emailUser,
    showPasswordForm,
    setShowPasswordForm,
    passwordData,
    setPasswordData,
    isLoading,
    error,
    success,
    handlePasswordChange,
    handleSignOut,
    resetPasswordForm
  };
}; 