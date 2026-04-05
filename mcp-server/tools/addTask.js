// mcp-server/tools/addTask.js

/**
 * @param {object} supabase
 * @param {string} userId
 * @param {{ project_id: string, phase_id: string, milestone_id: string, title: string, description?: string, technology?: string, dry_run: boolean }} args
 */
export async function addTask(supabase, userId, args) {
  const { data, error } = await supabase
    .from('roadmap')
    .select('id, content')
    .eq('user_id', userId)
    .eq('id', args.project_id)
    .single();

  if (error || !data) throw new Error(`Project ${args.project_id} not found`);

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
    ...(args.description && { description: args.description }),
    ...(args.technology && { technology: args.technology }),
  };
  milestone.tasks = [...tasks, newTask];

  const { error: writeError } = await supabase
    .from('roadmap')
    .update({ content: JSON.stringify(roadmap), updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('id', args.project_id);

  if (writeError) throw new Error(`Failed to save: ${writeError.message}`);

  return newTask;
}
