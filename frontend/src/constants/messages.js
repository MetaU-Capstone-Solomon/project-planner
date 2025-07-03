/**
 * User-facing message constants
 * 
 * Centralized for easy maintenance
 *
 */

export const MESSAGES = {
  PROJECT: {
    SAVE_SUCCESS: 'Project saved successfully!',
    SAVE_ERROR: 'Failed to save project. Please try again.',
    LOAD_ERROR: 'Failed to load project.',
    NOT_FOUND: 'The requested project could not be found.',
    NO_ROADMAP: 'No AI roadmap found to save.',
    DEFAULT_TITLE: 'Untitled Project'
  },
  LOADING: {
    DEFAULT: 'Loading...',
    PROCESSING: 'Processing document, please wait...',
    GENERATING: 'Generating...',
    GENERATE_ROADMAP: 'Generate Roadmap'
  },
  FILE: {
    PROCESSED_SUCCESS: '✓ Document processed successfully!'
  }
}; 