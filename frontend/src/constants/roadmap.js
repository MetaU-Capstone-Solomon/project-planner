/**
 * Roadmap Constants
 *
 * constants for roadmap-related functionality
 */

export const PHASE_COLORS = [
  'border-l-blue-500 bg-blue-50',
  'border-l-green-500 bg-green-50',
  'border-l-purple-500 bg-purple-50',
  'border-l-orange-500 bg-orange-50',
  'border-l-red-500 bg-red-50',
  'border-l-indigo-500 bg-indigo-50',
];

export const DEFAULT_PHASE_COLOR = 'border-l-gray-500 bg-gray-50';

// TODO: Add view modes when timeline view is implemented
// export const VIEW_MODES = {
//   ROADMAP: 'roadmap',
//   TIMELINE: 'timeline'
// };
// export const DEFAULT_VIEW_MODE = VIEW_MODES.ROADMAP;

// Task status constants
export const TASK_STATUS = {
  COMPLETED: 'completed',
  PENDING: 'pending',
  IN_PROGRESS: 'in-progress',
};

// Progress constants
export const PROGRESS = {
  DEFAULT: 0,
  MIN: 0,
  MAX: 100,
};

// Markdown parsing constants
export const MARKDOWN = {
  JSON_CODE_BLOCK: '```json',
};
