// Integration tests for Phase 7 tools:
// - update_task_status with transactional note
// - set_project_goal
// - add_session_summary
// - get_project_status include_handoff (projectGoal + lastSession)

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { SqliteAdapter } from '../adapters/SqliteAdapter.js';
import { createProject } from '../tools/createProject.js';
import { updateTaskStatus } from '../tools/updateTaskStatus.js';
import { setProjectGoal } from '../tools/setProjectGoal.js';
import { addSessionSummary } from '../tools/addSessionSummary.js';
import { getProjectStatus } from '../tools/getProjectStatus.js';

let tmpDir;
let adapter;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-phase7-'));
  adapter = new SqliteAdapter(path.join(tmpDir, 'db.sqlite'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

async function createTestProject(title = 'ProPlan') {
  return createProject(adapter, {
    title,
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
}

function getTaskId(adapter, projectId, index = 0) {
  const project = adapter.getProject(projectId);
  const roadmap = JSON.parse(project.content);
  return roadmap.phases[0].milestones[0].tasks[index].id;
}

// ---------------------------------------------------------------------------
// update_task_status — transactional note
// ---------------------------------------------------------------------------

describe('updateTaskStatus with note', () => {
  it('updates status and appends note in one write', async () => {
    const { projectId } = await createTestProject();
    const taskId = getTaskId(adapter, projectId);

    const result = await updateTaskStatus(adapter, {
      project_id: projectId,
      task_id: taskId,
      status: 'in_progress',
      note: 'Implementing size guard — truncation logic first',
    });

    expect(result.status).toBe('in_progress');
    expect(result.notes).toHaveLength(1);
    expect(result.notes[0].text).toBe('Implementing size guard — truncation logic first');
  });

  it('truncates note to 150 chars', async () => {
    const { projectId } = await createTestProject();
    const taskId = getTaskId(adapter, projectId);
    const longNote = 'x'.repeat(200);

    const result = await updateTaskStatus(adapter, {
      project_id: projectId,
      task_id: taskId,
      status: 'in_progress',
      note: longNote,
    });

    expect(result.notes[0].text).toHaveLength(150);
  });

  it('works without a note (backward compatible)', async () => {
    const { projectId } = await createTestProject();
    const taskId = getTaskId(adapter, projectId);

    const result = await updateTaskStatus(adapter, {
      project_id: projectId,
      task_id: taskId,
      status: 'completed',
    });

    expect(result.status).toBe('completed');
    expect(result.notes).toBeUndefined();
  });

  it('appends multiple notes across status transitions', async () => {
    const { projectId } = await createTestProject();
    const taskId = getTaskId(adapter, projectId);

    await updateTaskStatus(adapter, {
      project_id: projectId, task_id: taskId,
      status: 'in_progress', note: 'Starting implementation',
    });
    await updateTaskStatus(adapter, {
      project_id: projectId, task_id: taskId,
      status: 'completed', note: 'Done — moving to tests',
    });

    const project = adapter.getProject(projectId);
    const roadmap = JSON.parse(project.content);
    const task = roadmap.phases[0].milestones[0].tasks.find(t => t.id === taskId);
    expect(task.notes).toHaveLength(2);
    expect(task.notes[1].text).toBe('Done — moving to tests');
  });
});

// ---------------------------------------------------------------------------
// setProjectGoal
// ---------------------------------------------------------------------------

describe('setProjectGoal', () => {
  it('sets the goal and returns old/new', async () => {
    const { projectId } = await createTestProject();
    const result = await setProjectGoal(adapter, {
      project_id: projectId,
      goal: 'Building ProPlan — an AI roadmap generator for developers.',
    });
    expect(result.old_goal).toBeNull();
    expect(result.new_goal).toBe('Building ProPlan — an AI roadmap generator for developers.');
  });

  it('persists the goal in the project JSON', async () => {
    const { projectId } = await createTestProject();
    await setProjectGoal(adapter, { project_id: projectId, goal: 'My goal' });
    const project = adapter.getProject(projectId);
    const roadmap = JSON.parse(project.content);
    expect(roadmap.projectGoal).toBe('My goal');
  });

  it('updating the goal returns the old goal', async () => {
    const { projectId } = await createTestProject();
    await setProjectGoal(adapter, { project_id: projectId, goal: 'Old goal' });
    const result = await setProjectGoal(adapter, { project_id: projectId, goal: 'New goal' });
    expect(result.old_goal).toBe('Old goal');
    expect(result.new_goal).toBe('New goal');
  });

  it('throws if project not found', async () => {
    await expect(
      setProjectGoal(adapter, { project_id: 'ghost', goal: 'something' })
    ).rejects.toThrow('not found');
  });

  it('throws if goal is empty', async () => {
    const { projectId } = await createTestProject();
    await expect(
      setProjectGoal(adapter, { project_id: projectId, goal: '' })
    ).rejects.toThrow('goal is required');
  });
});

// ---------------------------------------------------------------------------
// addSessionSummary
// ---------------------------------------------------------------------------

describe('addSessionSummary', () => {
  it('saves a session summary', async () => {
    const { projectId } = await createTestProject();
    const result = await addSessionSummary(adapter, {
      project_id: projectId,
      summary: 'Implemented Phase 7. Added transactional notes and projectGoal anchor. Next: write tests.',
    });
    expect(result.saved).toBe(true);
    expect(result.totalSessions).toBe(1);
    expect(result.summary.summary).toContain('Phase 7');
  });

  it('caps at 10 sessions, dropping oldest', async () => {
    const { projectId } = await createTestProject();
    for (let i = 1; i <= 12; i++) {
      await addSessionSummary(adapter, {
        project_id: projectId,
        summary: `Session ${i} summary`,
      });
    }
    const result = await addSessionSummary(adapter, {
      project_id: projectId,
      summary: 'Session 13',
    });
    expect(result.totalSessions).toBe(10);

    // Oldest sessions (1, 2, 3) should be dropped
    const project = adapter.getProject(projectId);
    const roadmap = JSON.parse(project.content);
    expect(roadmap.sessions[0].summary).toBe('Session 4 summary');
    expect(roadmap.sessions[9].summary).toBe('Session 13');
  });

  it('throws if project not found', async () => {
    await expect(
      addSessionSummary(adapter, { project_id: 'ghost', summary: 'test' })
    ).rejects.toThrow('not found');
  });
});

// ---------------------------------------------------------------------------
// getProjectStatus include_handoff — projectGoal + lastSession
// ---------------------------------------------------------------------------

describe('getProjectStatus include_handoff Phase 7 fields', () => {
  it('returns null projectGoal and lastSession when not set', async () => {
    const { projectId } = await createTestProject();
    const result = await getProjectStatus(adapter, { project_id: projectId, include_handoff: true });
    expect(result.projectGoal).toBeNull();
    expect(result.lastSession).toBeNull();
  });

  it('returns projectGoal after set_project_goal', async () => {
    const { projectId } = await createTestProject();
    await setProjectGoal(adapter, { project_id: projectId, goal: 'Build the best roadmap tool.' });
    const result = await getProjectStatus(adapter, { project_id: projectId, include_handoff: true });
    expect(result.projectGoal).toBe('Build the best roadmap tool.');
  });

  it('returns lastSession after add_session_summary', async () => {
    const { projectId } = await createTestProject();
    await addSessionSummary(adapter, { project_id: projectId, summary: 'First session done.' });
    await addSessionSummary(adapter, { project_id: projectId, summary: 'Second session done.' });
    const result = await getProjectStatus(adapter, { project_id: projectId, include_handoff: true });
    expect(result.lastSession.summary).toBe('Second session done.');
  });

  it('full handoff returns all layers together', async () => {
    const { projectId } = await createTestProject();
    const taskId = getTaskId(adapter, projectId);

    await setProjectGoal(adapter, { project_id: projectId, goal: 'ProPlan north star.' });
    await addSessionSummary(adapter, { project_id: projectId, summary: 'Built Phase 7.' });
    await updateTaskStatus(adapter, {
      project_id: projectId, task_id: taskId,
      status: 'in_progress', note: 'Working on transactional notes',
    });

    const result = await getProjectStatus(adapter, { project_id: projectId, include_handoff: true });

    expect(result.projectGoal).toBe('ProPlan north star.');
    expect(result.lastSession.summary).toBe('Built Phase 7.');
    expect(result.inProgressTasks).toBe(1);
    expect(result.recentTasks[0].status).toBe('in_progress');
    expect(result.recentTasks[0].lastNote.text).toBe('Working on transactional notes');
  });
});
