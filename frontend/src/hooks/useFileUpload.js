import { useState, useCallback } from 'react';
import { API_ENDPOINTS } from '@/config/api';

const useFileUpload = () => {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [processedFile, setProcessedFile] = useState(null);

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
