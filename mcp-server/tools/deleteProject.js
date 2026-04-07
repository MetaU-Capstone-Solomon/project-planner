// mcp-server/tools/deleteProject.js

export async function deleteProject(adapter, args) {
  const data = await adapter.getProject(args.project_id);
  if (!data) throw new Error(`Project ${args.project_id} not found`);

  let taskCount = 0;
  let phaseCount = 0;
  let milestoneCount = 0;

  try {
    const roadmap = JSON.parse(data.content);
    phaseCount = (roadmap.phases || []).length;
    for (const phase of (roadmap.phases || [])) {
      milestoneCount += (phase.milestones || []).length;
      for (const milestone of (phase.milestones || [])) {
        taskCount += (milestone.tasks || []).length;
      }
    }
  } catch {
    // corrupted content — still allow deletion
  }

  if (args.dry_run) {
    return {
      item: { id: data.id, title: data.title },
      warning: `This will permanently delete the project "${data.title}" including ${phaseCount} phase${phaseCount !== 1 ? 's' : ''}, ${milestoneCount} milestone${milestoneCount !== 1 ? 's' : ''}, and ${taskCount} task${taskCount !== 1 ? 's' : ''}. This cannot be undone.`,
      action: 'delete_project',
    };
  }

  await adapter.deleteProject(args.project_id);

  return { deleted: true, id: args.project_id, title: data.title };
}
