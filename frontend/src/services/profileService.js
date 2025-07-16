import { PASSWORD_MIN_LENGTH, ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/constants/validation';
import { showSuccessToast, showErrorToast } from '@/utils/toastUtils';
import { ROUTES } from '@/constants/routes';

// File Upload Constants
const FILE_UPLOAD_CONSTANTS = {
  MAX_FILE_SIZE_BYTES: 2 * 1024 * 1024, // 2MB in bytes
  CACHE_CONTROL_SECONDS: 3600,
  ALLOWED_IMAGE_TYPES: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'],
};

export const validatePassword = (newPassword, confirmPassword) => {
  if (newPassword !== confirmPassword) {
    return { isValid: false, error: ERROR_MESSAGES.PASSWORDS_DONT_MATCH };
  }
  if (newPassword.length < PASSWORD_MIN_LENGTH) {
    return { isValid: false, error: ERROR_MESSAGES.PASSWORD_TOO_SHORT };
  }

  // Require uppercase, lowercase, number, and special char for stronger security
  const complexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).+$/;
  if (!complexityRegex.test(newPassword)) {
    return { isValid: false, error: ERROR_MESSAGES.PASSWORD_WEAK };
  }

  return { isValid: true };
};

export const updateUserPassword = async (updatePassword, newPassword) => {
  try {
    await updatePassword(newPassword);
    return { success: true, message: SUCCESS_MESSAGES.PASSWORD_UPDATED };
  } catch (error) {
    return { success: false, error: error.message || ERROR_MESSAGES.PASSWORD_UPDATE_FAILED };
  }
};
// User can upload avatar
export const uploadAvatar = async (supabase, userId, file) => {
  // Validate image type & size (<=2MB)
  if (!FILE_UPLOAD_CONSTANTS.ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { success: false, error: 'Unsupported file type' };
  }
  if (file.size > FILE_UPLOAD_CONSTANTS.MAX_FILE_SIZE_BYTES) {
    return { success: false, error: 'File too large (max 2MB)' };
  }

  // Unique path keeps latest upload per user, overwriting previous.
  const filePath = `avatars/${userId}`;

  // Upload — `upsert: true` allows overwrite.
  const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, {
    cacheControl: `${FILE_UPLOAD_CONSTANTS.CACHE_CONTROL_SECONDS}`,
    upsert: true,
    contentType: file.type,
  });
  if (uploadError) {
    return { success: false, error: uploadError.message };
  }

  // Generate public URL (bucket should have public policy or signed URL config).
  const {
    data: { publicUrl },
  } = supabase.storage.from('avatars').getPublicUrl(filePath);

  // Update user metadata
  const { error: updateError } = await supabase.auth.updateUser({
    data: { avatar_url: publicUrl },
  });
  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { success: true, url: publicUrl };
};

/**
 * Sign out user and redirect to landing page
 *
 * @param {Function} signOut - Supabase sign out function
 * @param {Function} navigate - React Router navigate function
 * @returns {Promise<Object>} Result with success status and optional error
 */
export const signOutUser = async (signOut, navigate) => {
  try {
    // Attempt to sign out from Supabase
    await signOut();

    // Show success feedback
    showSuccessToast(SUCCESS_MESSAGES.SIGN_OUT_SUCCESS);

    // Navigate to landing page
    navigate(ROUTES.HOME);

    return { success: true };
  } catch (error) {
    console.error('Sign out error:', error);

    // Show error feedback
    showErrorToast(ERROR_MESSAGES.SIGN_OUT_FAILED);

    // Still attempt navigation to landing page for better UX
    try {
      navigate(ROUTES.HOME);
    } catch (navError) {
      console.error('Navigation error after sign out:', navError);
    }

    return {
      success: false,
      error: error.message || ERROR_MESSAGES.SIGN_OUT_FAILED,
    };
  }
};
