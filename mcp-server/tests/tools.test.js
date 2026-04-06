import { describe, it, expect, test, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { SqliteAdapter } from '../adapters/SqliteAdapter.js';
import { getProjectStatus } from '../tools/getProjectStatus.js';
import { getNextTasks } from '../tools/getNextTasks.js';
import { updateTaskStatus } from '../tools/updateTaskStatus.js';
import { addNoteToTask } from '../tools/addNoteToTask.js';
import { getProjectRoadmap } from '../tools/getProjectRoadmap.js';

// ---------------------------------------------------------------------------
// Shared setup
// ---------------------------------------------------------------------------

let tmpDir;
let adapter;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-tools-'));
  adapter = new SqliteAdapter(path.join(tmpDir, 'db.sqlite'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// Seed a project with a specific ID directly into SQLite
function seedProject(id, title, content) {
  const now = new Date().toISOString();
  adapter._db.prepare(
    'INSERT INTO projects (id, user_id, title, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, 'local', title, content, now, now);
}

// ---------------------------------------------------------------------------
// Helpers (content builders — unchanged from original)
// ---------------------------------------------------------------------------

function makeContent({ phases = [] } = {}) {
  return JSON.stringify({ projectName: 'Test Project', phases });
}

function makePhase(tasks = [], id = 'phase-1', title = 'Phase 1') {
  return { id, title, order: 1, milestones: [{ id: 'm-1', title: 'M1', order: 1, tasks }] };
}

// ---------------------------------------------------------------------------
// getProjectStatus
// ---------------------------------------------------------------------------

describe('getProjectStatus', () => {
  test('returns summary for all projects when no project_id given', async () => {
    seedProject('p1', 'Alpha', makeContent({ phases: [makePhase([{ id: 't1', status: 'completed', order: 1 }, { id: 't2', status: 'pending', order: 2 }])] }));
    seedProject('p2', 'Beta', makeContent({ phases: [makePhase([{ id: 't3', status: 'pending', order: 1 }])] }));
    const result = await getProjectStatus(adapter, {});
    expect(result).toHaveLength(2);
    const alpha = result.find(r => r.title === 'Alpha');
    expect(alpha.totalTasks).toBe(2);
    expect(alpha.completedTasks).toBe(1);
    expect(alpha.completionPercent).toBe(50);
  });

  test('returns detail for a specific project', async () => {
    seedProject('p1', 'Alpha', makeContent({ phases: [makePhase([{ id: 't1', status: 'completed', order: 1 }])] }));
    const result = await getProjectStatus(adapter, { project_id: 'p1' });
    expect(result.title).toBe('Alpha');
    expect(result.totalTasks).toBe(1);
    expect(result.completedTasks).toBe(1);
    expect(result.completionPercent).toBe(100);
  });

  test('throws when project not found', async () => {
    await expect(getProjectStatus(adapter, { project_id: 'nope' })).rejects.toThrow('not found');
  });
});

// ---------------------------------------------------------------------------
// getNextTasks
// ---------------------------------------------------------------------------

describe('getNextTasks', () => {
  test('returns pending and in_progress tasks up to limit', async () => {
    const content = makeContent({ phases: [makePhase([
      { id: 't1', title: 'Task 1', status: 'completed', order: 1 },
      { id: 't2', title: 'Task 2', status: 'in_progress', order: 2 },
      { id: 't3', title: 'Task 3', status: 'pending', order: 3 },
      { id: 't4', title: 'Task 4', status: 'pending', order: 4 },
    ])] });
    seedProject('p1', 'P', content);
    const result = await getNextTasks(adapter, { project_id: 'p1', limit: 2 });
    expect(result).toHaveLength(2);
    expect(result[0].taskId).toBe('t2');
    expect(result[0].phaseTitle).toBe('Phase 1');
    expect(result[0].milestoneTitle).toBe('M1');
    expect(result[1].taskId).toBe('t3');
  });

  test('respects default limit of 5', async () => {
    const tasks = Array.from({ length: 8 }, (_, i) => ({ id: `t${i}`, title: `Task ${i}`, status: 'pending', order: i }));
    seedProject('p1', 'P', makeContent({ phases: [makePhase(tasks)] }));
    const result = await getNextTasks(adapter, { project_id: 'p1' });
    expect(result).toHaveLength(5);
  });
});

// ---------------------------------------------------------------------------
// updateTaskStatus
// ---------------------------------------------------------------------------

describe('updateTaskStatus', () => {
  test('updates task status and persists to DB', async () => {
    seedProject('p1', 'P', makeContent({ phases: [makePhase([{ id: 'task-abc', title: 'Do thing', status: 'pending', order: 1 }])] }));
    const result = await updateTaskStatus(adapter, { project_id: 'p1', task_id: 'task-abc', status: 'completed' });
    expect(result.id).toBe('task-abc');
    expect(result.status).toBe('completed');
    // Verify persisted
    const reread = await getProjectStatus(adapter, { project_id: 'p1' });
    expect(reread.completedTasks).toBe(1);
  });

  test('throws when task not found', async () => {
    seedProject('p1', 'P', makeContent({ phases: [] }));
    await expect(
      updateTaskStatus(adapter, { project_id: 'p1', task_id: 'missing', status: 'completed' })
    ).rejects.toThrow('Task missing not found');
  });

  test('throws on invalid status', async () => {
    seedProject('p1', 'P', makeContent({ phases: [] }));
    await expect(
      updateTaskStatus(adapter, { project_id: 'p1', task_id: 't1', status: 'done' })
    ).rejects.toThrow('Invalid status');
  });
});

// ---------------------------------------------------------------------------
// addNoteToTask
// ---------------------------------------------------------------------------

describe('addNoteToTask', () => {
  test('appends note to task notes array', async () => {
    seedProject('p1', 'P', makeContent({ phases: [makePhase([{ id: 't1', title: 'T', status: 'in_progress', order: 1 }])] }));
    const result = await addNoteToTask(adapter, { project_id: 'p1', task_id: 't1', note: 'Scaffolding done' });
    expect(result.notes).toHaveLength(1);
    expect(result.notes[0].text).toBe('Scaffolding done');
    expect(result.notes[0].createdAt).toBeDefined();
  });

  test('appends to existing notes without overwriting', async () => {
    seedProject('p1', 'P', makeContent({ phases: [makePhase([{ id: 't1', title: 'T', status: 'pending', order: 1, notes: [{ text: 'first', createdAt: '2026-01-01T00:00:00Z' }] }])] }));
    const result = await addNoteToTask(adapter, { project_id: 'p1', task_id: 't1', note: 'second' });
    expect(result.notes).toHaveLength(2);
  });

  test('throws on empty note', async () => {
    await expect(
      addNoteToTask(adapter, { project_id: 'p1', task_id: 't1', note: '  ' })
    ).rejects.toThrow('Note text is required');
  });
});

// ---------------------------------------------------------------------------
// getProjectRoadmap
// ---------------------------------------------------------------------------

describe('getProjectRoadmap', () => {
  test('returns parsed roadmap content', async () => {
    const roadmapObj = { projectName: 'My App', phases: [] };
    seedProject('p1', 'My App', JSON.stringify(roadmapObj));
    const result = await getProjectRoadmap(adapter, { project_id: 'p1' });
    expect(result.projectName).toBe('My App');
    expect(result.phases).toEqual([]);
  });

  test('throws when project not found', async () => {
    await expect(
      getProjectRoadmap(adapter, { project_id: 'nope' })
    ).rejects.toThrow('Project nope not found');
  });
});
