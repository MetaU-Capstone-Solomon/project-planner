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
  throw new Error('not implemented');
}
