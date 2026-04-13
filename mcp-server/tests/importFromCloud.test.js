import Database from 'better-sqlite3';
import { SqliteAdapter } from '../adapters/SqliteAdapter.js';
import { importFromCloud } from '../tools/importFromCloud.js';
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

// Mock fetch globally for these tests
const originalFetch = global.fetch;

afterAll(() => { global.fetch = originalFetch; });

describe('importFromCloud — list mode (no project_id)', () => {
  it('returns a list of cloud projects when no project_id given', async () => {
    global.fetch = async (url) => {
      if (url.includes('/api/mcp/projects') && !url.match(/\/[a-z0-9-]{36}$/)) {
        return {
          ok: true,
          json: async () => [
            { id: 'uuid-1', title: 'Project A', updated_at: '2024-01-01T00:00:00.000Z' },
            { id: 'uuid-2', title: 'Project B', updated_at: '2024-02-01T00:00:00.000Z' },
          ],
        };
      }
    };

    const result = await importFromCloud({ mcp_token: 'mcp_test' });
    expect(result.projects).toHaveLength(2);
    expect(result.projects[0].title).toBe('Project A');
    expect(result.instruction).toMatch(/project_id/);
  });
});

describe('importFromCloud — import mode (with project_id)', () => {
  it('imports a specific project into local SQLite', async () => {
    global.fetch = async (url) => {
      if (url.includes('/health')) return { ok: true, json: async () => ({ status: 'ok' }) };
      if (url.includes('/api/mcp/projects/uuid-1')) {
        return {
          ok: true,
          json: async () => ({
            id: 'uuid-1',
            title: 'Project A',
            content: '{"phases":[],"goal":"test"}',
            updated_at: '2024-01-01T00:00:00.000Z',
          }),
        };
      }
    };

    const result = await importFromCloud({
      mcp_token: 'mcp_test',
      project_id: 'uuid-1',
      db_path: join(tmpDir, 'import-test.sqlite'),
    });

    expect(result.imported).toBe(true);
    expect(result.project.title).toBe('Project A');
    expect(result.project.id).toBe('uuid-1');
  });

  it('returns already_exists if project already in local DB', async () => {
    const dbPath = join(tmpDir, 'existing.sqlite');
    const localAdapter = new SqliteAdapter(dbPath);
    localAdapter.insertProjectWithId('uuid-existing', 'Existing', '{}', '2024-01-01T00:00:00.000Z');

    global.fetch = async (url) => {
      if (url.includes('/health')) return { ok: true, json: async () => ({ status: 'ok' }) };
      if (url.includes('/api/mcp/projects/uuid-existing')) {
        return {
          ok: true,
          json: async () => ({
            id: 'uuid-existing', title: 'Existing', content: '{}',
            updated_at: '2024-01-01T00:00:00.000Z',
          }),
        };
      }
    };

    const result = await importFromCloud({
      mcp_token: 'mcp_test',
      project_id: 'uuid-existing',
      db_path: dbPath,
    });

    expect(result.already_exists).toBe(true);
  });
});
