// mcp-server/tools/importFromCloud.js
import { SqliteAdapter } from '../adapters/SqliteAdapter.js';
import { API_URL, DASHBOARD_URL } from '../lib/constants.js';
import { waitForServer } from '../lib/utils.js';
import { join } from 'path';

export async function importFromCloud({ mcp_token, project_id, force = false, api_url, db_path }) {
  const resolvedApiUrl = api_url || process.env.PROPLAN_API_URL || API_URL;

  if (!mcp_token) {
    throw new Error(`mcp_token is required. Get one at ${DASHBOARD_URL} → Settings → Claude Code Integration.`);
  }

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${mcp_token}`,
  };

  // LIST MODE — no project_id, return available cloud projects
  if (!project_id) {
    const res = await fetch(`${resolvedApiUrl}/api/mcp/projects`, { headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(err.error || `Failed to fetch projects: ${res.status}`);
    }
    const projects = await res.json();
    if (projects.length === 0) {
      return {
        projects: [],
        instruction: 'No projects found in the cloud. Create one first at ' + DASHBOARD_URL,
      };
    }
    return {
      projects: projects.map(p => ({ id: p.id, title: p.title, updated_at: p.updated_at })),
      instruction: 'Call import_from_cloud again with the project_id of the project you want to import.',
    };
  }

  // IMPORT MODE — fetch specific project and save to local SQLite
  const resolvedDbPath = db_path || join(process.cwd(), '.project-planner', 'db.sqlite');
  const local = new SqliteAdapter(resolvedDbPath);

  // Check if already exists locally
  const existing = local.getProject(project_id);
  if (existing && !force) {
    return {
      already_exists: true,
      project: { id: existing.id, title: existing.title },
      message: `"${existing.title}" is already in your local database. Pass force: true to overwrite with the cloud version.`,
    };
  }

  // Wake server then fetch
  await waitForServer(resolvedApiUrl);

  const res = await fetch(`${resolvedApiUrl}/api/mcp/projects/${project_id}`, { headers });
  if (!res.ok) {
    if (res.status === 404) throw new Error(`Project ${project_id} not found in the cloud.`);
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `Failed to fetch project: ${res.status}`);
  }

  const project = await res.json();
  const now = new Date().toISOString();

  if (existing && force) {
    // Overwrite local with cloud version
    await local.saveProject(project.id, project.title, project.content, now);
    local.markSynced(project.id, now);
  } else {
    local.insertProjectWithId(project.id, project.title, project.content, now);
  }
  local.setConfig('mcp_token', mcp_token);

  return {
    imported: true,
    updated: existing ? true : false,
    project: { id: project.id, title: project.title },
    message: existing
      ? `"${project.title}" updated from cloud. Local copy is now in sync.`
      : `"${project.title}" imported successfully. Claude Code will now track this project locally.`,
    nextStep: 'Your session summaries will auto-sync to the dashboard going forward.',
  };
}
