import { useState, useCallback } from 'react';
import { saveProject } from '@/services/projectService';
import { showSuccessToast, showErrorToast } from '@/utils/toastUtils';
import { MESSAGES } from '@/constants/messages';

/**
 * Custom hook for project saving functionality
 * 
 * Handles the complete project saving workflow:
 * - Extracts roadmap from AI chat messages
 * - Saves project to database
 * - Shows appropriate toast notifications
 * - Manages loading and success states
 * 
 * @param {Array} messages - Chat messages to extract roadmap from
 * @param {Object} formValues - Form values for project title
 * @returns {Object} - Project saving state and handlers
 */
export const useProjectSave = (messages, formValues) => {
  const [saving, setSaving] = useState(false);
  const [savedProjectId, setSavedProjectId] = useState(null);

  const handleSaveProject = useCallback(async () => {
    if (saving || savedProjectId) return;
    
    setSaving(true);
    try {
      const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');
      if (!lastAssistantMessage) {
        throw new Error(MESSAGES.PROJECT.NO_ROADMAP);
      }

      const result = await saveProject({
        title: formValues?.title || MESSAGES.PROJECT.DEFAULT_TITLE,
        content: lastAssistantMessage.content,
      });

      if (result.success) {
        setSavedProjectId(result.projectId);
        showSuccessToast(MESSAGES.PROJECT.SAVE_SUCCESS);
        
        console.log('Project saved successfully!', {
          projectId: result.projectId,
          title: formValues?.title || MESSAGES.PROJECT.DEFAULT_TITLE,
          content: lastAssistantMessage.content.substring(0, 100) + '...',
          savedAt: new Date().toISOString()
        });
        
        return result.projectId;
      } else {
        throw new Error(result.error || MESSAGES.PROJECT.SAVE_ERROR);
      }
    } catch (error) {
      console.error('Failed to save project:', error);
      showErrorToast(MESSAGES.PROJECT.SAVE_ERROR);
      throw error;
    } finally {
      setSaving(false);
    }
  }, [saving, savedProjectId, messages, formValues]);

  const resetSaveState = useCallback(() => {
    setSavedProjectId(null);
  }, []);

  return {
    saving,
    savedProjectId,
    handleSaveProject,
    resetSaveState,
  };
}; 