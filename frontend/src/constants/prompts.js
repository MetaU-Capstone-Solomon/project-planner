/**
 * AI Prompt Constants
 * 
 * Centralized prompt management for consistent AI interactions
 * and easy maintenance across the application
 */

export const PROMPT_VARIABLES = {
  PROJECT_TITLE: '[PROJECT_TITLE]',
  PROJECT_DESCRIPTION: '[PROJECT_DESCRIPTION]',
  TIMELINE: '[TIMELINE]',
  EXPERIENCE_LEVEL: '[EXPERIENCE_LEVEL]',
  TECHNOLOGIES: '[TECHNOLOGIES]',
  PROJECT_SCOPE: '[PROJECT_SCOPE]'
};

export const ROADMAP_CONSTRAINTS = `
- ONLY respond to roadmap-related questions (timeline, tech stack, scope, milestones, tasks)
- If off-topic, respond: "I can only help you modify your project roadmap. Please tell me what specific aspect you'd like to change: timeline, tech stack, scope, milestones, or tasks."
`;

export const ROADMAP_GENERATION_PROMPT = `Generate a detailed, actionable technical roadmap for [PROJECT_TITLE].

PROJECT DETAILS:
- Title: [PROJECT_TITLE]
- Description: [PROJECT_DESCRIPTION]
- Timeline: [TIMELINE]
- Experience Level: [EXPERIENCE_LEVEL]
- Technologies: [TECHNOLOGIES]
- Scope: [PROJECT_SCOPE]

INSTRUCTIONS:
1. Use the provided project information. DO NOT ask for project details or repeat them in response.
2. Create a structured roadmap with phases, milestones, and tasks.
3. Structure response as:
   - Start with: "Roadmap:[PROJECT_TITLE]"
   - Add a brief executive summary (2-3 sentences) explaining the project scope and timeline
   - Use phase headings (e.g., "Phase 1: Backend Development")
   - Use numbered milestones and tasks
   - Include technology recommendations and learning resources for each task:
     • Resources: [resource name](URL) and [additional resource name](URL)
4. Adapt complexity based on experience level:
   - Beginner: Detailed explanations, simpler tech stack, longer timeline
   - Intermediate: Balanced approach, industry best practices
   - Advanced: Advanced patterns, optimization strategies, shorter timeline
   - Expert: Enterprise patterns, advanced optimization, shortest timeline
5. End with: "Happy coding! 🚀"
${ROADMAP_CONSTRAINTS}`;

export const ROADMAP_MODIFICATION_PROMPT = `You are helping the user modify their project roadmap.

User request: [USER_MESSAGE]

${ROADMAP_CONSTRAINTS}`; 