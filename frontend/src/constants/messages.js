/**
 * User-facing message constants
 *
 * Centralized for easy maintenance
 *
 */

export const MESSAGES = {
  SUCCESS: {
    PROJECT_SAVED: 'Project saved successfully!',
    FILE_PROCESSED: '✓ Document processed successfully!',
    MILESTONE_MOVED_UP: 'Milestone moved up successfully',
    MILESTONE_MOVED_DOWN: 'Milestone moved down successfully',
    PHASE_UPDATED: 'Phase updated successfully',
    PHASE_CREATED: 'Phase created successfully',
    PHASE_DELETED: 'Phase deleted successfully',
    PHASE_REORDERED: 'Phase reordered successfully',
  },
  PLACEHOLDERS: {
    PHASE_TIMELINE: 'Not yet set',
  },
  ERROR: {
    PROJECT_SAVE_FAILED: 'Failed to save project. Please try again.',
    PROJECT_LOAD_FAILED: 'Failed to load project.',
    PROJECT_NOT_FOUND: 'The requested project could not be found.',
    NO_ROADMAP: 'No AI roadmap found to save.',
    AI_GENERATION_FAILED: 'An error occurred during AI generation.',
    BACKEND_API_FAILED: 'Failed to fetch from backend API.',
    SUPABASE_INSERT_FAILED: 'Failed to save roadmap to database.',
    TASK_UPDATE_FAILED: 'Failed to update task status. Please try again.',
    ROADMAP_OPTIMIZATION_FAILED: 'Failed to optimize roadmap.',
    OPTIMIZATION_FAILED: 'Optimization failed.',
    DESCRIPTION_SUMMARIZATION_FAILED: 'Failed to summarize description. Using original text.',
  },
  LOADING: {
    DEFAULT: 'Loading...',
    PROCESSING_DOCUMENT: 'Processing document, please wait...',
    GENERATING_ROADMAP: 'Generating roadmap...',
    SAVING_PROJECT: 'Saving...',
  },
  ACTIONS: {
    GENERATE_ROADMAP: 'Generate Roadmap',
    SAVE_PROJECT: 'Save Project',
    VIEW_ROADMAP: 'View Roadmap',
    DEFAULT_TITLE: 'Untitled Project',
  },
  CONTENT: {
    NO_CONTENT_AVAILABLE: 'No content available',
  },
  VALIDATION: {
    INVALID_DATE: 'Invalid Date',
    NO_DATE: 'N/A',
    INVALID_ROADMAP_CONTENT: 'Failed to parse roadmap content',
    ROADMAP_PARSE_FAILED:
      'Roadmap data could not be parsed. Please regenerate your project roadmap.',
    ROADMAP_INCOMPLETE: 'Roadmap data is incomplete. Please regenerate your project roadmap.',
    ROADMAP_VALIDATION_FAILED: 'Roadmap validation failed. Please regenerate your project roadmap.',
  },
};

export const CHAT_STAGES = {
  INITIAL: 'initial',
  AWAITING_CONFIRMATION: 'awaiting_confirmation',
  DONE: 'done',
};
