import { useCallback } from 'react';
import useForm from '@/hooks/useForm';
import { FORM_FIELDS } from '@/constants/projectOptions';
import { hasRequiredFields, getFinalTimeline } from '@/utils/formValidation';

export const useProjectForm = (startChatWithDetails, chatLoading, fileLoading) => {
  // Initialize form with all project fields
  const { values, handleChange } = useForm({
    [FORM_FIELDS.TITLE]: '',
    [FORM_FIELDS.DESCRIPTION]: '',
    [FORM_FIELDS.TIMELINE]: '',
    [FORM_FIELDS.CUSTOM_TIMELINE]: '',
    [FORM_FIELDS.EXPERIENCE_LEVEL]: '',
    [FORM_FIELDS.TECHNOLOGIES]: '',
    [FORM_FIELDS.PROJECT_SCOPE]: '',
  });

  // validation
  const handleGenerateRoadmap = useCallback((processedFile) => {
    if (hasRequiredFields(values)) {
      const finalTimeline = getFinalTimeline(values);
      startChatWithDetails({ ...values, timeline: finalTimeline, processedFile });
    }
  }, [values, startChatWithDetails]);

  // Check if generate button should be enabled
  const canGenerate = useCallback((processedFile) => {
    return hasRequiredFields(values) && !chatLoading && !fileLoading;
  }, [values, chatLoading, fileLoading]);

  return {
    values,
    handleChange,
    handleGenerateRoadmap,
    canGenerate
  };
}; 