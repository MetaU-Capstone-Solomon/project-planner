/**
 * Message types for chat interactions
 *
 * Used to identify different types of messages in the chat system
 * for roadmap detection and error handling
 */

export const MESSAGE_TYPES = {
  REQUEST: 'request',
  ROADMAP: 'roadmap',
  ERROR: 'error',
  EXPLANATION: 'explanation',
};

/**
 * Message type descriptions for better understanding
 */
export const MESSAGE_TYPE_DESCRIPTIONS = {
  [MESSAGE_TYPES.REQUEST]: 'User request or input',
  [MESSAGE_TYPES.ROADMAP]: 'Generated project roadmap',
  [MESSAGE_TYPES.ERROR]: 'Error message from AI or system',
  [MESSAGE_TYPES.EXPLANATION]: 'General explanation or response',
};
