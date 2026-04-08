// mcp-server/tools/setProjectGoal.js

export async function setProjectGoal(adapter, args) {
  if (!args.goal || !args.goal.trim()) {
    throw new Error('goal is required and cannot be empty');
  }

  const data = await adapter.getProject(args.project_id);
  if (!data) throw new Error(`Project ${args.project_id} not found`);

  let roadmap;
  try {
    roadmap = JSON.parse(data.content);
  } catch {
    throw new Error(`Project ${data.id} has corrupted roadmap data`);
  }

  const oldGoal = roadmap.projectGoal || null;
  roadmap.projectGoal = args.goal.trim();

  await adapter.saveProject(args.project_id, data.title, JSON.stringify(roadmap), new Date().toISOString());

  return { old_goal: oldGoal, new_goal: roadmap.projectGoal };
}
