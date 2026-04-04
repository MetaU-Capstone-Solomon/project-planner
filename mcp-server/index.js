// mcp-server/index.js
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { supabase } from './supabase.js';
import { validatePat } from './auth.js';
import { getProjectStatus } from './tools/getProjectStatus.js';
import { getNextTasks } from './tools/getNextTasks.js';
import { updateTaskStatus } from './tools/updateTaskStatus.js';
import { addNoteToTask } from './tools/addNoteToTask.js';
import { getProjectRoadmap } from './tools/getProjectRoadmap.js';

const { MCP_TOKEN } = process.env;
if (!MCP_TOKEN) {
  console.error('MCP_TOKEN env var is required. Generate one in Project Planner Settings.');
  process.exit(1);
}

// Validate PAT once on startup — get userId for all subsequent tool calls
const userId = await validatePat(supabase, MCP_TOKEN);

const server = new McpServer({
  name: 'project-planner',
  version: '1.0.0',
});

server.tool(
  'get_project_status',
  'Get completion status for one or all projects. Omit project_id for a summary of all projects.',
  { project_id: z.string().optional().describe('UUID of the project. Omit to get all projects.') },
  async ({ project_id }) => {
    const result = await getProjectStatus(supabase, userId, { project_id });
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'get_next_tasks',
  'Get the next pending or in-progress tasks for a project, ordered by phase and milestone.',
  {
    project_id: z.string().describe('UUID of the project.'),
    limit: z.number().int().min(1).max(20).optional().describe('How many tasks to return (default 5, max 20).'),
  },
  async ({ project_id, limit }) => {
    const result = await getNextTasks(supabase, userId, { project_id, limit });
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'update_task_status',
  'Mark a task as pending, in_progress, or completed.',
  {
    project_id: z.string().describe('UUID of the project.'),
    task_id: z.string().describe('ID of the task (e.g. "task-1").'),
    status: z.enum(['pending', 'in_progress', 'completed']).describe('New status.'),
  },
  async ({ project_id, task_id, status }) => {
    const result = await updateTaskStatus(supabase, userId, { project_id, task_id, status });
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'add_note_to_task',
  'Attach a progress note to a task. Notes are appended and never overwrite existing ones.',
  {
    project_id: z.string().describe('UUID of the project.'),
    task_id: z.string().describe('ID of the task.'),
    note: z.string().min(1).describe('The note text to attach.'),
  },
  async ({ project_id, task_id, note }) => {
    const result = await addNoteToTask(supabase, userId, { project_id, task_id, note });
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'get_project_roadmap',
  'Get the full roadmap for a project — all phases, milestones, and tasks.',
  { project_id: z.string().describe('UUID of the project.') },
  async ({ project_id }) => {
    const result = await getProjectRoadmap(supabase, userId, { project_id });
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
