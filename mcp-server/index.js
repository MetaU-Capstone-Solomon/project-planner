// mcp-server/index.js
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { join } from 'path';

import { supabase } from './supabase.js';
import { validatePat } from './auth.js';
import { SupabaseAdapter } from './adapters/SupabaseAdapter.js';
import { SqliteAdapter } from './adapters/SqliteAdapter.js';

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
import { scanRepo } from './tools/scanRepo.js';
import { exportToCloud } from './tools/exportToCloud.js';
import { deleteProject } from './tools/deleteProject.js';
import { renameProject } from './tools/renameProject.js';
import { setProjectGoal } from './tools/setProjectGoal.js';
import { addSessionSummary } from './tools/addSessionSummary.js';
import { getTasks } from './tools/getTasks.js';

// ─── Mode detection ───────────────────────────────────────────────────────────
const { MCP_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
const isCloudMode = !!(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

let adapter;

if (isCloudMode) {
  if (!MCP_TOKEN) {
    console.error('MCP_TOKEN is required in cloud mode. Generate one in Project Planner Settings → Claude Code Integration.');
    process.exit(1);
  }
  const userId = await validatePat(supabase, MCP_TOKEN);
  adapter = new SupabaseAdapter(supabase, userId);
} else {
  const dbPath = join(process.cwd(), '.project-planner', 'db.sqlite');
  adapter = new SqliteAdapter(dbPath);
}

// ─── Server ───────────────────────────────────────────────────────────────────
const server = new McpServer({
  name: 'project-planner',
  version: '1.0.0',
});

server.tool(
  'get_project_status',
  'Get completion status for one or all projects. Pass include_handoff: true to get session resume context (goal, last session, recent tasks) in the same call.',
  {
    project_id: z.string().optional().describe('UUID of the project. Omit to get all projects.'),
    include_handoff: z.boolean().optional().describe('true = include session resume context (projectGoal, lastSession, recentTasks). Requires project_id.'),
    last_n_tasks: z.number().int().min(1).max(20).optional().describe('How many recent tasks to include in handoff (default 5). Only used when include_handoff: true.'),
  },
  async ({ project_id, include_handoff, last_n_tasks }) => {
    const result = await getProjectStatus(adapter, { project_id, include_handoff, last_n_tasks });
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
    const result = await getNextTasks(adapter, { project_id, limit });
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'update_task_status',
  'Update the status of a task. Optionally attach a note in the same operation (max 150 chars).',
  {
    project_id: z.string().describe('UUID of the project.'),
    task_id: z.string().describe('ID of the task (e.g. "task-1").'),
    status: z.enum(['pending', 'in_progress', 'completed']).describe('New status.'),
    note: z.string().max(150).optional().describe('Intent note (in_progress) or outcome note (completed). Max 150 chars.'),
  },
  async ({ project_id, task_id, status, note }) => {
    const result = await updateTaskStatus(adapter, { project_id, task_id, status, note });
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
    const result = await addNoteToTask(adapter, { project_id, task_id, note });
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'get_project_roadmap',
  'Get the roadmap for a project. Use summary_only: true for a lightweight view (titles only, no descriptions or notes).',
  {
    project_id: z.string().describe('UUID of the project.'),
    summary_only: z.boolean().optional().describe('true = titles only, omit descriptions and notes.'),
  },
  async ({ project_id, summary_only }) => {
    const result = await getProjectRoadmap(adapter, { project_id, summary_only });
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
    const result = await addTask(adapter, args);
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
    const result = await addMilestone(adapter, args);
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
    const result = await addPhase(adapter, args);
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
    const result = await editTask(adapter, args);
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
    const result = await editMilestone(adapter, args);
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
    const result = await editPhase(adapter, args);
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
    const result = await deleteTask(adapter, args);
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
    const result = await deleteMilestone(adapter, args);
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
    const result = await deletePhase(adapter, args);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'create_project',
  'Create a new project with a full phase/milestone/task structure.',
  {
    title: z.string().min(1).describe('Project title.'),
    description: z.string().optional().describe('Short project description.'),
    timeline: z.string().optional().describe('Estimated timeline (e.g. "3 months"). For cloud/PM use.'),
    experienceLevel: z.string().optional().describe('Developer experience level. For cloud/PM use.'),
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
    const result = await createProject(adapter, args);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'scan_repo',
  'Scan a repository directory tree and key files. Pass project_id to persist tech stack metadata and enable hash-based cache.',
  {
    path: z.string().optional().describe('Path to scan. Defaults to cwd. Pass a file path to read just that file.'),
    project_id: z.string().optional().describe('UUID of the project to persist tech_metadata into. If hash unchanged since last scan, returns cached metadata instead of re-scanning.'),
  },
  async ({ path, project_id }) => {
    // If project_id given, check for a cached hash first
    if (project_id) {
      const projectData = await adapter.getProject(project_id);
      if (projectData) {
        const roadmap = JSON.parse(projectData.content);
        const cached = roadmap.tech_metadata;

        const scanResult = scanRepo({ path });

        // Cache hit — tree unchanged, return cached metadata
        if (cached && cached.treeHash === scanResult.treeHash) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({ ...scanResult, tech_metadata: cached, cached: true }, null, 2),
            }],
          };
        }

        // Cache miss — extract and persist new tech_metadata
        const sourceAnalysis = scanResult.sourceAnalysis ?? [];
        const languages = [...new Set(sourceAnalysis.map(f => f.language))];
        const importCounts = {};
        for (const f of sourceAnalysis) {
          for (const imp of f.imports) {
            importCounts[imp] = (importCounts[imp] || 0) + 1;
          }
        }
        const topImports = Object.entries(importCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 20)
          .map(([name]) => name);

        const tech_metadata = {
          languages,
          topImports,
          fileCount: sourceAnalysis.length,
          treeHash: scanResult.treeHash,
          fileMap: scanResult.fileMap ?? {},
          scannedAt: new Date().toISOString(),
        };

        roadmap.tech_metadata = tech_metadata;
        adapter.saveProject(project_id, projectData.title, JSON.stringify(roadmap), new Date().toISOString());

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ ...scanResult, tech_metadata, cached: false }, null, 2),
          }],
        };
      }
    }

    const result = scanRepo({ path });
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'export_to_cloud',
  'Migrate all local SQLite projects to your ProPlan cloud account.',
  {
    supabase_url: z.string().url().describe('Your Supabase project URL (from .env or Supabase dashboard).'),
    supabase_service_role_key: z.string().min(1).describe('Your Supabase service role key.'),
    mcp_token: z.string().min(1).describe('Your MCP token from Project Planner Settings → Claude Code Integration.'),
  },
  async (args) => {
    const result = await exportToCloud(args);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'delete_project',
  'Permanently delete a project and all its phases, milestones, and tasks. Use dry_run: true first to see what will be deleted, then dry_run: false to apply. This is irreversible.',
  {
    project_id: z.string().describe('UUID of the project to delete.'),
    dry_run: z.boolean().describe('true = preview only, false = permanently delete.'),
  },
  async (args) => {
    const result = await deleteProject(adapter, args);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'rename_project',
  'Rename a project. Updates the title only — all phases, milestones, and tasks are preserved.',
  {
    project_id: z.string().describe('UUID of the project to rename.'),
    new_title: z.string().min(1).describe('New project title.'),
  },
  async (args) => {
    const result = await renameProject(adapter, args);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'set_project_goal',
  'Set or update the permanent project goal. Returned in every session handoff as the north-star anchor.',
  {
    project_id: z.string().describe('UUID of the project.'),
    goal: z.string().min(1).describe('1-3 sentence project goal. What is being built and what does success look like?'),
  },
  async (args) => {
    const result = await setProjectGoal(adapter, args);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'add_session_summary',
  'Save a session summary (what was done, decisions made, what is next). Capped at 10 entries.',
  {
    project_id: z.string().describe('UUID of the project.'),
    summary: z.string().min(1).describe('3-5 sentence session summary: what was done, decisions made, what is next.'),
  },
  async (args) => {
    const result = await addSessionSummary(adapter, args);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'get_tasks',
  'Filter tasks by status, phase, and/or keyword. Returns a flat list with phase/milestone context.',
  {
    project_id: z.string().describe('UUID of the project.'),
    status: z.enum(['pending', 'in_progress', 'completed']).optional().describe('Filter by task status.'),
    phase_id: z.string().optional().describe('Filter to a specific phase (e.g. "phase-1").'),
    keyword: z.string().optional().describe('Case-insensitive keyword search across title, description, and technology.'),
    limit: z.number().int().min(1).max(500).optional().describe('Max tasks to return (default 100, max 500).'),
  },
  async (args) => {
    const result = await getTasks(adapter, args);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
