import { useState, useCallback } from 'react';
import { validateFile } from '@/utils/fileUtils';

const useFileUpload = (
  allowedTypes = ['.pdf', '.doc', '.docx', '.txt'],
  maxSize = 10 * 1024 * 1024
) => {
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = useCallback(
    (selectedFile) => {
      const validation = validateFile(selectedFile, allowedTypes, maxSize);

      if (validation.isValid) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError(validation.error);
        setFile(null);
      }
    },
    [allowedTypes, maxSize]
  );

  const clearFile = useCallback(() => {
    setFile(null);
    setError(null);
  }, []);

  return {
    file,
    error,
    handleFileSelect,
    clearFile,
  };
};

export default useFileUpload;
