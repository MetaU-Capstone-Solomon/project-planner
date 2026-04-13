import Database from 'better-sqlite3';
import { SqliteAdapter } from '../adapters/SqliteAdapter.js';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

let tmpDir, adapter;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'proplan-test-'));
  adapter = new SqliteAdapter(join(tmpDir, 'db.sqlite'));
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

describe('SqliteAdapter.insertProjectWithId', () => {
  it('inserts a project with the provided UUID', () => {
    const id = 'cloud-uuid-123';
    adapter.insertProjectWithId(id, 'My Project', '{"phases":[]}', '2024-01-01T00:00:00.000Z');
    const row = adapter.getProject(id);
    expect(row).not.toBeNull();
    expect(row.id).toBe(id);
    expect(row.title).toBe('My Project');
  });

  it('sets last_synced_at to the provided syncedAt timestamp', () => {
    const id = 'cloud-uuid-456';
    const ts = '2024-06-01T12:00:00.000Z';
    adapter.insertProjectWithId(id, 'T', '{}', ts);
    const rows = adapter.getProjectsSyncStatus();
    const row = rows.find(r => r.id === id);
    expect(row.last_synced_at).toBe(ts);
  });

  it('does not overwrite an existing project with the same id', () => {
    const id = 'dup-uuid';
    adapter.insertProjectWithId(id, 'First', '{}', '2024-01-01T00:00:00.000Z');
    adapter.insertProjectWithId(id, 'Second', '{}', '2024-01-02T00:00:00.000Z');
    const row = adapter.getProject(id);
    expect(row.title).toBe('First'); // first one wins
  });
});
