// mcp-server/tools/getNextTasks.js

export async function getNextTasks(adapter, args) {
  if (!args.project_id) throw new Error('project_id is required');
  const limit = Math.min(args.limit ?? 5, 20);

  const data = await adapter.getProject(args.project_id);
  if (!data) throw new Error(`Project ${args.project_id} not found`);

  let roadmap;
  try {
    roadmap = JSON.parse(data.content);
  } catch {
    throw new Error(`Project ${data.id} has corrupted roadmap data`);
  }
  const results = [];

  const phases = [...(roadmap.phases || [])].sort((a, b) => a.order - b.order);
  for (const phase of phases) {
    if (results.length >= limit) break;
    const milestones = [...(phase.milestones || [])].sort((a, b) => a.order - b.order);
    for (const milestone of milestones) {
      if (results.length >= limit) break;
      const tasks = [...(milestone.tasks || [])].sort((a, b) => a.order - b.order);
      for (const task of tasks) {
        if (results.length >= limit) break;
        if (task.status === 'pending' || task.status === 'in_progress') {
          results.push({
            taskId: task.id,
            title: task.title,
            ...(task.description && { description: task.description }),
            status: task.status,
            ...(task.technology && { technology: task.technology }),
            phaseTitle: phase.title,
            milestoneTitle: milestone.title,
          });
        }
      }
    }
  }

  return results;
}
