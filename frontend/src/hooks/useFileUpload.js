import { useState, useCallback } from 'react';
import { API_ENDPOINTS } from '@/config/api';

// hook for handling file uploads and processing
const useFileUpload = () => {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [processedFile, setProcessedFile] = useState(null);

  // Handles file selection, upload, and processing
  const handleFileSelect = useCallback(async (selectedFile) => {
    if (!selectedFile) {
      setFile(null);
      setProcessedFile(null);
      setError('');
      return;
    }

    setFile(selectedFile);
    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch(API_ENDPOINTS.UPLOAD, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload file');
      }

      const result = await response.json();
      setProcessedFile(result);
    } catch (err) {
      console.error('File upload error:', err);
      setError(err.message);
      setFile(null);
      setProcessedFile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Resets all file-related states
  const clearFile = useCallback(() => {
    setFile(null);
    setProcessedFile(null);
    setError('');
  }, []);

  return {
    file,
    processedFile,
    error,
    loading,
    handleFileSelect,
    clearFile,
  };
};

export default useFileUpload;
