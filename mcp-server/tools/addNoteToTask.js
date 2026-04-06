// mcp-server/tools/addNoteToTask.js

export async function addNoteToTask(adapter, args) {
  if (!args.note || !args.note.trim()) throw new Error('Note text is required');

  const data = await adapter.getProject(args.project_id);
  if (!data) throw new Error(`Project ${args.project_id} not found`);

  let roadmap;
  try {
    roadmap = JSON.parse(data.content);
  } catch {
    throw new Error(`Project ${data.id} has corrupted roadmap data`);
  }
  let targetTask = null;

  for (const phase of (roadmap.phases || [])) {
    for (const milestone of (phase.milestones || [])) {
      const task = (milestone.tasks || []).find(t => t.id === args.task_id);
      if (task) {
        if (!Array.isArray(task.notes)) task.notes = [];
        task.notes.push({ text: args.note.trim(), createdAt: new Date().toISOString() });
        targetTask = task;
        break;
      }
    }
    if (targetTask) break;
  }

  if (!targetTask) throw new Error(`Task ${args.task_id} not found in project ${args.project_id}`);

  await adapter.saveProject(args.project_id, data.title, JSON.stringify(roadmap), new Date().toISOString());

  return targetTask;
}
