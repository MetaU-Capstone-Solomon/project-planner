// mcp-server/tools/addSessionSummary.js

const MAX_SESSIONS = 10;

export async function addSessionSummary(adapter, args) {
  if (!args.summary || !args.summary.trim()) {
    throw new Error('summary is required and cannot be empty');
  }

  const data = await adapter.getProject(args.project_id);
  if (!data) throw new Error(`Project ${args.project_id} not found`);

  let roadmap;
  try {
    roadmap = JSON.parse(data.content);
  } catch {
    throw new Error(`Project ${data.id} has corrupted roadmap data`);
  }

  if (!Array.isArray(roadmap.sessions)) roadmap.sessions = [];

  roadmap.sessions.push({
    summary: args.summary.trim(),
    createdAt: new Date().toISOString(),
  });

  // Keep only the most recent MAX_SESSIONS — drop oldest
  if (roadmap.sessions.length > MAX_SESSIONS) {
    roadmap.sessions = roadmap.sessions.slice(-MAX_SESSIONS);
  }

  await adapter.saveProject(args.project_id, data.title, JSON.stringify(roadmap), new Date().toISOString());

  return {
    saved: true,
    totalSessions: roadmap.sessions.length,
    summary: roadmap.sessions[roadmap.sessions.length - 1],
  };
}
