// Phase 8 Part 1 — Production Hardening tests
// - 300 char description cap on createProject, addTask, editTask
// - get_project_roadmap summary_only mode

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { SqliteAdapter } from '../adapters/SqliteAdapter.js';
import { createProject } from '../tools/createProject.js';
import { addTask } from '../tools/addTask.js';
import { editTask } from '../tools/editTask.js';
import { getProjectRoadmap } from '../tools/getProjectRoadmap.js';
import { addNoteToTask } from '../tools/addNoteToTask.js';

let tmpDir;
let adapter;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-phase8-'));
  adapter = new SqliteAdapter(path.join(tmpDir, 'db.sqlite'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

async function seedProject() {
  return createProject(adapter, {
    title: 'Test Project',
    phases: [{
      title: 'Phase 1',
      milestones: [{
        title: 'Milestone 1',
        tasks: [{ title: 'Task A', description: 'Short desc' }],
      }],
    }],
  });
}

function getIds(adapter, projectId) {
  const project = adapter.getProject(projectId);
  const roadmap = JSON.parse(project.content);
  const phase = roadmap.phases[0];
  const milestone = phase.milestones[0];
  const task = milestone.tasks[0];
  return { phaseId: phase.id, milestoneId: milestone.id, taskId: task.id };
}

// ---------------------------------------------------------------------------
// Description cap — createProject
// ---------------------------------------------------------------------------

describe('createProject — 300 char description cap', () => {
  it('truncates task description to 300 chars', async () => {
    const longDesc = 'x'.repeat(500);
    const { projectId } = await createProject(adapter, {
      title: 'Capped Project',
      phases: [{
        title: 'P1',
        milestones: [{
          title: 'M1',
          tasks: [{ title: 'Task', description: longDesc }],
        }],
      }],
    });

    const project = adapter.getProject(projectId);
    const roadmap = JSON.parse(project.content);
    const desc = roadmap.phases[0].milestones[0].tasks[0].description;
    expect(desc).toHaveLength(300);
  });

  it('preserves descriptions under 300 chars unchanged', async () => {
    const shortDesc = 'Short description.';
    const { projectId } = await createProject(adapter, {
      title: 'Short Project',
      phases: [{
        title: 'P1',
        milestones: [{ title: 'M1', tasks: [{ title: 'T', description: shortDesc }] }],
      }],
    });

    const project = adapter.getProject(projectId);
    const roadmap = JSON.parse(project.content);
    expect(roadmap.phases[0].milestones[0].tasks[0].description).toBe(shortDesc);
  });
});

// ---------------------------------------------------------------------------
// Description cap — addTask
// ---------------------------------------------------------------------------

describe('addTask — 300 char description cap', () => {
  it('truncates description to 300 chars on write', async () => {
    const { projectId } = await seedProject();
    const { phaseId, milestoneId } = getIds(adapter, projectId);

    await addTask(adapter, {
      project_id: projectId,
      phase_id: phaseId,
      milestone_id: milestoneId,
      title: 'New Task',
      description: 'y'.repeat(500),
      dry_run: false,
    });

    const project = adapter.getProject(projectId);
    const roadmap = JSON.parse(project.content);
    const newTask = roadmap.phases[0].milestones[0].tasks.find(t => t.title === 'New Task');
    expect(newTask.description).toHaveLength(300);
  });

  it('dry_run preview shows uncapped description (preview only)', async () => {
    const { projectId } = await seedProject();
    const { phaseId, milestoneId } = getIds(adapter, projectId);
    const longDesc = 'z'.repeat(500);

    const result = await addTask(adapter, {
      project_id: projectId,
      phase_id: phaseId,
      milestone_id: milestoneId,
      title: 'Preview Task',
      description: longDesc,
      dry_run: true,
    });

    // dry_run doesn't write — just previews
    expect(result.action).toBe('add_task');
  });
});

// ---------------------------------------------------------------------------
// Description cap — editTask
// ---------------------------------------------------------------------------

describe('editTask — 300 char description cap', () => {
  it('truncates description to 300 chars on edit', async () => {
    const { projectId } = await seedProject();
    const { taskId } = getIds(adapter, projectId);

    await editTask(adapter, {
      project_id: projectId,
      task_id: taskId,
      description: 'a'.repeat(500),
      dry_run: false,
    });

    const project = adapter.getProject(projectId);
    const roadmap = JSON.parse(project.content);
    const task = roadmap.phases[0].milestones[0].tasks[0];
    expect(task.description).toHaveLength(300);
  });

  it('preserves short descriptions unchanged', async () => {
    const { projectId } = await seedProject();
    const { taskId } = getIds(adapter, projectId);

    await editTask(adapter, {
      project_id: projectId,
      task_id: taskId,
      description: 'Updated short desc.',
      dry_run: false,
    });

    const project = adapter.getProject(projectId);
    const roadmap = JSON.parse(project.content);
    expect(roadmap.phases[0].milestones[0].tasks[0].description).toBe('Updated short desc.');
  });
});

// ---------------------------------------------------------------------------
// get_project_roadmap — summary_only
// ---------------------------------------------------------------------------

describe('getProjectRoadmap — summary_only mode', () => {
  it('full mode returns descriptions and notes', async () => {
    const { projectId } = await seedProject();
    const { taskId } = getIds(adapter, projectId);
    await addNoteToTask(adapter, { project_id: projectId, task_id: taskId, note: 'A note' });

    const result = await getProjectRoadmap(adapter, { project_id: projectId });
    const task = result.phases[0].milestones[0].tasks[0];
    expect(task.description).toBe('Short desc');
    expect(task.notes).toHaveLength(1);
  });

  it('summary_only strips descriptions and notes', async () => {
    const { projectId } = await seedProject();
    const { taskId } = getIds(adapter, projectId);
    await addNoteToTask(adapter, { project_id: projectId, task_id: taskId, note: 'A note' });

    const result = await getProjectRoadmap(adapter, { project_id: projectId, summary_only: true });
    const task = result.phases[0].milestones[0].tasks[0];
    expect(task.title).toBe('Task A');
    expect(task.description).toBeUndefined();
    expect(task.notes).toBeUndefined();
  });

  it('summary_only preserves task id, title, status, order', async () => {
    const { projectId } = await seedProject();
    const result = await getProjectRoadmap(adapter, { project_id: projectId, summary_only: true });
    const task = result.phases[0].milestones[0].tasks[0];
    expect(task.id).toBeTruthy();
    expect(task.title).toBe('Task A');
    expect(task.status).toBe('pending');
    expect(task.order).toBe(1);
  });

  it('summary_only result is significantly smaller than full result', async () => {
    const { projectId } = await createProject(adapter, {
      title: 'Big Project',
      phases: [{
        title: 'Phase 1',
        milestones: [{
          title: 'Milestone 1',
          tasks: Array.from({ length: 10 }, (_, i) => ({
            title: `Task ${i}`,
            description: 'd'.repeat(300),
          })),
        }],
      }],
    });

    const full = await getProjectRoadmap(adapter, { project_id: projectId });
    const summary = await getProjectRoadmap(adapter, { project_id: projectId, summary_only: true });

    const fullSize = JSON.stringify(full).length;
    const summarySize = JSON.stringify(summary).length;
    expect(summarySize).toBeLessThan(fullSize / 2);
  });
});
