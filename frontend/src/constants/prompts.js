/**
 * AI Prompt Constants
 *
 * Centralized prompt management for consistent AI interactions
 * and easy maintenance across the application
 */

export const PROMPT_VARIABLES = {
  PROJECT_TITLE: '[PROJECT_TITLE]',
  PROJECT_DESCRIPTION: '[PROJECT_DESCRIPTION]',
  EXPERIENCE_LEVEL: '[EXPERIENCE_LEVEL]',
  TECHNOLOGIES: '[TECHNOLOGIES]',
  PROJECT_SCOPE: '[PROJECT_SCOPE]',
};

export const ROADMAP_CONSTRAINTS = `
- ONLY respond to roadmap-related questions (tech stack, scope, milestones, tasks)
- If off-topic, respond: "I can only help you modify your project roadmap. Please tell me what specific aspect you'd like to change: tech stack, scope, milestones, or tasks."
`;

export const ROADMAP_GENERATION_PROMPT = `
Generate a structured JSON roadmap for [PROJECT_TITLE].

PROJECT DETAILS:
- Title: [PROJECT_TITLE]
- Description: [PROJECT_DESCRIPTION]
- Experience Level: [EXPERIENCE_LEVEL]
- Technologies: [TECHNOLOGIES]
- Scope: [PROJECT_SCOPE]

INSTRUCTIONS:
1. Use the provided project information. DO NOT ask for project details or repeat them in response.
2. Generate a valid JSON object with the following structure:
   {
     "metadata": {
       "title": "[PROJECT_TITLE]",
       "description": "[PROJECT_DESCRIPTION]",
       "experienceLevel": "[EXPERIENCE_LEVEL]",
       "technologies": "[TECHNOLOGIES]",
       "scope": "[PROJECT_SCOPE]",
       "version": "1.0"
     },
     "summary": "Brief 2-3 sentence summary of the project scope",
     "phases": [
       {
         "id": "phase-1",
         "title": "Phase Title",
         "order": 1,
         "milestones": [
           {
             "id": "milestone-1-1",
             "title": "Milestone Title",
             "order": 1,
             "tasks": [
               {
                 "id": "task-1-1-1",
                 "title": "Task Title",
                 "description": "Detailed task description",
                 "resources": [
                   {
                     "name": "Technology or learning resource name",
                     "url": "https://actual-resource-url.com"
                   }
                 ],
                 "status": "pending"
               }
             ]
           }
         ]
       }
     ]
   }

3. Adapt complexity based on experience level:
   - Beginner: simpler tech stack, more granular steps
   - Intermediate: moderate task complexity
   - Advanced: Advanced patterns, optimization strategies
   - Expert: Enterprise patterns, advanced optimization

4. Ensure valid JSON format with proper escaping
5. Create appropriate number of phases based on project complexity (typically 3-6 phases)
6. Include realistic number of milestones per phase (typically 2-5 milestones)
7. Include sufficient tasks per milestone (typically 3-8 tasks)
8. Assign proper order numbers (1, 2, 3, etc.) for phases, milestones, and tasks
11. Include relevant technologies and learning resources in the resources array with real URLs
12. Write detailed task descriptions that explain step-by-step what needs to be done, including specific actions, tools, and expected outcomes. Each description should be comprehensive enough for someone to follow and complete the task.

- ONLY respond to roadmap-related questions (tech stack, scope, milestones, tasks)
- If off-topic, respond: "I can only help you modify your project roadmap. Please tell me what specific aspect you'd like to change: tech stack, scope, milestones, or tasks."
`;

export const ROADMAP_MODIFICATION_PROMPT = `You are helping the user modify their project roadmap.

User request: [USER_MESSAGE]

INSTRUCTIONS:
1. Modify the current roadmap according to the user's request
2. ALWAYS respond with valid JSON using the EXACT structure below
3. Maintain all existing IDs, order numbers, and structure
4. Only modify the specific aspects requested by the user
5. Generate new unique IDs for any additions (phases, milestones, tasks)
6. Keep the original summary unless specifically asked to change it

REQUIRED JSON STRUCTURE:
{
  "metadata": {
    "title": "Project Title",
    "description": "Project Description",
    "experienceLevel": "Experience Level",
    "technologies": "Technologies",
    "scope": "Project Scope",
    "version": "1.0"
  },
  "summary": "Brief 2-3 sentence summary",
  "phases": [
    {
      "id": "phase-1",
      "title": "Phase Title",
      "order": 1,
      "milestones": [
        {
          "id": "milestone-1-1",
          "title": "Milestone Title",
          "order": 1,
          "tasks": [
            {
              "id": "task-1-1-1",
              "title": "Task Title",
              "description": "Task Description",
              "resources": [
                {
                  "name": "Resource Name",
                  "url": "https://resource-url.com"
                }
              ],
              "status": "pending"
            }
          ]
        }
      ]
    }
  ]
}

IMPORTANT: If the user asks something NOT related to roadmap modifications, respond with: "I can only help you modify your project roadmap. Please tell me what specific aspect you'd like to change: tech stack, scope, milestones, or tasks."

CRITICAL INSTRUCTIONS:
1. DO NOT ask questions. Just make the requested modifications directly.
2. Return ONLY valid JSON format - no markdown formatting, or markdown wrapping, no explanations, no questions.
3. Modify the existing roadmap structure according to the user's request.
4. Keep the same JSON structure but update the relevant parts.
5. If the request is unclear but related to the roadmap, make reasonable assumptions and proceed.

${ROADMAP_CONSTRAINTS}

RESPONSE FORMAT: Return ONLY the modified JSON roadmap with no additional text, markdown, or formatting.`;
