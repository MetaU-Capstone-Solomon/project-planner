// mcp-server/tools/addPhase.js

/**
 * @param {object} supabase
 * @param {string} userId
 * @param {{ project_id: string, title: string, dry_run: boolean }} args
 */
export async function addPhase(supabase, userId, args) {
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

  if (args.dry_run) {
    return {
      preview: { id: '(will be generated)', title: args.title, milestones: [] },
      action: 'add_phase',
    };
  }

  const phases = roadmap.phases || [];
  const maxOrder = phases.reduce((max, p) => Math.max(max, p.order || 0), 0);
  const newPhase = {
    id: `phase-${Date.now()}`,
    title: args.title,
    order: maxOrder + 1,
    milestones: [],
  };
  roadmap.phases = [...phases, newPhase];

  const { error: writeError } = await supabase
    .from('roadmap')
    .update({ content: JSON.stringify(roadmap), updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('id', args.project_id);

  if (writeError) throw new Error(`Failed to save: ${writeError.message}`);

  return newPhase;
}
