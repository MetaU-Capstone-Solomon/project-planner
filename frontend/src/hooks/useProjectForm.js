import { useCallback } from 'react';
import useProjectDetail from '@/hooks/useProjectDetail';
import { FORM_FIELDS } from '@/constants/projectOptions';
import { hasRequiredFields, getFinalTimeline } from '@/utils/formValidation';
import { CHAT_STAGES } from '@/constants/messages';
import { summarizeDescription } from '@/utils/descriptionSummarizer';

// Hook for managing project form state and validation
export const useProjectForm = (startChatWithDetails, chatLoading, fileLoading, stage) => {
  // Initialize form with all project fields
  const { values, handleChange, reset } = useProjectDetail({
    [FORM_FIELDS.TITLE]: '',
    [FORM_FIELDS.DESCRIPTION]: '',
    [FORM_FIELDS.TIMELINE]: '',
    [FORM_FIELDS.CUSTOM_TIMELINE]: '',
    [FORM_FIELDS.EXPERIENCE_LEVEL]: '',
    [FORM_FIELDS.TECHNOLOGIES]: '',
    [FORM_FIELDS.PROJECT_SCOPE]: '',
  });

  // Validates and submits form data to generate roadmap
  const handleGenerateRoadmap = useCallback(
    async (processedFile) => {
      if (hasRequiredFields(values)) {
        try {
          const finalTimeline = getFinalTimeline(values);

          // Summarize description if it's too long
          const descriptionResult = await summarizeDescription(values[FORM_FIELDS.DESCRIPTION]);

          // Use summarized description if available, otherwise use original
          const formData = {
            ...values,
            description: descriptionResult.summarizedText,
            timeline: finalTimeline,
            processedFile,
          };

          startChatWithDetails(formData);
        } catch (error) {
          console.error('Error in form submission:', error);
          throw error;
        }
      }
    },
    [values, startChatWithDetails]
  );

  // Checks if form is valid and not currently loading
  // Also disables generate button once chat has been initiated
  const canGenerate = useCallback(
    (processedFile) => {
      const isChatInitiated = stage !== CHAT_STAGES.INITIAL;
      return hasRequiredFields(values) && !chatLoading && !fileLoading && !isChatInitiated;
    },
    [values, chatLoading, fileLoading, stage]
  );

  return {
    values,
    handleChange,
    handleGenerateRoadmap,
    canGenerate,
    resetForm: reset,
  };
};
