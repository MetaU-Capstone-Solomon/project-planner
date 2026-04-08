// Phase 9 tests
// - fileAnalyzer class method detection fix
// - scanRepo treeHash
// - getProjectStatus include_handoff
// - tech_metadata persistence via scan_repo handler logic

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { SqliteAdapter } from '../adapters/SqliteAdapter.js';
import { createProject } from '../tools/createProject.js';
import { addSessionSummary } from '../tools/addSessionSummary.js';
import { updateTaskStatus } from '../tools/updateTaskStatus.js';
import { getProjectStatus } from '../tools/getProjectStatus.js';
import { scanRepo } from '../tools/scanRepo.js';
import { analyzeFile } from '../lib/fileAnalyzer.js';

let tmpDir, adapter;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-phase9-'));
  adapter = new SqliteAdapter(path.join(tmpDir, 'db.sqlite'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

async function seedProject(goal = 'Build something great') {
  const result = await createProject(adapter, {
    title: 'Test Project',
    phases: [{
      title: 'Phase 1',
      milestones: [{
        title: 'Milestone 1',
        tasks: [
          { title: 'Task A' },
          { title: 'Task B' },
        ],
      }],
    }],
  });
  // Write projectGoal directly into roadmap
  const projectData = adapter.getProject(result.projectId);
  const roadmap = JSON.parse(projectData.content);
  roadmap.projectGoal = goal;
  adapter.saveProject(result.projectId, projectData.title, JSON.stringify(roadmap), new Date().toISOString());
  return result.projectId;
}

// ─── fileAnalyzer — class method detection ────────────────────────────────────

describe('fileAnalyzer — class method shorthand detection', () => {
  const classSource = `
class AuthService {
  async validateToken() {}
  refreshSession() {}
  getUser() {}
}

const controller = {
  getUser() {},
  createUser() {},
};
`;

  it('detects class method shorthands', () => {
    const r = analyzeFile('auth.js', classSource);
    expect(r.functions).toContain('validateToken');
    expect(r.functions).toContain('refreshSession');
    expect(r.functions).toContain('getUser');
  });

  it('detects object method shorthands', () => {
    const r = analyzeFile('auth.js', classSource);
    expect(r.functions).toContain('createUser');
  });

  it('does not treat if/for/while/switch/catch as functions', () => {
    const controlSource = `
if (x) {}
for (let i = 0; i < 10; i++) {}
while (true) {}
switch (x) {}
try {} catch (e) {}
`;
    const r = analyzeFile('control.js', controlSource);
    expect(r.functions).not.toContain('if');
    expect(r.functions).not.toContain('for');
    expect(r.functions).not.toContain('while');
    expect(r.functions).not.toContain('switch');
    expect(r.functions).not.toContain('catch');
  });
});

// ─── scanRepo — treeHash ──────────────────────────────────────────────────────

describe('scanRepo — treeHash', () => {
  it('returns a treeHash string', () => {
    const result = scanRepo({ path: tmpDir });
    expect(typeof result.treeHash).toBe('string');
    expect(result.treeHash.length).toBeGreaterThan(0);
  });

  it('same directory produces same hash', () => {
    fs.writeFileSync(path.join(tmpDir, 'app.js'), 'function foo() {}');
    const r1 = scanRepo({ path: tmpDir });
    const r2 = scanRepo({ path: tmpDir });
    expect(r1.treeHash).toBe(r2.treeHash);
  });

  it('different directory structure produces different hash', () => {
    const r1 = scanRepo({ path: tmpDir });
    fs.writeFileSync(path.join(tmpDir, 'newfile.js'), 'function bar() {}');
    const r2 = scanRepo({ path: tmpDir });
    expect(r1.treeHash).not.toBe(r2.treeHash);
  });
});

// ─── getProjectStatus — include_handoff ──────────────────────────────────────

describe('getProjectStatus — include_handoff: false (default)', () => {
  it('does not include handoff fields by default', async () => {
    const projectId = await seedProject();
    const result = await getProjectStatus(adapter, { project_id: projectId });
    expect(result.projectGoal).toBeUndefined();
    expect(result.lastSession).toBeUndefined();
    expect(result.recentTasks).toBeUndefined();
  });

  it('includes tech_metadata field (null when not yet scanned)', async () => {
    const projectId = await seedProject();
    const result = await getProjectStatus(adapter, { project_id: projectId });
    expect(result).toHaveProperty('tech_metadata');
    expect(result.tech_metadata).toBeNull();
  });

  it('returns inProgressTasks count', async () => {
    const projectId = await seedProject();
    const project = adapter.getProject(projectId);
    const roadmap = JSON.parse(project.content);
    const taskId = roadmap.phases[0].milestones[0].tasks[0].id;
    await updateTaskStatus(adapter, { project_id: projectId, task_id: taskId, status: 'in_progress' });

    const result = await getProjectStatus(adapter, { project_id: projectId });
    expect(result.inProgressTasks).toBe(1);
  });
});

describe('getProjectStatus — include_handoff: true', () => {
  it('includes projectGoal', async () => {
    const projectId = await seedProject('Ship a great product');
    const result = await getProjectStatus(adapter, { project_id: projectId, include_handoff: true });
    expect(result.projectGoal).toBe('Ship a great product');
  });

  it('includes lastSession when sessions exist', async () => {
    const projectId = await seedProject();
    await addSessionSummary(adapter, { project_id: projectId, summary: 'Finished auth module.' });
    const result = await getProjectStatus(adapter, { project_id: projectId, include_handoff: true });
    expect(result.lastSession).not.toBeNull();
    expect(result.lastSession.summary).toBe('Finished auth module.');
  });

  it('lastSession is null when no sessions recorded', async () => {
    const projectId = await seedProject();
    const result = await getProjectStatus(adapter, { project_id: projectId, include_handoff: true });
    expect(result.lastSession).toBeNull();
  });

  it('includes recentTasks array', async () => {
    const projectId = await seedProject();
    const result = await getProjectStatus(adapter, { project_id: projectId, include_handoff: true });
    expect(Array.isArray(result.recentTasks)).toBe(true);
    expect(result.recentTasks.length).toBeGreaterThan(0);
  });

  it('recentTasks respects last_n_tasks limit', async () => {
    const projectId = await seedProject();
    const result = await getProjectStatus(adapter, { project_id: projectId, include_handoff: true, last_n_tasks: 1 });
    expect(result.recentTasks.length).toBeLessThanOrEqual(1);
  });

  it('still returns normal status fields alongside handoff', async () => {
    const projectId = await seedProject();
    const result = await getProjectStatus(adapter, { project_id: projectId, include_handoff: true });
    expect(result.totalTasks).toBeDefined();
    expect(result.completedTasks).toBeDefined();
    expect(result.completionPercent).toBeDefined();
    expect(result.currentPhase).toBeDefined();
  });

  it('recentTasks sorts in_progress tasks first', async () => {
    const projectId = await seedProject();
    const project = adapter.getProject(projectId);
    const roadmap = JSON.parse(project.content);
    const tasks = roadmap.phases[0].milestones[0].tasks;
    // Mark second task in_progress
    await updateTaskStatus(adapter, { project_id: projectId, task_id: tasks[1].id, status: 'in_progress' });

    const result = await getProjectStatus(adapter, { project_id: projectId, include_handoff: true });
    expect(result.recentTasks[0].status).toBe('in_progress');
  });
});

// ─── tech_metadata in status after scan ──────────────────────────────────────

describe('tech_metadata persistence (via adapter direct write)', () => {
  it('getProjectStatus returns tech_metadata after it is written', async () => {
    const projectId = await seedProject();

    // Simulate what the index.js scan_repo handler does
    const projectData = adapter.getProject(projectId);
    const roadmap = JSON.parse(projectData.content);
    roadmap.tech_metadata = {
      languages: ['javascript'],
      topImports: ['express', 'zod'],
      fileCount: 12,
      treeHash: 'abc123',
      scannedAt: new Date().toISOString(),
    };
    adapter.saveProject(projectId, projectData.title, JSON.stringify(roadmap), new Date().toISOString());

    const result = await getProjectStatus(adapter, { project_id: projectId });
    expect(result.tech_metadata).not.toBeNull();
    expect(result.tech_metadata.languages).toContain('javascript');
    expect(result.tech_metadata.treeHash).toBe('abc123');
    expect(result.tech_metadata.fileCount).toBe(12);
  });

  it('tech_metadata appears in list view too', async () => {
    const projectId = await seedProject();
    const projectData = adapter.getProject(projectId);
    const roadmap = JSON.parse(projectData.content);
    roadmap.tech_metadata = { languages: ['python'], topImports: [], fileCount: 3, treeHash: 'xyz', scannedAt: new Date().toISOString() };
    adapter.saveProject(projectId, projectData.title, JSON.stringify(roadmap), new Date().toISOString());

    const results = await getProjectStatus(adapter, {});
    const project = results.find(p => p.id === projectId);
    expect(project.tech_metadata).not.toBeNull();
    expect(project.tech_metadata.languages).toContain('python');
  });
});

// ─── scanRepo — treeHash cache logic (unit test of hash comparison) ───────────

describe('scanRepo treeHash cache hit detection', () => {
  it('matching treeHash can be detected for cache hit', async () => {
    const repoDir = fs.mkdtempSync(path.join(os.tmpdir(), 'repo-'));
    try {
      fs.writeFileSync(path.join(repoDir, 'index.js'), 'export function main() {}');
      const firstScan = scanRepo({ path: repoDir });
      const secondScan = scanRepo({ path: repoDir });

      // Same tree → same hash → cache hit
      expect(firstScan.treeHash).toBe(secondScan.treeHash);
    } finally {
      fs.rmSync(repoDir, { recursive: true, force: true });
    }
  });

  it('different treeHash forces cache miss', async () => {
    const repoDir = fs.mkdtempSync(path.join(os.tmpdir(), 'repo-'));
    try {
      fs.writeFileSync(path.join(repoDir, 'index.js'), 'export function main() {}');
      const firstScan = scanRepo({ path: repoDir });

      fs.writeFileSync(path.join(repoDir, 'utils.js'), 'export function helper() {}');
      const secondScan = scanRepo({ path: repoDir });

      expect(firstScan.treeHash).not.toBe(secondScan.treeHash);
    } finally {
      fs.rmSync(repoDir, { recursive: true, force: true });
    }
  });
});
