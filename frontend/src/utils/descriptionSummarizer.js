import { API_ENDPOINTS } from '@/config/api';
import { MESSAGES } from '@/constants/messages';
import { VALIDATION_CONSTANTS } from '@/constants/validation';

/**
 * Summarizes description text if it exceeds the maximum length
 *
 * Uses the same summarization algorithm as file uploads:
 *
 * @param {string} description - The description text to potentially summarize
 * @returns {Promise<Object>} - Object containing original and summarized text
 * @returns {string} returns.originalText - The original description text
 * @returns {string} returns.summarizedText - The summarized text (or original if no summarization needed)
 * @returns {boolean} returns.isSummarized - Whether the text was actually summarized
 */
export const summarizeDescription = async (description) => {
  // If description is within limit, return as is
  if (!description || description.length <= VALIDATION_CONSTANTS.DESCRIPTION_MAX_LENGTH) {
    return {
      originalText: description,
      summarizedText: description,
      isSummarized: false,
    };
  }

  try {
    const response = await fetch(API_ENDPOINTS.SUMMARIZE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: description }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || MESSAGES.ERROR.BACKEND_API_FAILED);
    }

    const result = await response.json();
    return {
      originalText: result.originalText,
      summarizedText: result.summarizedText,
      isSummarized: result.isSummarized,
    };
  } catch (error) {
    console.error('Description summarization error:', error);
    // If summarization fails, return original text
    return {
      originalText: description,
      summarizedText: description,
      isSummarized: false,
    };
  }
};
