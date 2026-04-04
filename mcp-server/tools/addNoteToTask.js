// mcp-server/tools/addNoteToTask.js

/**
 * @param {object} supabase
 * @param {string} userId
 * @param {{ project_id: string, task_id: string, note: string }} args
 */
export async function addNoteToTask(supabase, userId, args) {
  if (!args.note || !args.note.trim()) throw new Error('Note text is required');

  const { data, error } = await supabase
    .from('roadmap')
    .select('id, content')
    .eq('user_id', userId)
    .eq('id', args.project_id)
    .single();

  if (error || !data) throw new Error(`Project ${args.project_id} not found`);

  const roadmap = JSON.parse(data.content);
  let targetTask = null;

  for (const phase of (roadmap.phases || [])) {
    for (const milestone of (phase.milestones || [])) {
      const task = (milestone.tasks || []).find(t => t.id === args.task_id);
      if (task) {
        if (!Array.isArray(task.notes)) task.notes = [];
        task.notes.push({ text: args.note.trim(), createdAt: new Date().toISOString() });
        targetTask = task;
        break;
      }
    }
    if (targetTask) break;
  }

  if (!targetTask) throw new Error(`Task ${args.task_id} not found in project ${args.project_id}`);

  const { error: writeError } = await supabase
    .from('roadmap')
    .update({ content: JSON.stringify(roadmap), updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('id', args.project_id);

  if (writeError) throw new Error(`Failed to save: ${writeError.message}`);

  return targetTask;
}
