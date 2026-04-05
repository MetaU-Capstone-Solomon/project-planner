// mcp-server/tools/addMilestone.js

/**
 * @param {object} supabase
 * @param {string} userId
 * @param {{ project_id: string, phase_id: string, title: string, dry_run: boolean }} args
 */
export async function addMilestone(supabase, userId, args) {
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

  if (args.dry_run) {
    return {
      preview: { id: '(will be generated)', title: args.title, tasks: [] },
      target: `phase '${phase.title}'`,
      action: 'add_milestone',
    };
  }

  const milestones = phase.milestones || [];
  const maxOrder = milestones.reduce((max, m) => Math.max(max, m.order || 0), 0);
  const newMilestone = {
    id: `milestone-${Date.now()}`,
    title: args.title,
    order: maxOrder + 1,
    tasks: [],
  };
  phase.milestones = [...milestones, newMilestone];

  const { error: writeError } = await supabase
    .from('roadmap')
    .update({ content: JSON.stringify(roadmap), updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('id', args.project_id);

  if (writeError) throw new Error(`Failed to save: ${writeError.message}`);

  return newMilestone;
}
