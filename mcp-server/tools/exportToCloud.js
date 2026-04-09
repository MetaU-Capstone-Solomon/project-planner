// mcp-server/tools/exportToCloud.js
import { SqliteAdapter } from '../adapters/SqliteAdapter.js';
import { join } from 'path';
import { existsSync } from 'fs';

export async function exportToCloud({ mcp_token, api_url }) {
  const resolvedApiUrl = api_url || process.env.PROPLAN_API_URL || 'https://project-planner-7zw4.onrender.com';

  if (!mcp_token) {
    throw new Error('mcp_token is required. Generate one at app.proplan.dev → Settings → Claude Code Integration.');
  }

  const dbPath = join(process.cwd(), '.project-planner', 'db.sqlite');
  if (!existsSync(dbPath)) {
    return { inserted: 0, updated: 0, skipped: 0, message: 'No local database found. Nothing to sync.' };
  }

  const local = new SqliteAdapter(dbPath);
  const projects = local.getProjectsSyncStatus();

  if (projects.length === 0) {
    return { inserted: 0, updated: 0, skipped: 0, message: 'No local projects found. Create a project first with create_project or scan_repo.' };
  }

  // Determine which projects need syncing
  const toSync = [];
  const stats = { inserted: 0, updated: 0, skipped: 0 };

  for (const project of projects) {
    if (!project.last_synced_at) {
      toSync.push({ ...project, _action: 'insert' });
    } else if (new Date(project.updated_at) > new Date(project.last_synced_at)) {
      toSync.push({ ...project, _action: 'update' });
    } else {
      stats.skipped++;
    }
  }

  if (toSync.length === 0) {
    return {
      inserted: 0,
      updated: 0,
      skipped: stats.skipped,
      dashboardUrl: 'https://project-planner-7zw4.onrender.com/dashboard',
      message: 'All projects are already up to date.',
    };
  }

  // Push to backend
  const res = await fetch(`${resolvedApiUrl}/api/mcp/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${mcp_token}`,
    },
    body: JSON.stringify({
      projects: toSync.map(p => ({
        id: p.id,
        title: p.title,
        content: p.content,
        created_at: p.created_at || p.updated_at,  // use actual created_at, fall back to updated_at if null
        updated_at: p.updated_at,
      })),
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `Sync failed: ${res.status}`);
  }

  const data = await res.json();
  const now = new Date().toISOString();

  // Mark synced projects in local DB
  for (const project of toSync) {
    local.markSynced(project.id, now);
    if (project._action === 'insert') stats.inserted++;
    else stats.updated++;
  }

  return {
    inserted: stats.inserted,
    updated: stats.updated,
    skipped: stats.skipped,
    dashboardUrl: data.dashboardUrl,
    message: data.message,
    nextStep: `Sign in at ${data.dashboardUrl} to view your projects.`,
  };
}
