// mcp-server/tools/deleteMilestone.js

/**
 * @param {object} supabase
 * @param {string} userId
 * @param {{ project_id: string, milestone_id: string, dry_run: boolean }} args
 */
export async function deleteMilestone(supabase, userId, args) {
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
  let targetPhase = null;

  for (const phase of (roadmap.phases || [])) {
    const ms = (phase.milestones || []).find(m => m.id === args.milestone_id);
    if (ms) { targetMilestone = ms; targetPhase = phase; break; }
  }

  if (!targetMilestone) throw new Error(`Milestone ${args.milestone_id} not found in project ${args.project_id}`);

  const taskCount = (targetMilestone.tasks || []).length;

  if (args.dry_run) {
    return {
      item: { id: targetMilestone.id, title: targetMilestone.title },
      warning: `This will permanently delete 1 milestone and ${taskCount} task${taskCount !== 1 ? 's' : ''}. This cannot be undone.`,
      action: 'delete_milestone',
    };
  }

  targetPhase.milestones = targetPhase.milestones.filter(m => m.id !== args.milestone_id);

  const { error: writeError } = await supabase
    .from('roadmap')
    .update({ content: JSON.stringify(roadmap), updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('id', args.project_id);

  if (writeError) throw new Error(`Failed to save: ${writeError.message}`);

  return { deleted: true, id: args.milestone_id };
}
