/**
 * Prompt Builder Utility
 *
 * Handles dynamic prompt generation by replacing variables with project data
 */

import { PROMPT_VARIABLES, ROADMAP_GENERATION_PROMPT } from '@/constants/prompts';

/**
 * Builds a roadmap generation prompt with actual project data
 *
 * @param {Object} projectData - Project information
 * @param {string} projectData.title - Project title
 * @param {string} projectData.description - Project description
 * @returns {string} Formatted prompt with actual values
 */
export const buildRoadmapPrompt = (projectData) => {
  const { title, description } = projectData;

  let prompt = ROADMAP_GENERATION_PROMPT;

  const replacements = {
    [PROMPT_VARIABLES.PROJECT_TITLE]: title || '',
    [PROMPT_VARIABLES.PROJECT_DESCRIPTION]: description || '',
  };

  Object.entries(replacements).forEach(([variable, value]) => {
    const escapedVariable = variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedVariable, 'g');
    prompt = prompt.replace(regex, value);
  });

  return prompt;
};

/**
 * Validates if all required project data is present
 *
 * @param {Object} projectData - Project information
 * @returns {Object} Validation result with isValid boolean and missing fields array
 */
export const validateProjectData = (projectData) => {
  const requiredFields = ['title', 'description'];
  const missingFields = requiredFields.filter((field) => !projectData[field]);

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
};
