// mcp-server/tools/syncProjects.js

/**
 * Core incremental sync algorithm, extracted for testability.
 *
 * @param {import('../adapters/SqliteAdapter.js').SqliteAdapter} adapter
 * @param {object} supabase - Supabase client
 * @param {string} userId
 * @param {{ delete_removed?: boolean }} opts
 * @returns {Promise<{ inserted: number, updated: number, skipped: number, deleted: number, failed: Array<{title: string, error: string}>, warning?: string }>}
 */
export async function syncProjects(adapter, supabase, userId, opts = {}) {
  const { delete_removed = false } = opts;

  adapter._applyMigrations();

  const projects = adapter.getProjectsSyncStatus();
  const now = new Date().toISOString();

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  let deleted = 0;
  const failed = [];

  for (const project of projects) {
    if (project.last_synced_at === null) {
      // Never synced → INSERT with local UUID as Supabase row id
      const { error } = await supabase
        .from('roadmap')
        .insert({
          id: project.id,
          user_id: userId,
          title: project.title,
          content: project.content,
          created_at: now,
          updated_at: now,
        })
        .select('id')
        .single();

      if (error) {
        failed.push({ title: project.title, error: error.message });
      } else {
        adapter.markSynced(project.id, now);
        inserted++;
      }
    } else if (project.updated_at > project.last_synced_at) {
      // Changed since last sync → UPDATE
      const { error } = await supabase
        .from('roadmap')
        .update({ title: project.title, content: project.content, updated_at: now })
        .eq('id', project.id)
        .eq('user_id', userId);

      if (error) {
        failed.push({ title: project.title, error: error.message });
      } else {
        adapter.markSynced(project.id, now);
        updated++;
      }
    } else {
      skipped++;
    }
  }

  if (delete_removed) {
    try {
      const localIds = new Set(projects.map(p => p.id));
      const { data: cloudRows, error: fetchErr } = await supabase
        .from('roadmap')
        .select('id')
        .eq('user_id', userId);

      if (fetchErr) throw fetchErr;

      const toDelete = cloudRows.map(r => r.id).filter(id => !localIds.has(id));
      if (toDelete.length > 0) {
        const { error: delErr } = await supabase
          .from('roadmap')
          .delete()
          .in('id', toDelete);
        if (delErr) throw delErr;
        deleted = toDelete.length;
      }
    } catch (err) {
      return {
        inserted,
        updated,
        skipped,
        deleted: 0,
        failed,
        warning: `Cloud cleanup failed: ${err.message}. Inserts/updates were committed.`,
      };
    }
  }

  return { inserted, updated, skipped, deleted, failed };
}
