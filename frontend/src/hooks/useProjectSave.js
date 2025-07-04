import { useState, useCallback } from 'react';
import { saveProject } from '@/services/projectService';
import { showSuccessToast, showErrorToast } from '@/utils/toastUtils';
import { createISOTimestamp } from '@/utils/dateUtils';
import { MESSAGES } from '@/constants/messages';
import { MESSAGE_TYPES } from '@/constants/messageTypes';

/**
 * Custom hook for project saving functionality
 * 
 * Handles the complete project saving workflow:
 * - Extracts roadmap from AI chat messages using message types
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

  // Find roadmap message using message type
  const findRoadmapMessage = useCallback(() => {
    return messages.find(m => m.role === 'assistant' && m.type === MESSAGE_TYPES.ROADMAP);
  }, [messages]);

  const handleSaveProject = useCallback(async () => {
    if (saving || savedProjectId) return;
    
    setSaving(true);
    try {
      // Use message type to find roadmap instead of last assistant message
      const roadmapMessage = findRoadmapMessage();
      if (!roadmapMessage) {
        throw new Error(MESSAGES.ERROR.NO_ROADMAP);
      }

      const projectData = {
        title: formValues?.title || MESSAGES.ACTIONS.DEFAULT_TITLE,
        content: roadmapMessage.content,
        created_at: createISOTimestamp(),
      };

      const result = await saveProject(projectData);
      if (result.success) {
        showSuccessToast(MESSAGES.SUCCESS.PROJECT_SAVED);
        setSavedProjectId(result.projectId);
        return result;
      } else {
        throw new Error(result.error || MESSAGES.ERROR.PROJECT_SAVE_FAILED);
      }
    } catch (error) {
      console.error('Error saving project:', error);
      showErrorToast(MESSAGES.ERROR.PROJECT_SAVE_FAILED);
      throw error;
    } finally {
      setSaving(false);
    }
  }, [saving, savedProjectId, messages, formValues, findRoadmapMessage]);

  const resetSaveState = useCallback(() => {
    setSavedProjectId(null);
  }, []);

  return {
    saving,
    savedProjectId,
    handleSaveProject,
    resetSaveState,
    findRoadmapMessage,
  };
}; 