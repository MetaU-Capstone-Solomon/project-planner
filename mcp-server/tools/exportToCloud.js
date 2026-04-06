// mcp-server/tools/exportToCloud.js
import { createClient } from '@supabase/supabase-js';
import { SqliteAdapter } from '../adapters/SqliteAdapter.js';
import { join } from 'path';
import { existsSync } from 'fs';

export async function exportToCloud(args) {
  const { supabase_url, supabase_service_role_key, mcp_token } = args;

  // Validate credentials and get userId via PAT
  const supabase = createClient(supabase_url, supabase_service_role_key, {
    auth: { persistSession: false }
  });

  const { data: tokenRow, error: tokenError } = await supabase
    .from('mcp_tokens')
    .select('user_id')
    .eq('token', mcp_token)
    .single();

  if (tokenError || !tokenRow) {
    throw new Error('Invalid MCP token. Generate one in Project Planner Settings → Claude Code Integration.');
  }

  const userId = tokenRow.user_id;

  // Open local SQLite DB
  const dbPath = join(process.cwd(), '.project-planner', 'db.sqlite');
  if (!existsSync(dbPath)) {
    return { exported: 0, message: 'No local database found. No projects to export.' };
  }

  const local = new SqliteAdapter(dbPath);
  const projects = local.listProjects();

  if (projects.length === 0) {
    return { exported: 0, message: 'No local projects found to export.' };
  }

  const now = new Date().toISOString();
  const exportedIds = [];

  for (const project of projects) {
    const { data, error } = await supabase
      .from('roadmap')
      .insert({
        user_id: userId,
        title: project.title,
        content: project.content,
        created_at: now,
        updated_at: now,
      })
      .select('id')
      .single();

    if (error || !data) {
      throw new Error(`Failed to export project "${project.title}": ${error?.message ?? 'unknown error'}`);
    }
    exportedIds.push(data.id);
  }

  return {
    exported: exportedIds.length,
    projectIds: exportedIds,
    message: `${exportedIds.length} project(s) exported to cloud successfully. Update your .mcp.json with SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and MCP_TOKEN, then restart to switch to cloud mode.`,
  };
}
