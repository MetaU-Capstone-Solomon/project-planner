import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveProject } from '@/services/projectService';
import { optimizeRoadmap } from '@/services/prioritizationService';
import { showSuccessToast, showErrorToast } from '@/utils/toastUtils';
import { createISOTimestamp } from '@/utils/dateUtils';
import { MESSAGES } from '@/constants/messages';
import { MESSAGE_TYPES } from '@/constants/messageTypes';
import { ROUTES } from '@/constants/routes';
import { validateRoadmapContent, getValidationErrorMessage, getParsedRoadmap } from '@/utils/roadmapValidation';
import resetNewProjectState from '@/utils/resetNewProjectState';

/**
 * useProjectSave.js
 *
 * Custom React hook for handling the complete project saving workflow in the New Project Chat flow.
 *
 * Responsibilities:
 * - Extracts roadmap from AI chat messages using message types
 * - Validates and saves project to the database
 * - Shows toast notifications for success/error
 * - Manages loading and success states
 * - Clears all relevant localStorage keys after saving (via clearNewProjectState)
 * - Auto-redirects to project detail page after save
 *
 * Usage:
 *   const { saving, savedProjectId, handleSaveProject } = useProjectSave(messages, formValues);
 */

// Navigation Constants
const NAVIGATION_CONSTANTS = {
  REDIRECT_DELAY_MS: 100
};

/**
 * Custom hook for project saving functionality
 * 
 * Handles the complete project saving workflow:
 * - Extracts roadmap from AI chat messages using message types
 * - Saves project to database
 * - Shows appropriate toast notifications
 * - Manages loading and success states
 * - Auto-redirects to project detail page after save
 * 
 * @param {Array} messages - Chat messages to extract roadmap from
 * @param {Object} formValues - Form values for project title
 * @returns {Object} - Project saving state and handlers
 */
export const useProjectSave = (messages, formValues) => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [savedProjectId, setSavedProjectId] = useState(null);

  // Find roadmap message using message type - get the latest one
  const findRoadmapMessage = useCallback(() => {
    // Find the last roadmap message (most recent modification)
    const roadmapMessages = messages.filter(m => m.role === 'assistant' && m.type === MESSAGE_TYPES.ROADMAP);
    return roadmapMessages.length > 0 ? roadmapMessages[roadmapMessages.length - 1] : null;
  }, [messages]);

  // Clear localStorage after successful save
  const clearLocalStorage = useCallback(() => {
    resetNewProjectState();
  }, []);

  const handleSaveProject = useCallback(async () => {
    if (saving || savedProjectId) return;
    
    setSaving(true);
    try {
      // Use message type to find roadmap instead of last assistant message
      const roadmapMessage = findRoadmapMessage();
      if (!roadmapMessage) {
        throw new Error(MESSAGES.ERROR.NO_ROADMAP);
      }

      // Validate roadmap content before saving
      const validationResult = validateRoadmapContent(roadmapMessage.content);
      if (!validationResult.isValid) {
        const errorMessage = getValidationErrorMessage(validationResult);
        throw new Error(errorMessage || MESSAGES.VALIDATION.ROADMAP_PARSE_FAILED);
      }

      // Parse the validated roadmap (no redundant markdown stripping)
      let optimizedContent = roadmapMessage.content;
      
      try {
        // Get parsed roadmap using the helper function
        const roadmap = getParsedRoadmap(roadmapMessage.content);
        
        if (roadmap) {
          // Apply prioritization algorithm if user constraints are available
          if (formValues?.timeline && formValues?.experienceLevel && formValues?.projectScope) {
            const userConstraints = {
              timeline: formValues.timeline,
              experienceLevel: formValues.experienceLevel,
              scope: formValues.projectScope
            };
            
            const optimizedRoadmap = await optimizeRoadmap(roadmap, userConstraints);
            optimizedContent = JSON.stringify(optimizedRoadmap, null, 2);
          }
        }
      } catch (error) {
        // Continue with original content if prioritization fails
      }

      const projectData = {
        title: formValues?.title || MESSAGES.ACTIONS.DEFAULT_TITLE,
        content: optimizedContent,
        created_at: createISOTimestamp(),
      };

      const result = await saveProject(projectData);
      if (result.success) {
        showSuccessToast(MESSAGES.SUCCESS.PROJECT_SAVED);
        setSavedProjectId(result.projectId);
        
        // Clear localStorage immediately before redirect
        clearLocalStorage();
        
        // Small delay to ensure localStorage is cleared before navigation
        setTimeout(() => {
          navigate(ROUTES.PROJECT_DETAIL.replace(':projectId', result.projectId));
        }, NAVIGATION_CONSTANTS.REDIRECT_DELAY_MS);
        
        return result;
      } else {
        throw new Error(result.error || MESSAGES.ERROR.PROJECT_SAVE_FAILED);
      }
    } catch (error) {
      showErrorToast(error.message || MESSAGES.ERROR.PROJECT_SAVE_FAILED);
      throw error;
    } finally {
      setSaving(false);
    }
  }, [saving, savedProjectId, messages, formValues, findRoadmapMessage, navigate, clearLocalStorage]);

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