// mcp-server/tools/deletePhase.js

/**
 * @param {object} supabase
 * @param {string} userId
 * @param {{ project_id: string, phase_id: string, dry_run: boolean }} args
 */
export async function deletePhase(supabase, userId, args) {
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

  const targetPhase = (roadmap.phases || []).find(p => p.id === args.phase_id);
  if (!targetPhase) throw new Error(`Phase ${args.phase_id} not found in project ${args.project_id}`);

  const milestoneCount = (targetPhase.milestones || []).length;
  const taskCount = (targetPhase.milestones || []).reduce(
    (sum, m) => sum + (m.tasks || []).length, 0
  );

  if (args.dry_run) {
    return {
      item: { id: targetPhase.id, title: targetPhase.title },
      warning: `This will permanently delete 1 phase, ${milestoneCount} milestone${milestoneCount !== 1 ? 's' : ''}, and ${taskCount} task${taskCount !== 1 ? 's' : ''}. This cannot be undone.`,
      action: 'delete_phase',
    };
  }

  roadmap.phases = roadmap.phases.filter(p => p.id !== args.phase_id);

  const { error: writeError } = await supabase
    .from('roadmap')
    .update({ content: JSON.stringify(roadmap), updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('id', args.project_id);

  if (writeError) throw new Error(`Failed to save: ${writeError.message}`);

  return { deleted: true, id: args.phase_id };
}
