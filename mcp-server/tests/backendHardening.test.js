// Backend hardening tests
// - get_tasks: limit param (default 100, max 500)
// - scanRepo: markdown file cap (15 files × 30KB)
// - scanRepo: fileMap in result
// - scanRepo: fileMap persisted in tech_metadata

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { SqliteAdapter } from '../adapters/SqliteAdapter.js';
import { createProject } from '../tools/createProject.js';
import { getTasks } from '../tools/getTasks.js';
import { scanRepo } from '../tools/scanRepo.js';

let tmpDir, adapter;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-hardening-'));
  adapter = new SqliteAdapter(path.join(tmpDir, 'db.sqlite'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ─── getTasks — limit param ───────────────────────────────────────────────────

describe('getTasks — limit param', () => {
  async function seedLargeProject(taskCount) {
    const tasks = Array.from({ length: taskCount }, (_, i) => ({ title: `Task ${i + 1}` }));
    return createProject(adapter, {
      title: 'Large Project',
      phases: [{ title: 'Phase 1', milestones: [{ title: 'M1', tasks }] }],
    });
  }

  it('defaults to 100 tasks', async () => {
    const { projectId } = await seedLargeProject(150);
    const result = await getTasks(adapter, { project_id: projectId });
    expect(result.tasks).toHaveLength(100);
    expect(result.limit).toBe(100);
  });

  it('respects custom limit', async () => {
    const { projectId } = await seedLargeProject(150);
    const result = await getTasks(adapter, { project_id: projectId, limit: 25 });
    expect(result.tasks).toHaveLength(25);
    expect(result.limit).toBe(25);
  });

  it('caps at 500 even if higher limit requested', async () => {
    const { projectId } = await seedLargeProject(50);
    const result = await getTasks(adapter, { project_id: projectId, limit: 999 });
    expect(result.limit).toBe(500);
    // only 50 tasks exist so all returned
    expect(result.tasks).toHaveLength(50);
  });

  it('returns all tasks when project has fewer than limit', async () => {
    const { projectId } = await seedLargeProject(10);
    const result = await getTasks(adapter, { project_id: projectId, limit: 100 });
    expect(result.tasks).toHaveLength(10);
  });

  it('limit combines correctly with status filter', async () => {
    const { projectId } = await seedLargeProject(150);
    const result = await getTasks(adapter, {
      project_id: projectId,
      status: 'pending',
      limit: 20,
    });
    expect(result.tasks).toHaveLength(20);
    expect(result.tasks.every(t => t.status === 'pending')).toBe(true);
  });
});

// ─── scanRepo — markdown cap ──────────────────────────────────────────────────

describe('scanRepo — markdown file cap', () => {
  it('caps at 15 markdown files', () => {
    const repoDir = fs.mkdtempSync(path.join(os.tmpdir(), 'repo-md-'));
    try {
      // Create 20 markdown files
      for (let i = 0; i < 20; i++) {
        fs.writeFileSync(path.join(repoDir, `doc${i}.md`), `# Doc ${i}\nContent here.`);
      }

      const result = scanRepo({ path: repoDir });
      // README.md is checked first via KEY_FILE_NAMES, then remaining md files up to cap
      const mdFiles = result.keyFiles.filter(f => f.path.endsWith('.md'));
      expect(mdFiles.length).toBeLessThanOrEqual(15);
    } finally {
      fs.rmSync(repoDir, { recursive: true, force: true });
    }
  });

  it('truncates individual markdown files over 30KB', () => {
    const repoDir = fs.mkdtempSync(path.join(os.tmpdir(), 'repo-big-'));
    try {
      // Write a 60KB markdown file
      const bigContent = 'x'.repeat(60 * 1024);
      fs.writeFileSync(path.join(repoDir, 'big.md'), bigContent);

      const result = scanRepo({ path: repoDir });
      const bigFile = result.keyFiles.find(f => f.path === 'big.md');
      expect(bigFile).toBeDefined();
      expect(Buffer.byteLength(bigFile.content, 'utf8')).toBeLessThanOrEqual(30 * 1024 + 20); // +20 for '[truncated]'
      expect(bigFile.content).toContain('[truncated]');
    } finally {
      fs.rmSync(repoDir, { recursive: true, force: true });
    }
  });

  it('does not truncate files under 30KB', () => {
    const repoDir = fs.mkdtempSync(path.join(os.tmpdir(), 'repo-small-'));
    try {
      const content = '# Small doc\nThis is under 30KB.';
      fs.writeFileSync(path.join(repoDir, 'small.md'), content);

      const result = scanRepo({ path: repoDir });
      const file = result.keyFiles.find(f => f.path === 'small.md');
      expect(file?.content).toBe(content);
    } finally {
      fs.rmSync(repoDir, { recursive: true, force: true });
    }
  });
});

// ─── scanRepo — fileMap ───────────────────────────────────────────────────────

describe('scanRepo — fileMap', () => {
  it('returns fileMap when source files exist', () => {
    const repoDir = fs.mkdtempSync(path.join(os.tmpdir(), 'repo-fm-'));
    try {
      fs.writeFileSync(path.join(repoDir, 'index.js'), 'export function main() {}\n');

      const result = scanRepo({ path: repoDir });
      expect(result.fileMap).toBeDefined();
      expect(typeof result.fileMap).toBe('object');
    } finally {
      fs.rmSync(repoDir, { recursive: true, force: true });
    }
  });

  it('fileMap groups files by directory', () => {
    const repoDir = fs.mkdtempSync(path.join(os.tmpdir(), 'repo-fm2-'));
    try {
      fs.mkdirSync(path.join(repoDir, 'src'));
      fs.writeFileSync(path.join(repoDir, 'src', 'app.js'), 'export function start() {}\n');
      fs.writeFileSync(path.join(repoDir, 'src', 'util.js'), 'export function helper() {}\n');
      fs.writeFileSync(path.join(repoDir, 'index.js'), 'import "./src/app.js";\n');

      const result = scanRepo({ path: repoDir });
      expect(result.fileMap).toBeDefined();

      const dirs = Object.keys(result.fileMap);
      expect(dirs.some(d => d === 'src' || d.endsWith('src'))).toBe(true);
    } finally {
      fs.rmSync(repoDir, { recursive: true, force: true });
    }
  });

  it('each fileMap entry has expected shape', () => {
    const repoDir = fs.mkdtempSync(path.join(os.tmpdir(), 'repo-fm3-'));
    try {
      fs.writeFileSync(path.join(repoDir, 'mod.js'), 'export class Foo {}\nexport function bar() {}\n');

      const result = scanRepo({ path: repoDir });
      const entries = Object.values(result.fileMap).flat();
      expect(entries.length).toBeGreaterThan(0);
      const entry = entries[0];
      expect(entry).toHaveProperty('file');
      expect(entry).toHaveProperty('language');
      expect(entry).toHaveProperty('functions');
      expect(entry).toHaveProperty('classes');
      expect(entry).toHaveProperty('exports');
    } finally {
      fs.rmSync(repoDir, { recursive: true, force: true });
    }
  });

  it('omits fileMap when no analyzable source files', () => {
    const repoDir = fs.mkdtempSync(path.join(os.tmpdir(), 'repo-nofm-'));
    try {
      fs.writeFileSync(path.join(repoDir, 'README.md'), '# Only docs\n');

      const result = scanRepo({ path: repoDir });
      expect(result.fileMap).toBeUndefined();
    } finally {
      fs.rmSync(repoDir, { recursive: true, force: true });
    }
  });
});
