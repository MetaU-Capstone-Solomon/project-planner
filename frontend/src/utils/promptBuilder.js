/**
 * Prompt Builder Utility
 * 
 * Handles dynamic prompt generation by replacing variables
 * with actual project data
 */

import { PROMPT_VARIABLES, ROADMAP_GENERATION_PROMPT } from '@/constants/prompts';

/**
 * Builds a roadmap generation prompt with actual project data
 * @param {Object} projectData - Project information
 * @param {string} projectData.title - Project title
 * @param {string} projectData.description - Project description
 * @param {string} projectData.timeline - Project timeline
 * @param {string} projectData.experienceLevel - Developer experience level
 * @param {string} projectData.technologies - Technologies to use
 * @param {string} projectData.scope - Project scope
 * @returns {string} - Formatted prompt with actual values
 */
export const buildRoadmapPrompt = (projectData) => {
  const {
    title,
    description,
    timeline,
    experienceLevel,
    technologies,
    scope
  } = projectData;

  let prompt = ROADMAP_GENERATION_PROMPT;

  // Replace all variables with actual values (using word boundaries to prevent partial matches)
  const replacements = {
    [PROMPT_VARIABLES.PROJECT_TITLE]: title || '',
    [PROMPT_VARIABLES.PROJECT_DESCRIPTION]: description || '',
    [PROMPT_VARIABLES.TIMELINE]: timeline || '',
    [PROMPT_VARIABLES.EXPERIENCE_LEVEL]: experienceLevel || '',
    [PROMPT_VARIABLES.TECHNOLOGIES]: technologies || '',
    [PROMPT_VARIABLES.PROJECT_SCOPE]: scope || ''
  };

  // Perform replacements in a single pass to avoid multiple replacements
  Object.entries(replacements).forEach(([variable, value]) => {
    // Escape special regex characters in the variable
    const escapedVariable = variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedVariable, 'g');
    prompt = prompt.replace(regex, value);
  });

  // Note: Debug logging removed for production

  return prompt;
};

/**
 * Validates if all required project data is present
 * @param {Object} projectData - Project information
 * @returns {Object} - Validation result with isValid boolean and missing fields array
 */
export const validateProjectData = (projectData) => {
  const requiredFields = ['title', 'description', 'timeline', 'experienceLevel'];
  const missingFields = requiredFields.filter(field => !projectData[field]);

  return {
    isValid: missingFields.length === 0,
    missingFields
  };
}; 