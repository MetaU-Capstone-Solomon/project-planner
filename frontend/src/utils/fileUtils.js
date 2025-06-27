// File validation and processing utilities
export const validateFile = (
  file,
  allowedTypes = ['.pdf', '.doc', '.docx', '.txt'],
  maxSize = 10 * 1024 * 1024
) => {
  if (!file) return { isValid: false, error: 'No file selected' };

  // Check file type
  const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
  if (!allowedTypes.includes(fileExtension)) {
    return {
      isValid: false,
      error: `File type not supported. Allowed: ${allowedTypes.join(', ')}`,
    };
  }

  // Check file size
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File too large. Max size: ${maxSize / (1024 * 1024)}MB`,
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

// Read file content as text
export const readFileAsText = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve('');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
};

// Process file content 
export const processFileContent = (content, maxLength = 150000) => {
  if (!content) return { content: '', isTruncated: false };

  const isTruncated = content.length > maxLength;
  const processedContent = isTruncated ? content.substring(0, maxLength) : content;

  return { content: processedContent, isTruncated };
};
