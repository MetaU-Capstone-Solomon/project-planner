// mcp-server/tests/incrementalSync.test.js
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { SqliteAdapter } from '../adapters/SqliteAdapter.js';
import { syncProjects } from '../tools/syncProjects.js';

let tmpDir;
let adapter;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-sync-test-'));
  adapter = new SqliteAdapter(path.join(tmpDir, 'db.sqlite'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

/**
 * Builds a mock Supabase client that supports:
 *   from('roadmap').insert(data).select('id').single()   → INSERT
 *   from('roadmap').update(data).eq(f,v).eq(f,v)         → UPDATE
 *   from('roadmap').select('id').eq('user_id', uid)      → fetch cloud rows
 *   from('roadmap').delete().in('id', ids)               → bulk delete
 */
function makeMockSupabase({
  insertError = null,
  updateError = null,
  cloudRows = [],
  fetchError = null,
  deleteError = null,
} = {}) {
  const store = new Map(cloudRows.map(r => [r.id, { ...r }]));

  return {
    _store: store,
    from(_table) {
      return {
        insert(data) {
          return {
            select() {
              return {
                async single() {
                  if (insertError) return { data: null, error: insertError };
                  store.set(data.id, { ...data });
                  return { data: { id: data.id }, error: null };
                },
              };
            },
          };
        },
        update(data) {
          return {
            eq(_f1, id) {
              return {
                async eq(_f2, _uid) {
                  if (updateError) return { error: updateError };
                  if (store.has(id)) store.set(id, { ...store.get(id), ...data });
                  return { error: null };
                },
              };
            },
          };
        },
        select() {
          return {
            async eq(field, val) {
              if (fetchError) return { data: null, error: fetchError };
              const rows = [...store.values()].filter(r => r[field] === val);
              return { data: rows, error: null };
            },
          };
        },
        delete() {
          return {
            async in(_field, ids) {
              if (deleteError) return { error: deleteError };
              for (const id of ids) store.delete(id);
              return { error: null };
            },
          };
        },
      };
    },
  };
}

describe('syncProjects', () => {
  it('migration adds last_synced_at column on first call', async () => {
    const sb = makeMockSupabase();
    await syncProjects(adapter, sb, 'user-1');
    const cols = adapter._db.pragma('table_info(projects)');
    expect(cols.some(c => c.name === 'last_synced_at')).toBe(true);
  });

  it('migration is idempotent — calling syncProjects twice does not throw', async () => {
    const sb = makeMockSupabase();
    await syncProjects(adapter, sb, 'user-1');
    await expect(syncProjects(adapter, sb, 'user-1')).resolves.toBeDefined();
  });

  it('first sync inserts with local UUID as Supabase row id', async () => {
    const { id } = adapter.insertProject('Alpha', '{"phases":[]}');
    const sb = makeMockSupabase();
    const result = await syncProjects(adapter, sb, 'user-1');
    expect(result.inserted).toBe(1);
    expect(result.updated).toBe(0);
    expect(sb._store.has(id)).toBe(true);
    expect(sb._store.get(id).id).toBe(id);
  });

  it('sets last_synced_at after successful insert', async () => {
    adapter.insertProject('Beta', '{"phases":[]}');
    const sb = makeMockSupabase();
    await syncProjects(adapter, sb, 'user-1');
    const [row] = adapter.getProjectsSyncStatus();
    expect(row.last_synced_at).not.toBeNull();
  });

  it('incremental sync updates project changed since last sync', async () => {
    const { id } = adapter.insertProject('Gamma', '{"phases":[]}');
    adapter._applyMigrations();
    adapter.markSynced(id, '2026-01-01T00:00:00.000Z');
    // updated_at set to now (> last_synced_at) by saveProject
    adapter.saveProject(id, 'Gamma v2', '{"phases":[{"id":"p1"}]}', new Date().toISOString());
    const sb = makeMockSupabase({ cloudRows: [{ id, user_id: 'user-1' }] });
    const result = await syncProjects(adapter, sb, 'user-1');
    expect(result.updated).toBe(1);
    expect(result.inserted).toBe(0);
  });

  it('skips project unchanged since last sync', async () => {
    const { id } = adapter.insertProject('Delta', '{"phases":[]}');
    adapter._applyMigrations();
    // last_synced_at far in the future → updated_at <= last_synced_at
    adapter.markSynced(id, new Date(Date.now() + 10_000).toISOString());
    const sb = makeMockSupabase();
    const result = await syncProjects(adapter, sb, 'user-1');
    expect(result.skipped).toBe(1);
    expect(result.inserted).toBe(0);
    expect(result.updated).toBe(0);
  });

  it('mixed batch (2 new, 1 changed, 1 unchanged) produces correct counts', async () => {
    adapter._applyMigrations();
    // 2 new (last_synced_at = null)
    adapter.insertProject('New1', '{}');
    adapter.insertProject('New2', '{}');
    // 1 changed
    const { id: changedId } = adapter.insertProject('Changed', '{}');
    adapter.markSynced(changedId, '2026-01-01T00:00:00.000Z');
    adapter.saveProject(changedId, 'Changed v2', '{"phases":[{"id":"p1"}]}', new Date().toISOString());
    // 1 unchanged
    const { id: unchangedId } = adapter.insertProject('Unchanged', '{}');
    adapter.markSynced(unchangedId, new Date(Date.now() + 10_000).toISOString());

    const sb = makeMockSupabase();
    const result = await syncProjects(adapter, sb, 'user-1');
    expect(result.inserted).toBe(2);
    expect(result.updated).toBe(1);
    expect(result.skipped).toBe(1);
    expect(result.failed).toHaveLength(0);
  });

  it('per-project failure does not block others; failed project stays unsynced', async () => {
    adapter._applyMigrations();
    adapter.insertProject('OK', '{}');
    adapter.insertProject('Fails', '{}');

    let callCount = 0;
    const flakySupabase = {
      from() {
        return {
          insert() {
            return {
              select() {
                return {
                  async single() {
                    callCount++;
                    if (callCount === 2) return { data: null, error: { message: 'DB timeout' } };
                    return { data: { id: 'stub-id' }, error: null };
                  },
                };
              },
            };
          },
        };
      },
    };

    const result = await syncProjects(adapter, flakySupabase, 'user-1');
    expect(result.inserted).toBe(1);
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0].error).toBe('DB timeout');
    // the failed project must still have last_synced_at = null
    const rows = adapter.getProjectsSyncStatus();
    expect(rows.filter(r => r.last_synced_at === null)).toHaveLength(1);
  });

  it('delete_removed: true removes cloud-only rows', async () => {
    adapter._applyMigrations();
    const { id: localId } = adapter.insertProject('Local', '{}');
    adapter.markSynced(localId, new Date(Date.now() + 10_000).toISOString());
    const sb = makeMockSupabase({
      cloudRows: [
        { id: localId, user_id: 'user-1' },
        { id: 'cloud-only-id', user_id: 'user-1' },
      ],
    });
    const result = await syncProjects(adapter, sb, 'user-1', { delete_removed: true });
    expect(result.deleted).toBe(1);
    expect(sb._store.has('cloud-only-id')).toBe(false);
    expect(sb._store.has(localId)).toBe(true);
  });

  it('delete_removed: false (default) leaves cloud-only rows intact', async () => {
    adapter._applyMigrations();
    const { id: localId } = adapter.insertProject('Local', '{}');
    adapter.markSynced(localId, new Date(Date.now() + 10_000).toISOString());
    const sb = makeMockSupabase({
      cloudRows: [
        { id: localId, user_id: 'user-1' },
        { id: 'cloud-only-id', user_id: 'user-1' },
      ],
    });
    const result = await syncProjects(adapter, sb, 'user-1');
    expect(result.deleted).toBe(0);
    expect(sb._store.has('cloud-only-id')).toBe(true);
  });
});
