// mcp-server/tools/addMilestone.js

export async function addMilestone(adapter, args) {
  const data = await adapter.getProject(args.project_id);
  if (!data) throw new Error(`Project ${args.project_id} not found`);

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

  await adapter.saveProject(args.project_id, data.title, JSON.stringify(roadmap), new Date().toISOString());

  return newMilestone;
}
