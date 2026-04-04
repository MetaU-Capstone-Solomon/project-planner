// mcp-server/tools/getNextTasks.js

/**
 * @param {object} supabase
 * @param {string} userId
 * @param {{ project_id: string, limit?: number }} args
 */
export async function getNextTasks(supabase, userId, args) {
  if (!args.project_id) throw new Error('project_id is required');
  const limit = Math.min(args.limit ?? 5, 20);

  const { data, error } = await supabase
    .from('roadmap')
    .select('id, title, content')
    .eq('user_id', userId)
    .eq('id', args.project_id)
    .single();

  if (error || !data) throw new Error(`Project ${args.project_id} not found`);

  const roadmap = JSON.parse(data.content);
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
            description: task.description ?? '',
            status: task.status,
            technology: task.technology ?? null,
            phaseTitle: phase.title,
            milestoneTitle: milestone.title,
          });
        }
      }
    }
  }

  return results;
}
