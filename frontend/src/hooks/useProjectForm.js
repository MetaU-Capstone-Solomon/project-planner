import { useCallback } from 'react';
import { CHAT_STAGES } from '@/constants/messages';

export const useProjectForm = (startChatWithDetails, chatLoading, fileLoading, stage) => {
  const handleGenerateRoadmap = useCallback(
    async (processedFile, title) => {
      if (!processedFile) return;
      try {
        await startChatWithDetails({ processedFile, title });
      } catch (error) {
        console.error('Error in form submission:', error);
        throw error;
      }
    },
    [startChatWithDetails]
  );

  const canGenerate = useCallback(
    (processedFile) => {
      const isChatInitiated = stage !== CHAT_STAGES.INITIAL;
      return !!processedFile && !chatLoading && !fileLoading && !isChatInitiated;
    },
    [chatLoading, fileLoading, stage]
  );

  return {
    handleGenerateRoadmap,
    canGenerate,
    resetForm: () => {},
  };
};
