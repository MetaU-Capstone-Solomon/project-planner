// mcp-server/tools/addTask.js

const DESC_MAX = 300;
const cap = s => s ? s.slice(0, DESC_MAX) : s;

export async function addTask(adapter, args) {
  const data = await adapter.getProject(args.project_id);
  if (!data) throw new Error(`Project ${args.project_id} not found`);

  let roadmap;
  try {
    roadmap = JSON.parse(data.content);
  } catch {
    throw new Error(`Project ${data.id} has corrupted roadmap data`);
  }

  const phase = (roadmap.phases || []).find(p => p.id === args.phase_id);
  if (!phase) throw new Error(`Phase ${args.phase_id} not found in project ${args.project_id}`);

  const milestone = (phase.milestones || []).find(m => m.id === args.milestone_id);
  if (!milestone) throw new Error(`Milestone ${args.milestone_id} not found in project ${args.project_id}`);

  if (args.dry_run) {
    return {
      preview: {
        id: '(will be generated)',
        title: args.title,
        status: 'pending',
        ...(args.description && { description: args.description }),
        ...(args.technology && { technology: args.technology }),
      },
      target: `milestone '${milestone.title}' in phase '${phase.title}'`,
      action: 'add_task',
    };
  }

  const tasks = milestone.tasks || [];
  const maxOrder = tasks.reduce((max, t) => Math.max(max, t.order || 0), 0);
  const newTask = {
    id: `task-${Date.now()}`,
    title: args.title,
    status: 'pending',
    order: maxOrder + 1,
    ...(args.description && { description: cap(args.description) }),
    ...(args.technology && { technology: args.technology }),
  };
  milestone.tasks = [...tasks, newTask];

  await adapter.saveProject(args.project_id, data.title, JSON.stringify(roadmap), new Date().toISOString());

  return newTask;
}
