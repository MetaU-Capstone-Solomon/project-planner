// End-to-end integration tests for all tools running against SqliteAdapter.
// These tests verify the full local-mode stack: create → read → mutate → verify.

import { describe, it, expect, test, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { SqliteAdapter } from '../adapters/SqliteAdapter.js';
import { getProjectStatus } from '../tools/getProjectStatus.js';
import { createProject } from '../tools/createProject.js';
import { getNextTasks } from '../tools/getNextTasks.js';
import { updateTaskStatus } from '../tools/updateTaskStatus.js';
import { addNoteToTask } from '../tools/addNoteToTask.js';
import { getProjectRoadmap } from '../tools/getProjectRoadmap.js';
import { addTask } from '../tools/addTask.js';
import { addMilestone } from '../tools/addMilestone.js';
import { addPhase } from '../tools/addPhase.js';
import { editTask } from '../tools/editTask.js';
import { editMilestone } from '../tools/editMilestone.js';
import { editPhase } from '../tools/editPhase.js';
import { deleteTask } from '../tools/deleteTask.js';
import { deleteMilestone } from '../tools/deleteMilestone.js';
import { deletePhase } from '../tools/deletePhase.js';

let tmpDir;
let adapter;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-integration-'));
  adapter = new SqliteAdapter(path.join(tmpDir, 'db.sqlite'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// Helper — creates a standard test project and returns { projectId, roadmap }
// ---------------------------------------------------------------------------

async function createTestProject() {
  return createProject(adapter, {
    title: 'Test App',
    phases: [{
      title: 'Phase 1',
      milestones: [{
        title: 'Milestone 1',
        tasks: [
          { title: 'Task A', description: 'First task', technology: 'Node.js' },
          { title: 'Task B', description: 'Second task' },
        ],
      }],
    }],
  });
}

// ---------------------------------------------------------------------------
// createProject
// ---------------------------------------------------------------------------

describe('createProject (local)', () => {
  test('creates a project and returns metadata', async () => {
    const result = await createTestProject();
    expect(result.title).toBe('Test App');
    expect(result.phaseCount).toBe(1);
    expect(result.milestoneCount).toBe(1);
    expect(result.taskCount).toBe(2);
    expect(typeof result.projectId).toBe('string');
    expect(result.projectId.length).toBeGreaterThan(0);
  });

  test('all tasks default to pending status', async () => {
    const { projectId } = await createTestProject();
    const roadmap = await getProjectRoadmap(adapter, { project_id: projectId });
    const tasks = roadmap.phases[0].milestones[0].tasks;
    expect(tasks.every(t => t.status === 'pending')).toBe(true);
  });

  test('roadmap has summary field defaulting to empty string', async () => {
    const { projectId } = await createTestProject();
    const roadmap = await getProjectRoadmap(adapter, { project_id: projectId });
    expect(roadmap).toHaveProperty('summary');
    expect(roadmap.summary).toBe('');
  });

  test('tasks do not have a resources field', async () => {
    const { projectId } = await createTestProject();
    const roadmap = await getProjectRoadmap(adapter, { project_id: projectId });
    const tasks = roadmap.phases[0].milestones[0].tasks;
    expect(tasks.every(t => !('resources' in t))).toBe(true);
  });

  test('metadata has scope defaulting to empty string', async () => {
    const { projectId } = await createTestProject();
    const roadmap = await getProjectRoadmap(adapter, { project_id: projectId });
    expect(roadmap.metadata).toHaveProperty('scope');
    expect(roadmap.metadata.scope).toBe('');
  });

  test('metadata has version defaulting to 1.0', async () => {
    const { projectId } = await createTestProject();
    const roadmap = await getProjectRoadmap(adapter, { project_id: projectId });
    expect(roadmap.metadata).toHaveProperty('version');
    expect(roadmap.metadata.version).toBe('1.0');
  });
});

// ---------------------------------------------------------------------------
// getProjectStatus
// ---------------------------------------------------------------------------

describe('getProjectStatus (local)', () => {
  test('returns all projects when no project_id given', async () => {
    await createTestProject();
    const result = await getProjectStatus(adapter, {});
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Test App');
    expect(result[0].totalTasks).toBe(2);
    expect(result[0].completedTasks).toBe(0);
    expect(result[0].completionPercent).toBe(0);
  });

  test('returns single project status by id', async () => {
    const { projectId } = await createTestProject();
    const result = await getProjectStatus(adapter, { project_id: projectId });
    expect(result.completionPercent).toBe(0);
    expect(result.currentPhase).toBe('Phase 1');
    expect(result.totalPhases).toBe(1);
  });

  test('returns empty array with no projects', async () => {
    const result = await getProjectStatus(adapter, {});
    expect(result).toEqual([]);
  });

  test('throws on unknown project_id', async () => {
    await expect(getProjectStatus(adapter, { project_id: 'bad-id' })).rejects.toThrow('not found');
  });
});

// ---------------------------------------------------------------------------
// getNextTasks
// ---------------------------------------------------------------------------

describe('getNextTasks (local)', () => {
  test('returns pending tasks in order', async () => {
    const { projectId } = await createTestProject();
    const result = await getNextTasks(adapter, { project_id: projectId, limit: 5 });
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('Task A');
    expect(result[1].title).toBe('Task B');
    expect(result[0].phaseTitle).toBe('Phase 1');
    expect(result[0].milestoneTitle).toBe('Milestone 1');
  });

  test('respects limit', async () => {
    const { projectId } = await createTestProject();
    const result = await getNextTasks(adapter, { project_id: projectId, limit: 1 });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Task A');
  });

  test('excludes completed tasks', async () => {
    const { projectId } = await createTestProject();
    const tasks = await getNextTasks(adapter, { project_id: projectId, limit: 1 });
    await updateTaskStatus(adapter, { project_id: projectId, task_id: tasks[0].taskId, status: 'completed' });
    const remaining = await getNextTasks(adapter, { project_id: projectId, limit: 5 });
    expect(remaining).toHaveLength(1);
    expect(remaining[0].title).toBe('Task B');
  });
});

// ---------------------------------------------------------------------------
// updateTaskStatus
// ---------------------------------------------------------------------------

describe('updateTaskStatus (local)', () => {
  test('marks a task completed and updates stored data', async () => {
    const { projectId } = await createTestProject();
    const tasks = await getNextTasks(adapter, { project_id: projectId, limit: 1 });
    const taskId = tasks[0].taskId;

    await updateTaskStatus(adapter, { project_id: projectId, task_id: taskId, status: 'completed' });

    const status = await getProjectStatus(adapter, { project_id: projectId });
    expect(status.completedTasks).toBe(1);
    expect(status.completionPercent).toBe(50);
  });

  test('full project completion reaches 100%', async () => {
    const { projectId } = await createTestProject();
    const tasks = await getNextTasks(adapter, { project_id: projectId, limit: 10 });
    for (const task of tasks) {
      await updateTaskStatus(adapter, { project_id: projectId, task_id: task.taskId, status: 'completed' });
    }
    const status = await getProjectStatus(adapter, { project_id: projectId });
    expect(status.completionPercent).toBe(100);
    expect(status.completedTasks).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// addNoteToTask
// ---------------------------------------------------------------------------

describe('addNoteToTask (local)', () => {
  test('attaches a note and persists it', async () => {
    const { projectId } = await createTestProject();
    const tasks = await getNextTasks(adapter, { project_id: projectId, limit: 1 });
    const taskId = tasks[0].taskId;

    await addNoteToTask(adapter, { project_id: projectId, task_id: taskId, note: 'Started scaffolding' });

    const roadmap = await getProjectRoadmap(adapter, { project_id: projectId });
    const task = roadmap.phases[0].milestones[0].tasks.find(t => t.id === taskId);
    expect(task.notes).toHaveLength(1);
    expect(task.notes[0].text).toBe('Started scaffolding');
  });
});

// ---------------------------------------------------------------------------
// addTask (dry_run + apply)
// ---------------------------------------------------------------------------

describe('addTask (local)', () => {
  test('dry_run returns preview without writing', async () => {
    const { projectId } = await createTestProject();
    const roadmap = await getProjectRoadmap(adapter, { project_id: projectId });
    const phaseId = roadmap.phases[0].id;
    const milestoneId = roadmap.phases[0].milestones[0].id;

    const preview = await addTask(adapter, {
      project_id: projectId, phase_id: phaseId, milestone_id: milestoneId,
      title: 'New Task', dry_run: true,
    });
    expect(preview.action).toBe('add_task');

    const status = await getProjectStatus(adapter, { project_id: projectId });
    expect(status.totalTasks).toBe(2); // unchanged
  });

  test('adds a task when dry_run is false', async () => {
    const { projectId } = await createTestProject();
    const roadmap = await getProjectRoadmap(adapter, { project_id: projectId });
    const phaseId = roadmap.phases[0].id;
    const milestoneId = roadmap.phases[0].milestones[0].id;

    await addTask(adapter, {
      project_id: projectId, phase_id: phaseId, milestone_id: milestoneId,
      title: 'New Task', dry_run: false,
    });

    const status = await getProjectStatus(adapter, { project_id: projectId });
    expect(status.totalTasks).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// addMilestone
// ---------------------------------------------------------------------------

describe('addMilestone (local)', () => {
  test('adds a milestone to a phase', async () => {
    const { projectId } = await createTestProject();
    const roadmap = await getProjectRoadmap(adapter, { project_id: projectId });
    const phaseId = roadmap.phases[0].id;

    await addMilestone(adapter, { project_id: projectId, phase_id: phaseId, title: 'New Milestone', dry_run: false });

    const updated = await getProjectRoadmap(adapter, { project_id: projectId });
    expect(updated.phases[0].milestones).toHaveLength(2);
    expect(updated.phases[0].milestones[1].title).toBe('New Milestone');
  });
});

// ---------------------------------------------------------------------------
// addPhase
// ---------------------------------------------------------------------------

describe('addPhase (local)', () => {
  test('adds a phase to the project', async () => {
    const { projectId } = await createTestProject();

    await addPhase(adapter, { project_id: projectId, title: 'Phase 2', dry_run: false });

    const roadmap = await getProjectRoadmap(adapter, { project_id: projectId });
    expect(roadmap.phases).toHaveLength(2);
    expect(roadmap.phases[1].title).toBe('Phase 2');
  });
});

// ---------------------------------------------------------------------------
// editTask / editMilestone / editPhase
// ---------------------------------------------------------------------------

describe('edit tools (local)', () => {
  test('editTask renames a task', async () => {
    const { projectId } = await createTestProject();
    const roadmap = await getProjectRoadmap(adapter, { project_id: projectId });
    const taskId = roadmap.phases[0].milestones[0].tasks[0].id;

    await editTask(adapter, { project_id: projectId, task_id: taskId, title: 'Renamed Task', dry_run: false });

    const updated = await getProjectRoadmap(adapter, { project_id: projectId });
    const task = updated.phases[0].milestones[0].tasks.find(t => t.id === taskId);
    expect(task.title).toBe('Renamed Task');
  });

  test('editMilestone renames a milestone', async () => {
    const { projectId } = await createTestProject();
    const roadmap = await getProjectRoadmap(adapter, { project_id: projectId });
    const milestoneId = roadmap.phases[0].milestones[0].id;

    await editMilestone(adapter, { project_id: projectId, milestone_id: milestoneId, title: 'Renamed Milestone', dry_run: false });

    const updated = await getProjectRoadmap(adapter, { project_id: projectId });
    expect(updated.phases[0].milestones[0].title).toBe('Renamed Milestone');
  });

  test('editPhase renames a phase', async () => {
    const { projectId } = await createTestProject();
    const roadmap = await getProjectRoadmap(adapter, { project_id: projectId });
    const phaseId = roadmap.phases[0].id;

    await editPhase(adapter, { project_id: projectId, phase_id: phaseId, title: 'Renamed Phase', dry_run: false });

    const updated = await getProjectRoadmap(adapter, { project_id: projectId });
    expect(updated.phases[0].title).toBe('Renamed Phase');
  });
});

// ---------------------------------------------------------------------------
// deleteTask / deleteMilestone / deletePhase
// ---------------------------------------------------------------------------

describe('delete tools (local)', () => {
  test('deleteTask removes a task', async () => {
    const { projectId } = await createTestProject();
    const roadmap = await getProjectRoadmap(adapter, { project_id: projectId });
    const taskId = roadmap.phases[0].milestones[0].tasks[0].id;

    const result = await deleteTask(adapter, { project_id: projectId, task_id: taskId, dry_run: false });
    expect(result.deleted).toBe(true);

    const status = await getProjectStatus(adapter, { project_id: projectId });
    expect(status.totalTasks).toBe(1);
  });

  test('deleteMilestone removes a milestone and its tasks', async () => {
    const { projectId } = await createTestProject();
    const roadmap = await getProjectRoadmap(adapter, { project_id: projectId });
    const milestoneId = roadmap.phases[0].milestones[0].id;

    await deleteMilestone(adapter, { project_id: projectId, milestone_id: milestoneId, dry_run: false });

    const updated = await getProjectRoadmap(adapter, { project_id: projectId });
    expect(updated.phases[0].milestones).toHaveLength(0);
  });

  test('deletePhase removes a phase and all its content', async () => {
    const { projectId } = await createTestProject();
    const roadmap = await getProjectRoadmap(adapter, { project_id: projectId });
    const phaseId = roadmap.phases[0].id;

    await deletePhase(adapter, { project_id: projectId, phase_id: phaseId, dry_run: false });

    const updated = await getProjectRoadmap(adapter, { project_id: projectId });
    expect(updated.phases).toHaveLength(0);

    const status = await getProjectStatus(adapter, { project_id: projectId });
    expect(status.totalTasks).toBe(0);
  });
});
