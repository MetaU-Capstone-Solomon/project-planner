import { PASSWORD_MIN_LENGTH, ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/constants/validation';

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
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return { success: false, error: 'Unsupported file type' };
  }
  if (file.size > 2 * 1024 * 1024) {
    return { success: false, error: 'File too large (max 2MB)' };
  }

  // Unique path keeps latest upload per user, overwriting previous.
  const filePath = `avatars/${userId}`;

  // Upload — `upsert: true` allows overwrite.
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      cacheControl: '3600',
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

export const signOutUser = async (signOut, navigate) => {
  try {
    await signOut();
    navigate('/');
    return { success: true };
  } catch (error) {
    return { success: false, error: ERROR_MESSAGES.SIGN_OUT_FAILED };
  }
}; 