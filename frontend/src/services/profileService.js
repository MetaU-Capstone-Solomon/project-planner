import { PASSWORD_MIN_LENGTH, ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/constants/validation';

export const validatePassword = (newPassword, confirmPassword) => {
  if (newPassword !== confirmPassword) {
    return { isValid: false, error: ERROR_MESSAGES.PASSWORDS_DONT_MATCH };
  }
  if (newPassword.length < PASSWORD_MIN_LENGTH) {
    return { isValid: false, error: ERROR_MESSAGES.PASSWORD_TOO_SHORT };
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

export const signOutUser = async (signOut, navigate) => {
  try {
    await signOut();
    navigate('/');
    return { success: true };
  } catch (error) {
    return { success: false, error: ERROR_MESSAGES.SIGN_OUT_FAILED };
  }
}; 