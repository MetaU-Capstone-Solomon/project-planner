/**
 * Frontend Prioritization Service
 * 
 * Handles communication with the backend  API
 */

import { API_BASE_URL } from '@/config/api';
import { MESSAGES } from '@/constants/messages';

/**
 * Optimize roadmap using the backend prioritization algorithm
 * 
 * @param {Object} roadmap - Validated JSON roadmap from AI
 * @param {Object} userConstraints - User input constraints
 * @param {string} userConstraints.timeline - Project timeline
 * @param {string} userConstraints.experienceLevel - User experience level
 * @param {string} userConstraints.scope - Project scope
 * @returns {Promise<Object>} Optimized roadmap
 */
export const optimizeRoadmap = async (roadmap, userConstraints) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/prioritize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roadmap,
        userConstraints
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || MESSAGES.ERROR.ROADMAP_OPTIMIZATION_FAILED);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || MESSAGES.ERROR.OPTIMIZATION_FAILED);
    }

    return result.optimizedRoadmap;
  } catch (error) {
    console.error('Roadmap optimization error:', error);
    throw error;
  }
};

/**
 * Check if prioritization service is available
 * 
 * @returns {Promise<boolean>} True if service is available
 */
export const checkPrioritizationService = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/prioritize`, {
      method: 'OPTIONS',
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}; 