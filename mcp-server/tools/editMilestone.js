// mcp-server/tools/editMilestone.js

/**
 * @param {object} supabase
 * @param {string} userId
 * @param {{ project_id: string, milestone_id: string, title: string, dry_run: boolean }} args
 */
export async function editMilestone(supabase, userId, args) {
  if (args.title === undefined) {
    throw new Error('Provide at least one field to update: title');
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

  let targetMilestone = null;
  for (const phase of (roadmap.phases || [])) {
    const ms = (phase.milestones || []).find(m => m.id === args.milestone_id);
    if (ms) { targetMilestone = ms; break; }
  }

  if (!targetMilestone) throw new Error(`Milestone ${args.milestone_id} not found in project ${args.project_id}`);

  if (args.dry_run) {
    return {
      before: { title: targetMilestone.title },
      after: { title: args.title },
      action: 'edit_milestone',
    };
  }

  targetMilestone.title = args.title;

  const { error: writeError } = await supabase
    .from('roadmap')
    .update({ content: JSON.stringify(roadmap), updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('id', args.project_id);

  if (writeError) throw new Error(`Failed to save: ${writeError.message}`);

  return targetMilestone;
}
