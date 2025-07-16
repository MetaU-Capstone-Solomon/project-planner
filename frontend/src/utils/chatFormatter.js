/**
 * Chat Formatter Utility
 *
 * PURPOSE:
 * This utility formats AI-generated roadmap JSON responses into readable text
 * for display in the chat interface.
 *
 * KEY FEATURES:
 * - Removes markdown code block markers (```json, ```)
 * - Parses JSON roadmap data safely
 * - Formats phases, milestones, and tasks hierarchically
 * - Shows only high-level information (no detailed task descriptions)
 * - Maintains proper indentation for readability
 *
 */

/**
 * Formats a phase as readable text
 *
 * Converts a phase object into a formatted string with:
 * - Phase number and title
 * - Timeline information
 * - All milestones within the phase
 *
 * @param {Object} phase - Phase object from roadmap JSON
 * @param {number} index - Phase index for numbering
 * @returns {string} - Formatted phase text with proper indentation
 */
const formatPhaseText = (phase, index) => {
  let text = `Phase ${index + 1}: ${phase.title}\n`;
  if (phase.timeline) {
    text += `Timeline: ${phase.timeline}\n`;
  }
  text += '\n';

  if (phase.milestones && Array.isArray(phase.milestones)) {
    phase.milestones.forEach((milestone, mIndex) => {
      text += formatMilestoneText(milestone, mIndex);
    });
  }

  return text;
};

/**
 * Formats a milestone as readable text
 * @param {Object} milestone - Milestone object
 * @param {number} index - Milestone index
 * @returns {string} - Formatted milestone text
 */
const formatMilestoneText = (milestone, index) => {
  let text = `  Milestone ${index + 1}: ${milestone.title}\n`;
  if (milestone.timeline) {
    text += `  Timeline: ${milestone.timeline}\n`;
  }
  text += '\n';

  if (milestone.tasks && Array.isArray(milestone.tasks)) {
    text += '  Tasks:\n';
    milestone.tasks.forEach((task, tIndex) => {
      text += formatTaskText(task, tIndex);
    });
  }

  return text;
};

/**
 * Formats a task as readable text
 * @param {Object} task - Task object
 * @param {number} index - Task index
 * @returns {string} - Formatted task text
 */
const formatTaskText = (task, index) => {
  let text = `    ${index + 1}. ${task.title}\n`;

  if (task.estimatedHours) {
    text += `       Estimated: ${task.estimatedHours} hours\n`;
  }

  text += '\n';
  return text;
};

/**
 * Removes markdown code block markers from text
 * @param {string} text - The text to clean
 * @returns {string} - Text without code block markers
 */
const removeCodeBlockMarkers = (text) => {
  if (!text || typeof text !== 'string') return text;

  // Remove ```json and ``` markers
  return text.replace(/```json\s*\n?/g, '').replace(/```\s*$/g, '');
};

/**
 * Removes markdown formatting from text
 * @param {string} text - The text to clean
 * @returns {string} - Text without markdown formatting
 */
const removeMarkdownFormatting = (text) => {
  if (!text || typeof text !== 'string') return text;
  
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markers
    .replace(/\*(.*?)\*/g, '$1')     // Remove italic markers
    .replace(/`(.*?)`/g, '$1')       // Remove inline code markers
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove link markers, keep text
    .replace(/^#+\s+/gm, '')         // Remove heading markers
    .replace(/^\s*[-*+]\s+/gm, '')   // Remove list markers
    .replace(/^\s*\d+\.\s+/gm, '')   // Remove numbered list markers
    .trim();
};

/**
 * parses JSON content
 * @param {string} content - The content to parse
 * @returns {Object|null} Parsed content or null if invalid
 */
const safeParseJSON = (content) => {
  if (!content) return null;

  try {
    const parsed = JSON.parse(content);
    if (parsed.metadata && parsed.phases) {
      return parsed;
    }
  } catch (error) {
    //  handle JSON parsing errors for non-JSON content
    return null;
  }

  return null;
};

/**
 * Formats AI response content for chat display
 * @param {string} content - The content to format
 * @returns {string} - Formatted content
 */
export const formatAIResponse = (content) => {
  if (!content) return content;

  // Remove markdown code block markers first
  const cleanedContent = removeCodeBlockMarkers(content);

  // Try to parse as roadmap content using safe parser
  const roadmapData = safeParseJSON(cleanedContent);

  if (roadmapData) {
    let formattedText = '';

    // Add summary if available
    if (roadmapData.metadata && roadmapData.metadata.summary) {
      formattedText += `${roadmapData.metadata.summary}\n\n`;
    }

    
    // Add phases
    if (roadmapData.phases && Array.isArray(roadmapData.phases)) {
      formattedText += 'Project Phases:\n\n';
      roadmapData.phases.forEach((phase, index) => {
        formattedText += formatPhaseText(phase, index);
      });
    }

    return formattedText.trim();
  }

  // If not roadmap content, return cleaned content with markdown formatting removed
  return removeMarkdownFormatting(cleanedContent);
};