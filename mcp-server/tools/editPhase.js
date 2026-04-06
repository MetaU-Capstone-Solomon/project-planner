// mcp-server/tools/editPhase.js

export async function editPhase(adapter, args) {
  if (args.title === undefined) {
    throw new Error('Provide at least one field to update: title');
  }

  const data = await adapter.getProject(args.project_id);
  if (!data) throw new Error(`Project ${args.project_id} not found`);

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

  await adapter.saveProject(args.project_id, data.title, JSON.stringify(roadmap), new Date().toISOString());

  return targetPhase;
}
