export const validateFile = (
  file,
  allowedTypes = ['.pdf', '.doc', '.docx', '.txt'],
  maxSize = 10 * 1024 * 1024
) => {
  if (!file) return { isValid: false, error: 'No file selected' };

  const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
  if (!allowedTypes.includes(fileExtension)) {
    return {
      isValid: false,
      error: `File type not supported. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File too large. Maximum size: ${Math.round(maxSize / (1024 * 1024))}MB`,
    };
  }

  return { isValid: true, error: null };
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
