// Integration tests for Phase 6 tools: deleteProject, renameProject, session handoff.
// Also covers scanRepo size guard.

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { SqliteAdapter } from '../adapters/SqliteAdapter.js';
import { createProject } from '../tools/createProject.js';
import { deleteProject } from '../tools/deleteProject.js';
import { renameProject } from '../tools/renameProject.js';
import { getProjectStatus } from '../tools/getProjectStatus.js';
import { addNoteToTask } from '../tools/addNoteToTask.js';
import { updateTaskStatus } from '../tools/updateTaskStatus.js';
import { scanRepo } from '../tools/scanRepo.js';

let tmpDir;
let adapter;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-phase6-'));
  adapter = new SqliteAdapter(path.join(tmpDir, 'db.sqlite'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

async function createTestProject(title = 'Test App') {
  return createProject(adapter, {
    title,
    phases: [{
      title: 'Phase 1',
      milestones: [{
        title: 'Milestone 1',
        tasks: [
          { title: 'Task A', description: 'First task' },
          { title: 'Task B', description: 'Second task' },
        ],
      }],
    }],
  });
}

// ---------------------------------------------------------------------------
// deleteProject
// ---------------------------------------------------------------------------

describe('deleteProject', () => {
  it('dry_run returns project title, task count, and warning', async () => {
    const { projectId } = await createTestProject();
    const result = await deleteProject(adapter, { project_id: projectId, dry_run: true });
    expect(result.item.title).toBe('Test App');
    expect(result.warning).toMatch(/2 task/);
    expect(result.action).toBe('delete_project');
    // Project still exists
    expect(adapter.getProject(projectId)).not.toBeNull();
  });

  it('dry_run: false deletes the project', async () => {
    const { projectId } = await createTestProject();
    const result = await deleteProject(adapter, { project_id: projectId, dry_run: false });
    expect(result.deleted).toBe(true);
    expect(result.title).toBe('Test App');
    expect(adapter.getProject(projectId)).toBeNull();
  });

  it('throws if project not found', async () => {
    await expect(
      deleteProject(adapter, { project_id: 'nonexistent', dry_run: false })
    ).rejects.toThrow('not found');
  });

  it('deleting one project does not affect others', async () => {
    const { projectId: id1 } = await createTestProject('Project 1');
    const { projectId: id2 } = await createTestProject('Project 2');
    await deleteProject(adapter, { project_id: id1, dry_run: false });
    expect(adapter.getProject(id1)).toBeNull();
    expect(adapter.getProject(id2)).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// renameProject
// ---------------------------------------------------------------------------

describe('renameProject', () => {
  it('returns old and new title', async () => {
    const { projectId } = await createTestProject('Old Name');
    const result = await renameProject(adapter, { project_id: projectId, new_title: 'New Name' });
    expect(result.old_title).toBe('Old Name');
    expect(result.new_title).toBe('New Name');
  });

  it('persists the new title in the DB', async () => {
    const { projectId } = await createTestProject('Original');
    await renameProject(adapter, { project_id: projectId, new_title: 'Renamed' });
    const project = adapter.getProject(projectId);
    expect(project.title).toBe('Renamed');
  });

  it('trims whitespace from new_title', async () => {
    const { projectId } = await createTestProject();
    const result = await renameProject(adapter, { project_id: projectId, new_title: '  Trimmed  ' });
    expect(result.new_title).toBe('Trimmed');
  });

  it('throws if project not found', async () => {
    await expect(
      renameProject(adapter, { project_id: 'ghost', new_title: 'Something' })
    ).rejects.toThrow('not found');
  });

  it('throws if new_title is empty', async () => {
    const { projectId } = await createTestProject();
    await expect(
      renameProject(adapter, { project_id: projectId, new_title: '   ' })
    ).rejects.toThrow('new_title is required');
  });
});

// ---------------------------------------------------------------------------
// session handoff (via get_project_status include_handoff: true)
// ---------------------------------------------------------------------------

describe('getProjectStatus include_handoff', () => {
  it('returns project summary and recentTasks for fresh project', async () => {
    const { projectId } = await createTestProject();
    const result = await getProjectStatus(adapter, { project_id: projectId, include_handoff: true });
    expect(result.title).toBe('Test App');
    expect(result.totalTasks).toBe(2);
    expect(result.completedTasks).toBe(0);
    expect(result.completionPercent).toBe(0);
    expect(result.recentTasks).toHaveLength(2);
    expect(result.recentTasks[0].lastNote).toBeNull();
  });

  it('surfaces in_progress tasks first regardless of note recency', async () => {
    const { projectId } = await createTestProject();
    const project = adapter.getProject(projectId);
    const roadmap = JSON.parse(project.content);
    const taskAId = roadmap.phases[0].milestones[0].tasks[0].id;
    const taskBId = roadmap.phases[0].milestones[0].tasks[1].id;

    await addNoteToTask(adapter, { project_id: projectId, task_id: taskAId, note: 'Working on this' });
    await updateTaskStatus(adapter, { project_id: projectId, task_id: taskBId, status: 'in_progress' });

    const result = await getProjectStatus(adapter, { project_id: projectId, include_handoff: true });
    expect(result.recentTasks[0].id).toBe(taskBId);
    expect(result.recentTasks[0].status).toBe('in_progress');
  });

  it('respects last_n_tasks limit', async () => {
    const { projectId } = await createTestProject();
    const result = await getProjectStatus(adapter, { project_id: projectId, include_handoff: true, last_n_tasks: 1 });
    expect(result.recentTasks).toHaveLength(1);
  });

  it('includes lastNote on tasks that have notes', async () => {
    const { projectId } = await createTestProject();
    const project = adapter.getProject(projectId);
    const roadmap = JSON.parse(project.content);
    const taskAId = roadmap.phases[0].milestones[0].tasks[0].id;

    await addNoteToTask(adapter, { project_id: projectId, task_id: taskAId, note: 'Progress update' });

    const result = await getProjectStatus(adapter, { project_id: projectId, include_handoff: true });
    const taskA = result.recentTasks.find(t => t.id === taskAId);
    expect(taskA.lastNote).not.toBeNull();
    expect(taskA.lastNote.text).toBe('Progress update');
  });

  it('throws if project not found', async () => {
    await expect(
      getProjectStatus(adapter, { project_id: 'ghost', include_handoff: true })
    ).rejects.toThrow('not found');
  });

  it('reflects completed tasks in status', async () => {
    const { projectId } = await createTestProject();
    const project = adapter.getProject(projectId);
    const roadmap = JSON.parse(project.content);
    const taskAId = roadmap.phases[0].milestones[0].tasks[0].id;
    await updateTaskStatus(adapter, { project_id: projectId, task_id: taskAId, status: 'completed' });

    const result = await getProjectStatus(adapter, { project_id: projectId, include_handoff: true });
    expect(result.completedTasks).toBe(1);
    expect(result.completionPercent).toBe(50);
  });
});

// ---------------------------------------------------------------------------
// scanRepo — size guard
// ---------------------------------------------------------------------------

describe('scanRepo size guard', () => {
  it('does not set truncated when content is small', () => {
    fs.writeFileSync(path.join(tmpDir, 'README.md'), 'Hello world');
    const result = scanRepo({ path: tmpDir });
    expect(result.truncated).toBeUndefined();
    expect(result.keyFiles.length).toBeGreaterThan(0);
  });

  it('sets truncated: true and drops files when content exceeds 200KB', () => {
    // Create many large markdown files to exceed the limit
    for (let i = 0; i < 10; i++) {
      fs.writeFileSync(
        path.join(tmpDir, `doc${i}.md`),
        'x'.repeat(25 * 1024) // 25KB each → 10 files = 250KB
      );
    }
    const result = scanRepo({ path: tmpDir });
    expect(result.truncated).toBe(true);
    // Tree is always returned
    expect(result.tree).toBeTruthy();
    // Some files were dropped
    expect(result.keyFiles.length).toBeLessThan(10);
  });
});

// ---------------------------------------------------------------------------
// adapter — deleteProject and renameProject
// ---------------------------------------------------------------------------

describe('SqliteAdapter new methods', () => {
  it('deleteProject removes the row', () => {
    const { id } = adapter.insertProject('To Delete', '{}');
    adapter.deleteProject(id);
    expect(adapter.getProject(id)).toBeNull();
  });

  it('renameProject updates the title', () => {
    const { id } = adapter.insertProject('Old', '{}');
    const now = new Date().toISOString();
    adapter.renameProject(id, 'New', now);
    expect(adapter.getProject(id).title).toBe('New');
  });
});
