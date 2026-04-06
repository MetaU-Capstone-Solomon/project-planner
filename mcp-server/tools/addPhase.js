// mcp-server/tools/addPhase.js

export async function addPhase(adapter, args) {
  const data = await adapter.getProject(args.project_id);
  if (!data) throw new Error(`Project ${args.project_id} not found`);

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

  await adapter.saveProject(args.project_id, data.title, JSON.stringify(roadmap), new Date().toISOString());

  return newPhase;
}
