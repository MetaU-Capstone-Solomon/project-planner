// mcp-server/tools/editTask.js

/**
 * @param {object} supabase
 * @param {string} userId
 * @param {{ project_id: string, task_id: string, title?: string, description?: string, technology?: string, dry_run: boolean }} args
 */
export async function editTask(supabase, userId, args) {
  const hasFields = args.title !== undefined || args.description !== undefined || args.technology !== undefined;
  if (!hasFields) {
    throw new Error('Provide at least one field to update: title, description, technology');
  }

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

  let targetTask = null;
  for (const phase of (roadmap.phases || [])) {
    for (const milestone of (phase.milestones || [])) {
      const task = (milestone.tasks || []).find(t => t.id === args.task_id);
      if (task) { targetTask = task; break; }
    }
    if (targetTask) break;
  }

  if (!targetTask) throw new Error(`Task ${args.task_id} not found in project ${args.project_id}`);

  if (args.dry_run) {
    return {
      before: { title: targetTask.title, description: targetTask.description, technology: targetTask.technology },
      after: {
        title: args.title !== undefined ? args.title : targetTask.title,
        description: args.description !== undefined ? args.description : targetTask.description,
        technology: args.technology !== undefined ? args.technology : targetTask.technology,
      },
      action: 'edit_task',
    };
  }

  if (args.title !== undefined) targetTask.title = args.title;
  if (args.description !== undefined) targetTask.description = args.description;
  if (args.technology !== undefined) targetTask.technology = args.technology;

  const { error: writeError } = await supabase
    .from('roadmap')
    .update({ content: JSON.stringify(roadmap), updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('id', args.project_id);

  if (writeError) throw new Error(`Failed to save: ${writeError.message}`);

  return targetTask;
}
