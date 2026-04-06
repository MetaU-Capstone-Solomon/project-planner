// mcp-server/tools/editMilestone.js

export async function editMilestone(adapter, args) {
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

  let targetMilestone = null;
  for (const phase of (roadmap.phases || [])) {
    const ms = (phase.milestones || []).find(m => m.id === args.milestone_id);
    if (ms) { targetMilestone = ms; break; }
  }

  if (!targetMilestone) throw new Error(`Milestone ${args.milestone_id} not found in project ${args.project_id}`);

  if (args.dry_run) {
    return {
      before: { title: targetMilestone.title },
      after: { title: args.title },
      action: 'edit_milestone',
    };
  }

  targetMilestone.title = args.title;

  await adapter.saveProject(args.project_id, data.title, JSON.stringify(roadmap), new Date().toISOString());

  return targetMilestone;
}
