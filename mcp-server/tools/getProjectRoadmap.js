// mcp-server/tools/getProjectRoadmap.js

/**
 * @param {object} supabase
 * @param {string} userId
 * @param {{ project_id: string }} args
 */
export async function getProjectRoadmap(supabase, userId, args) {
  const { data, error } = await supabase
    .from('roadmap')
    .select('id, title, content')
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
  return roadmap;
}
