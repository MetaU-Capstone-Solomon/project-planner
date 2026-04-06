// mcp-server/tools/deletePhase.js

export async function deletePhase(adapter, args) {
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

  await adapter.saveProject(args.project_id, data.title, JSON.stringify(roadmap), new Date().toISOString());

  return { deleted: true, id: args.phase_id };
}
