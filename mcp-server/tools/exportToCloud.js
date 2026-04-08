// mcp-server/tools/exportToCloud.js
import { createClient } from '@supabase/supabase-js';
import { SqliteAdapter } from '../adapters/SqliteAdapter.js';
import { validatePat } from '../auth.js';
import { syncProjects } from './syncProjects.js';
import { join } from 'path';
import { existsSync } from 'fs';

export async function exportToCloud(args) {
  const {
    supabase_url,
    supabase_service_role_key,
    mcp_token,
    delete_removed = false,
  } = args;

  // Validate credentials — fail fast before any DB operations
  const supabase = createClient(supabase_url, supabase_service_role_key, {
    auth: { persistSession: false },
  });
  const userId = await validatePat(supabase, mcp_token);

  // Check local DB
  const dbPath = join(process.cwd(), '.project-planner', 'db.sqlite');
  if (!existsSync(dbPath)) {
    return {
      inserted: 0,
      updated: 0,
      skipped: 0,
      deleted: 0,
      failed: [],
      message: 'No local database found. No projects to export.',
    };
  }

  const local = new SqliteAdapter(dbPath);
  const result = await syncProjects(local, supabase, userId, { delete_removed });

  const parts = [
    `${result.inserted} inserted`,
    `${result.updated} updated`,
    `${result.skipped} skipped`,
    result.deleted > 0 ? `${result.deleted} deleted` : null,
    result.failed.length > 0 ? `${result.failed.length} failed` : null,
  ].filter(Boolean);

  return {
    ...result,
    message: `Sync complete: ${parts.join(', ')}.`,
    warning:
      'Your local SQLite file is no longer in sync with the cloud. Update your .mcp.json with SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and MCP_TOKEN, then restart the MCP server. The web dashboard (app.proplan.dev) becomes your primary visualizer — do not continue using local mode for this project.',
  };
}
