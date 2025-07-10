import { useState, useCallback, useEffect } from 'react';
import { API_ENDPOINTS } from '@/config/api';

// hook for handling file uploads and processing
const useFileUpload = () => {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [processedFile, setProcessedFile] = useState(null);

  // Save file data to localStorage
  const saveFileData = useCallback((fileData, processedData) => {
    if (fileData) {
      localStorage.setItem('projectFile', JSON.stringify(fileData));
    }
    if (processedData) {
      localStorage.setItem('processedFile', JSON.stringify(processedData));
    }
  }, []);

  // Load saved file data on mount
  useEffect(() => {
    const savedFile = JSON.parse(localStorage.getItem('projectFile') || 'null');
    const savedProcessedFile = JSON.parse(localStorage.getItem('processedFile') || 'null');
    
    if (savedFile) {
      setFile(savedFile);
    }
    if (savedProcessedFile) {
      setProcessedFile(savedProcessedFile);
    }
  }, []);

  // Handles file selection, upload, and processing
  const handleFileSelect = useCallback(async (selectedFile) => {
    if (!selectedFile) {
      setFile(null);
      setProcessedFile(null);
      setError('');
      saveFileData(null, null);
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
      saveFileData(selectedFile, result);
    } catch (err) {
      console.error('File upload error:', err);
      setError(err.message);
      setFile(null);
      setProcessedFile(null);
      saveFileData(null, null);
    } finally {
      setLoading(false);
    }
  }, [saveFileData]);

  // Resets all file-related states
  const clearFile = useCallback(() => {
    setFile(null);
    setProcessedFile(null);
    setError('');
    saveFileData(null, null);
  }, [saveFileData]);

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
