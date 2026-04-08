import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { SqliteAdapter } from '../adapters/SqliteAdapter.js';

// SupabaseAdapter is a thin wrapper tested implicitly via existing tools tests.
// SqliteAdapter needs explicit unit tests.

let tmpDir;
let adapter;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-test-'));
  adapter = new SqliteAdapter(path.join(tmpDir, 'db.sqlite'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('SqliteAdapter', () => {
  it('getUserId returns "local"', () => {
    expect(adapter.getUserId()).toBe('local');
  });

  it('listProjects returns empty array on fresh DB', () => {
    const projects = adapter.listProjects();
    expect(projects).toEqual([]);
  });

  it('insertProject creates a project and listProjects returns it', () => {
    const { id } = adapter.insertProject('My Project', '{"phases":[]}');
    expect(typeof id).toBe('string');
    const projects = adapter.listProjects();
    expect(projects).toHaveLength(1);
    expect(projects[0].title).toBe('My Project');
    expect(projects[0].id).toBe(id);
  });

  it('getProject returns null for unknown id', () => {
    const result = adapter.getProject('nonexistent-id');
    expect(result).toBeNull();
  });

  it('getProject returns the project after insert', () => {
    const { id } = adapter.insertProject('Test', '{"phases":[]}');
    const project = adapter.getProject(id);
    expect(project).not.toBeNull();
    expect(project.title).toBe('Test');
    expect(project.content).toBe('{"phases":[]}');
  });

  it('saveProject updates title and content', () => {
    const { id } = adapter.insertProject('Old Title', '{"phases":[]}');
    const now = new Date().toISOString();
    adapter.saveProject(id, 'New Title', '{"phases":[{"id":"p1"}]}', now);
    const project = adapter.getProject(id);
    expect(project.title).toBe('New Title');
    expect(project.content).toBe('{"phases":[{"id":"p1"}]}');
  });

  it('creates nested directory if it does not exist', () => {
    const nestedPath = path.join(tmpDir, 'nested', 'dir', 'db.sqlite');
    const a = new SqliteAdapter(nestedPath);
    a.listProjects();
    expect(fs.existsSync(nestedPath)).toBe(true);
  });

  describe('_applyMigrations', () => {
    it('adds last_synced_at column on fresh DB', () => {
      adapter._applyMigrations();
      const cols = adapter._db.pragma('table_info(projects)');
      expect(cols.some(c => c.name === 'last_synced_at')).toBe(true);
    });

    it('is idempotent — running twice does not throw', () => {
      adapter._applyMigrations();
      expect(() => adapter._applyMigrations()).not.toThrow();
    });
  });

  describe('getProjectsSyncStatus', () => {
    it('returns id, title, content, updated_at, last_synced_at for all projects', () => {
      adapter._applyMigrations();
      adapter.insertProject('P1', '{"phases":[]}');
      const rows = adapter.getProjectsSyncStatus();
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ title: 'P1', last_synced_at: null });
      expect(typeof rows[0].updated_at).toBe('string');
      expect(typeof rows[0].content).toBe('string');
    });
  });

  describe('markSynced', () => {
    it('sets last_synced_at for a project', () => {
      adapter._applyMigrations();
      const { id } = adapter.insertProject('P2', '{}');
      const ts = '2026-04-08T00:00:00.000Z';
      adapter.markSynced(id, ts);
      const rows = adapter.getProjectsSyncStatus();
      expect(rows[0].last_synced_at).toBe(ts);
    });
  });
});
