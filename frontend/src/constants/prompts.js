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

export const ROADMAP_GENERATION_PROMPT = `
Generate a structured JSON roadmap for [PROJECT_TITLE].

PROJECT DETAILS:
- Title: [PROJECT_TITLE]
- Description: [PROJECT_DESCRIPTION]
- Timeline: [TIMELINE]
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
       "timeline": "[TIMELINE]",
       "experienceLevel": "[EXPERIENCE_LEVEL]",
       "technologies": "[TECHNOLOGIES]",
       "scope": "[PROJECT_SCOPE]",
       "version": "1.0"
     },
     "summary": "Brief 2-3 sentence summary of the project scope and timeline",
     "phases": [
       {
         "id": "phase-1",
         "title": "Phase Title",
         "timeline": "Appropriate timeline format (days/weeks/months based on project duration)",
         "order": 1,
         "milestones": [
           {
             "id": "milestone-1-1",
             "title": "Milestone Title",
             "timeline": "Specific timeline within phase",
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
                 "status": "pending",
                 "estimatedHours": "Realistic hours based on task complexity and experience level"
               }
             ]
           }
         ]
       }
     ]
   }

3. Adapt complexity based on experience level:
   - Beginner:simpler tech stack, longer timeline, higher hour estimates
   - Intermediate: moderate hour estimates
   - Advanced: Advanced patterns, optimization strategies
   - Expert: Enterprise patterns, advanced optimization

4. Ensure valid JSON format with proper escaping
5. Create appropriate number of phases based on project complexity (typically 3-6 phases)
6. Include realistic number of milestones per phase (typically 2-5 milestones)
7. Include sufficient tasks per milestone (typically 3-8 tasks)
8. Use timeline format appropriate to project duration:
   - Short projects (1-2 weeks): Use days (Day 1, Day 2, etc.)
   - Medium projects (1-3 months): Use weeks (Week 1, Week 2, etc.)
   - Long projects (3+ months): Use months or quarters
10. Assign proper order numbers (1, 2, 3, etc.) for phases, milestones, and tasks
11. Include relevant technologies and learning resources in the resources array with real URLs
12. Write detailed task descriptions that explain step-by-step what needs to be done, including specific actions, tools, and expected outcomes. Each description should be comprehensive enough for someone to follow and complete the task.

- ONLY respond to roadmap-related questions (timeline, tech stack, scope, milestones, tasks)
- If off-topic, respond: "I can only help you modify your project roadmap. Please tell me what specific aspect you'd like to change: timeline, tech stack, scope, milestones, or tasks."
`;

export const ROADMAP_MODIFICATION_PROMPT = `You are helping the user modify their project roadmap.

User request: [USER_MESSAGE]

CRITICAL INSTRUCTIONS:
1. DO NOT ask questions. Just make the requested modifications directly.
2. Return ONLY valid JSON format - no markdown formatting, or markdown wrapping, no explanations, no questions.
3. Modify the existing roadmap structure according to the user's request.
4. Keep the same JSON structure but update the relevant parts.
5. If the request is unclear but related to the roadmap, make reasonable assumptions and proceed.

${ROADMAP_CONSTRAINTS}

RESPONSE FORMAT: Return ONLY the modified JSON roadmap with no additional text, markdown, or formatting.`;
