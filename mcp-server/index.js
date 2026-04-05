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
import { addTask } from './tools/addTask.js';
import { addMilestone } from './tools/addMilestone.js';
import { addPhase } from './tools/addPhase.js';
import { editTask } from './tools/editTask.js';
import { editMilestone } from './tools/editMilestone.js';
import { editPhase } from './tools/editPhase.js';
import { deleteTask } from './tools/deleteTask.js';
import { deleteMilestone } from './tools/deleteMilestone.js';
import { deletePhase } from './tools/deletePhase.js';
import { createProject } from './tools/createProject.js';

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

server.tool(
  'add_task',
  'Add a new task to a milestone. Use dry_run: true first to preview, then dry_run: false to apply.',
  {
    project_id: z.string().describe('UUID of the project.'),
    phase_id: z.string().describe('ID of the target phase (e.g. "phase-1").'),
    milestone_id: z.string().describe('ID of the target milestone (e.g. "milestone-1").'),
    title: z.string().min(1).describe('Task title.'),
    description: z.string().optional().describe('Optional task description.'),
    technology: z.string().optional().describe('Optional technology tag.'),
    dry_run: z.boolean().describe('true = preview only, false = apply the change.'),
  },
  async (args) => {
    const result = await addTask(supabase, userId, args);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'add_milestone',
  'Add a new milestone to a phase. Use dry_run: true first to preview, then dry_run: false to apply.',
  {
    project_id: z.string().describe('UUID of the project.'),
    phase_id: z.string().describe('ID of the target phase.'),
    title: z.string().min(1).describe('Milestone title.'),
    dry_run: z.boolean().describe('true = preview only, false = apply the change.'),
  },
  async (args) => {
    const result = await addMilestone(supabase, userId, args);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'add_phase',
  'Add a new phase to a project. Use dry_run: true first to preview, then dry_run: false to apply.',
  {
    project_id: z.string().describe('UUID of the project.'),
    title: z.string().min(1).describe('Phase title.'),
    dry_run: z.boolean().describe('true = preview only, false = apply the change.'),
  },
  async (args) => {
    const result = await addPhase(supabase, userId, args);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'edit_task',
  'Edit a task title, description, or technology. Use dry_run: true first to preview. At least one of title/description/technology required.',
  {
    project_id: z.string().describe('UUID of the project.'),
    task_id: z.string().describe('ID of the task (e.g. "task-1").'),
    title: z.string().optional().describe('New task title.'),
    description: z.string().optional().describe('New description.'),
    technology: z.string().optional().describe('New technology tag.'),
    dry_run: z.boolean().describe('true = preview only, false = apply the change.'),
  },
  async (args) => {
    const result = await editTask(supabase, userId, args);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'edit_milestone',
  'Rename a milestone. Use dry_run: true first to preview, then dry_run: false to apply.',
  {
    project_id: z.string().describe('UUID of the project.'),
    milestone_id: z.string().describe('ID of the milestone (e.g. "milestone-1").'),
    title: z.string().min(1).describe('New milestone title.'),
    dry_run: z.boolean().describe('true = preview only, false = apply the change.'),
  },
  async (args) => {
    const result = await editMilestone(supabase, userId, args);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'edit_phase',
  'Rename a phase. Use dry_run: true first to preview, then dry_run: false to apply.',
  {
    project_id: z.string().describe('UUID of the project.'),
    phase_id: z.string().describe('ID of the phase (e.g. "phase-1").'),
    title: z.string().min(1).describe('New phase title.'),
    dry_run: z.boolean().describe('true = preview only, false = apply the change.'),
  },
  async (args) => {
    const result = await editPhase(supabase, userId, args);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'delete_task',
  'Permanently delete a task. Use dry_run: true first to see what will be deleted, then dry_run: false to apply. This is irreversible.',
  {
    project_id: z.string().describe('UUID of the project.'),
    task_id: z.string().describe('ID of the task (e.g. "task-1").'),
    dry_run: z.boolean().describe('true = preview only, false = permanently delete.'),
  },
  async (args) => {
    const result = await deleteTask(supabase, userId, args);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'delete_milestone',
  'Permanently delete a milestone and all its tasks. Use dry_run: true first to see what will be deleted. This is irreversible.',
  {
    project_id: z.string().describe('UUID of the project.'),
    milestone_id: z.string().describe('ID of the milestone (e.g. "milestone-1").'),
    dry_run: z.boolean().describe('true = preview only, false = permanently delete.'),
  },
  async (args) => {
    const result = await deleteMilestone(supabase, userId, args);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'delete_phase',
  'Permanently delete a phase and all its milestones and tasks. Use dry_run: true first to see what will be deleted. This is irreversible.',
  {
    project_id: z.string().describe('UUID of the project.'),
    phase_id: z.string().describe('ID of the phase (e.g. "phase-1").'),
    dry_run: z.boolean().describe('true = preview only, false = permanently delete.'),
  },
  async (args) => {
    const result = await deletePhase(supabase, userId, args);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'create_project',
  'Create a new project from scratch with a full phase/milestone/task structure. Ask clarifying questions first, present the plan in chat, wait for user approval, then call this tool once with the complete object.',
  {
    title: z.string().min(1).describe('Project title.'),
    description: z.string().optional().describe('Short project description.'),
    timeline: z.string().optional().describe('Estimated timeline, e.g. "3 months".'),
    experienceLevel: z.string().optional().describe('Developer experience level, e.g. "Intermediate".'),
    technologies: z.array(z.string()).optional().describe('Technology stack array.'),
    phases: z.array(z.object({
      title: z.string(),
      milestones: z.array(z.object({
        title: z.string(),
        tasks: z.array(z.object({
          title: z.string(),
          description: z.string().optional(),
          technology: z.string().optional(),
        })),
      })),
    })).describe('Full project structure — all phases, milestones, and tasks.'),
  },
  async (args) => {
    const result = await createProject(supabase, userId, args);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
