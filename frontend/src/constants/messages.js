/**
 * User-facing message constants
 * 
 * Centralized for easy maintenance
 *
 */

export const MESSAGES = {
  SUCCESS: {
    PROJECT_SAVED: 'Project saved successfully!',
    FILE_PROCESSED: '✓ Document processed successfully!'
  },
  ERROR: {
    PROJECT_SAVE_FAILED: 'Failed to save project. Please try again.',
    PROJECT_LOAD_FAILED: 'Failed to load project.',
    PROJECT_NOT_FOUND: 'The requested project could not be found.',
    NO_ROADMAP: 'No AI roadmap found to save.',
    AI_GENERATION_FAILED: 'An error occurred during AI generation.',
    BACKEND_API_FAILED: 'Failed to fetch from backend API.',
    SUPABASE_INSERT_FAILED: 'Failed to save roadmap to database.'
  },
  LOADING: {
    DEFAULT: 'Loading...',
    PROCESSING_DOCUMENT: 'Processing document, please wait...',
    GENERATING_ROADMAP: 'Generating roadmap...',
    SAVING_PROJECT: 'Saving...'
  },
  ACTIONS: {
    GENERATE_ROADMAP: 'Generate Roadmap',
    SAVE_PROJECT: 'Save Project',
    VIEW_ROADMAP: 'View Roadmap',
    DEFAULT_TITLE: 'Untitled Project'
  },
  CONTENT: {
    NO_CONTENT_AVAILABLE: 'No content available'
  }
};

export const CHAT_STAGES = {
  INITIAL: 'initial',
  AWAITING_CONFIRMATION: 'awaiting_confirmation',
  DONE: 'done'
}; 