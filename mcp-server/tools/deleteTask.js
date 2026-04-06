// mcp-server/tools/deleteTask.js

export async function deleteTask(adapter, args) {
  const data = await adapter.getProject(args.project_id);
  if (!data) throw new Error(`Project ${args.project_id} not found`);

  let roadmap;
  try {
    roadmap = JSON.parse(data.content);
  } catch {
    throw new Error(`Project ${data.id} has corrupted roadmap data`);
  }

  let targetTask = null;
  let targetMilestone = null;

  for (const phase of (roadmap.phases || [])) {
    for (const milestone of (phase.milestones || [])) {
      const task = (milestone.tasks || []).find(t => t.id === args.task_id);
      if (task) { targetTask = task; targetMilestone = milestone; break; }
    }
    if (targetTask) break;
  }

  if (!targetTask) throw new Error(`Task ${args.task_id} not found in project ${args.project_id}`);

  if (args.dry_run) {
    return {
      item: { id: targetTask.id, title: targetTask.title, status: targetTask.status },
      warning: 'This will permanently delete 1 task. This cannot be undone.',
      action: 'delete_task',
    };
  }

  targetMilestone.tasks = targetMilestone.tasks.filter(t => t.id !== args.task_id);

  await adapter.saveProject(args.project_id, data.title, JSON.stringify(roadmap), new Date().toISOString());

  return { deleted: true, id: args.task_id };
}
