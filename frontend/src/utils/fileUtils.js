// Configuration
const MAX_DESCRIPTION_LENGTH = parseInt(import.meta.env.VITE_MAX_DESCRIPTION_LENGTH) || 500;

// Extract title and description from file content
export const extractProjectInfo = (content, fileName = '') => {
  if (!content) {
    const cleanFileName = fileName.replace(/\.[^/.]+$/, '');
    return { title: cleanFileName || 'Untitled Project', description: 'No content available' };
  }

  // Clean the content
  const cleanContent = content.replace(/\s+/g, ' ').trim();

  // Extract title from first line or filename
  let title = '';
  const lines = cleanContent.split('\n');
  const firstLine = lines[0].trim();

  if (firstLine && firstLine.length > 3 && firstLine.length < 100) {
    title = firstLine;
  } else {
    const cleanFileName = fileName.replace(/\.[^/.]+$/, '');
    title = cleanFileName || 'Untitled Project';
  }

  // Extract description from remaining content
  const remainingContent = lines.slice(1).join(' ').trim();
  const description =
    remainingContent.length > MAX_DESCRIPTION_LENGTH
      ? remainingContent.substring(0, MAX_DESCRIPTION_LENGTH) + '...'
      : remainingContent || 'No description available';

  return { title, description };
};
