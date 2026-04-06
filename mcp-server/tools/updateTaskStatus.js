// mcp-server/tools/updateTaskStatus.js

const VALID_STATUSES = ['pending', 'in_progress', 'completed'];

export async function updateTaskStatus(adapter, args) {
  if (!VALID_STATUSES.includes(args.status)) {
    throw new Error(`Invalid status "${args.status}". Must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  const data = await adapter.getProject(args.project_id);
  if (!data) throw new Error(`Project ${args.project_id} not found`);

  let roadmap;
  try {
    roadmap = JSON.parse(data.content);
  } catch {
    throw new Error(`Project ${data.id} has corrupted roadmap data`);
  }
  let targetTask = null;

  for (const phase of (roadmap.phases || [])) {
    for (const milestone of (phase.milestones || [])) {
      const task = (milestone.tasks || []).find(t => t.id === args.task_id);
      if (task) {
        task.status = args.status;
        targetTask = task;
        break;
      }
    }
    if (targetTask) break;
  }

  if (!targetTask) throw new Error(`Task ${args.task_id} not found in project ${args.project_id}`);

  await adapter.saveProject(args.project_id, data.title, JSON.stringify(roadmap), new Date().toISOString());

  return targetTask;
}
