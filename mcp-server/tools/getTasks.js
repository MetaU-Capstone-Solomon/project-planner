// mcp-server/tools/getTasks.js
//
// Filter tasks by status, phase_id, and/or keyword.
// Returns a flat list of matching tasks with their phase/milestone context.

export async function getTasks(adapter, args) {
  if (!args.project_id) throw new Error('project_id is required');

  const data = await adapter.getProject(args.project_id);
  if (!data) throw new Error(`Project ${args.project_id} not found`);

  let roadmap;
  try {
    roadmap = JSON.parse(data.content);
  } catch {
    throw new Error(`Project ${data.id} has corrupted roadmap data`);
  }

  const { status, phase_id, keyword } = args;
  const limit = Math.min(args.limit ?? 100, 500);
  const kwLower = keyword ? keyword.toLowerCase() : null;

  const results = [];
  const phases = [...(roadmap.phases || [])].sort((a, b) => a.order - b.order);

  outer: for (const phase of phases) {
    if (phase_id && phase.id !== phase_id) continue;

    const milestones = [...(phase.milestones || [])].sort((a, b) => a.order - b.order);
    for (const milestone of milestones) {
      const tasks = [...(milestone.tasks || [])].sort((a, b) => a.order - b.order);
      for (const task of tasks) {
        if (results.length >= limit) break outer;
        if (status && task.status !== status) continue;

        if (kwLower) {
          const haystack = [task.title, task.description ?? '', task.technology ?? '']
            .join(' ')
            .toLowerCase();
          if (!haystack.includes(kwLower)) continue;
        }

        results.push({
          taskId: task.id,
          title: task.title,
          description: task.description ?? '',
          status: task.status,
          technology: task.technology ?? null,
          phaseId: phase.id,
          phaseTitle: phase.title,
          milestoneId: milestone.id,
          milestoneTitle: milestone.title,
          notes: task.notes ?? [],
        });
      }
    }
  }

  return { total: results.length, tasks: results, limit };
}
