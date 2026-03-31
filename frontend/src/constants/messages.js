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
    INVITATION_SENT: 'Invitation sent successfully!',
    COLLABORATOR_REMOVED: 'Team member removed.',
    ROLE_SAVED: 'Your preferences have been saved.',
    API_KEY_SAVED: 'API key saved and verified.',
    API_KEY_REMOVED: "API key removed. You're back on the free tier.",
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
    PERMISSION_DENIED: 'You do not have permission to perform this action.',
    PROJECT_ACCESS_DENIED: 'You do not have access to this project.',
    PROJECT_EDIT_DENIED: 'You do not have permission to edit this project.',
    PROJECT_DELETE_DENIED: 'You do not have permission to delete this project.',
    PERMISSION_CHECK_FAILED: 'Failed to verify permissions. Please try again.',
    INVITATION_FAILED: 'Failed to send invitation. Please try again.',
    INVITATION_ACCEPT_FAILED: 'Failed to accept invitation. The link may be expired or invalid.',
    PROJECTS_LOAD_FAILED: 'Failed to load projects. Please try again.',
    COLLABORATORS_LOAD_FAILED: 'Failed to load team members.',
    API_KEY_INVALID: 'Invalid or expired key. Please check it and try again.',
    API_KEY_SAVE_FAILED: 'Failed to save API key. Please try again.',
    USAGE_LIMIT_REACHED: 'Monthly limit reached. Add your API key in Settings to continue.',
    SETTINGS_LOAD_FAILED: 'Failed to load settings.',
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
  COLLABORATION: {
    ROLES: {
      ADMIN: 'admin',
      EDITOR: 'editor',
      VIEWER: 'viewer',
    },
    ROLE_DESCRIPTIONS: {
      admin: 'Can manage everything including deleting the project',
      editor: 'Can edit and manage tasks, milestones, and project content',
      viewer: 'Can only view the project and track progress',
    },
    PERMISSIONS: {
      VIEW: 'view',
      EDIT: 'edit',
      DELETE: 'delete',
      INVITE: 'invite',
    },
  },
  CONTENT: {
    NO_CONTENT_AVAILABLE: 'No content available',
  },
  VALIDATION: {
    INVALID_DATE: 'Invalid Date',
    EMAIL_REQUIRED: 'Email is required',
    EMAIL_INVALID: 'Please enter a valid email address',
    MESSAGE_TOO_LONG: 'Message is too long',
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
