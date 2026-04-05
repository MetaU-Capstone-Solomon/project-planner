// mcp-server/tools/editPhase.js

/**
 * @param {object} supabase
 * @param {string} userId
 * @param {{ project_id: string, phase_id: string, title: string, dry_run: boolean }} args
 */
export async function editPhase(supabase, userId, args) {
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

  const targetPhase = (roadmap.phases || []).find(p => p.id === args.phase_id);
  if (!targetPhase) throw new Error(`Phase ${args.phase_id} not found in project ${args.project_id}`);

  if (args.dry_run) {
    return {
      before: { title: targetPhase.title },
      after: { title: args.title },
      action: 'edit_phase',
    };
  }

  targetPhase.title = args.title;

  const { error: writeError } = await supabase
    .from('roadmap')
    .update({ content: JSON.stringify(roadmap), updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('id', args.project_id);

  if (writeError) throw new Error(`Failed to save: ${writeError.message}`);

  return targetPhase;
}
