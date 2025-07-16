import { MESSAGES } from '@/constants/messages';

// Configuration
const MAX_DESCRIPTION_LENGTH = parseInt(import.meta.env.VITE_MAX_DESCRIPTION_LENGTH) || 500;

// File Processing Constants
const FILE_PROCESSING_CONSTANTS = {
  MIN_TITLE_LENGTH: 3,
  MAX_TITLE_LENGTH: 100,
};

// Extract title and description from file content
export const extractProjectInfo = (content, fileName = '') => {
  if (!content) {
    const cleanFileName = fileName.replace(/\.[^/.]+$/, '');
    return {
      title: cleanFileName || MESSAGES.ACTIONS.DEFAULT_TITLE,
      description: MESSAGES.CONTENT.NO_CONTENT_AVAILABLE,
    };
  }

  // Clean the content
  const cleanContent = content.replace(/\s+/g, ' ').trim();

  // Extract title from first line or filename
  let title = '';
  const lines = cleanContent.split('\n');
  const firstLine = lines[0].trim();

  if (
    firstLine &&
    firstLine.length > FILE_PROCESSING_CONSTANTS.MIN_TITLE_LENGTH &&
    firstLine.length < FILE_PROCESSING_CONSTANTS.MAX_TITLE_LENGTH
  ) {
    title = firstLine;
  } else {
    const cleanFileName = fileName.replace(/\.[^/.]+$/, '');
    title = cleanFileName || MESSAGES.ACTIONS.DEFAULT_TITLE;
  }

  // Extract description from remaining content
  const remainingContent = lines.slice(1).join(' ').trim();
  const description =
    remainingContent.length > MAX_DESCRIPTION_LENGTH
      ? remainingContent.substring(0, MAX_DESCRIPTION_LENGTH) + '...'
      : remainingContent || MESSAGES.CONTENT.NO_CONTENT_AVAILABLE;

  return { title, description };
};
