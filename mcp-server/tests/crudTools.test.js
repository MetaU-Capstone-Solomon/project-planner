import { describe, it, expect, test, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { SqliteAdapter } from '../adapters/SqliteAdapter.js';
import { addTask } from '../tools/addTask.js';
import { addMilestone } from '../tools/addMilestone.js';
import { addPhase } from '../tools/addPhase.js';
import { editTask } from '../tools/editTask.js';
import { editMilestone } from '../tools/editMilestone.js';
import { editPhase } from '../tools/editPhase.js';
import { deleteTask } from '../tools/deleteTask.js';
import { deleteMilestone } from '../tools/deleteMilestone.js';
import { deletePhase } from '../tools/deletePhase.js';
import { createProject } from '../tools/createProject.js';

// ---------------------------------------------------------------------------
// Shared setup
// ---------------------------------------------------------------------------

let tmpDir;
let adapter;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-crud-'));
  adapter = new SqliteAdapter(path.join(tmpDir, 'db.sqlite'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function seedProject(id, title, content) {
  const now = new Date().toISOString();
  adapter._db.prepare(
    'INSERT INTO projects (id, user_id, title, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, 'local', title, content, now, now);
}

// ---------------------------------------------------------------------------
// Shared helpers (content builders)
// ---------------------------------------------------------------------------

function makeContent(phases = []) {
  return JSON.stringify({ projectName: 'Test Project', phases });
}

function makePhase(id, title, milestones = []) {
  return { id, title, order: 1, milestones };
}

function makeMilestone(id, title, tasks = []) {
  return { id, title, order: 1, tasks };
}

function makeTask(id, title, status = 'pending') {
  return { id, title, status, order: 1 };
}

// ---------------------------------------------------------------------------
// addTask
// ---------------------------------------------------------------------------

describe('addTask', () => {
  const phase = makePhase('phase-1', 'Setup', [makeMilestone('m-1', 'Infra', [])]);
  const content = makeContent([phase]);

  test('dry_run returns preview without writing', async () => {
    seedProject('p1', 'Test', content);
    const result = await addTask(adapter, {
      project_id: 'p1', phase_id: 'phase-1', milestone_id: 'm-1',
      title: 'Add CI pipeline', dry_run: true
    });
    expect(result.action).toBe('add_task');
    expect(result.preview.id).toBe('(will be generated)');
    expect(result.preview.title).toBe('Add CI pipeline');
    expect(result.preview.status).toBe('pending');
    expect(result.target).toContain('Infra');
    expect(result.target).toContain('Setup');
  });

  test('dry_run=false creates task and persists', async () => {
    seedProject('p1', 'Test', content);
    const result = await addTask(adapter, {
      project_id: 'p1', phase_id: 'phase-1', milestone_id: 'm-1',
      title: 'Add CI pipeline', description: 'GitHub Actions', technology: 'GitHub Actions',
      dry_run: false
    });
    expect(result.id).toMatch(/^task-\d+$/);
    expect(result.title).toBe('Add CI pipeline');
    expect(result.status).toBe('pending');
    expect(result.description).toBe('GitHub Actions');
    expect(result.technology).toBe('GitHub Actions');
  });

  test('appends at end — order is max+1', async () => {
    const phaseWithTasks = makePhase('phase-1', 'Setup', [
      makeMilestone('m-1', 'Infra', [
        { id: 'task-a', title: 'A', status: 'pending', order: 3 },
        { id: 'task-b', title: 'B', status: 'pending', order: 7 },
      ])
    ]);
    seedProject('p1', 'Test', makeContent([phaseWithTasks]));
    const result = await addTask(adapter, {
      project_id: 'p1', phase_id: 'phase-1', milestone_id: 'm-1',
      title: 'New task', dry_run: false
    });
    expect(result.order).toBe(8);
  });

  test('throws when project not found', async () => {
    await expect(
      addTask(adapter, { project_id: 'bad', phase_id: 'p', milestone_id: 'm', title: 'T', dry_run: true })
    ).rejects.toThrow('Project bad not found');
  });

  test('throws when phase not found', async () => {
    seedProject('p1', 'Test', makeContent([]));
    await expect(
      addTask(adapter, { project_id: 'p1', phase_id: 'missing', milestone_id: 'm-1', title: 'T', dry_run: true })
    ).rejects.toThrow('Phase missing not found in project p1');
  });

  test('throws when milestone not found', async () => {
    seedProject('p1', 'Test', makeContent([makePhase('phase-1', 'P', [])]));
    await expect(
      addTask(adapter, { project_id: 'p1', phase_id: 'phase-1', milestone_id: 'missing', title: 'T', dry_run: true })
    ).rejects.toThrow('Milestone missing not found in project p1');
  });
});

// ---------------------------------------------------------------------------
// addMilestone
// ---------------------------------------------------------------------------

describe('addMilestone', () => {
  const phase = makePhase('phase-1', 'Backend', [makeMilestone('m-1', 'Auth', [])]);
  const content = makeContent([phase]);

  test('dry_run returns preview without writing', async () => {
    seedProject('p1', 'Test', content);
    const result = await addMilestone(adapter, {
      project_id: 'p1', phase_id: 'phase-1', title: 'Database', dry_run: true
    });
    expect(result.action).toBe('add_milestone');
    expect(result.preview.id).toBe('(will be generated)');
    expect(result.preview.title).toBe('Database');
    expect(result.target).toContain('Backend');
  });

  test('dry_run=false creates milestone and persists', async () => {
    seedProject('p1', 'Test', content);
    const result = await addMilestone(adapter, {
      project_id: 'p1', phase_id: 'phase-1', title: 'Database', dry_run: false
    });
    expect(result.id).toMatch(/^milestone-\d+$/);
    expect(result.title).toBe('Database');
    expect(result.tasks).toEqual([]);
    expect(result.order).toBe(2);
  });

  test('throws when phase not found', async () => {
    seedProject('p1', 'Test', makeContent([]));
    await expect(
      addMilestone(adapter, { project_id: 'p1', phase_id: 'nope', title: 'M', dry_run: true })
    ).rejects.toThrow('Phase nope not found in project p1');
  });
});

// ---------------------------------------------------------------------------
// addPhase
// ---------------------------------------------------------------------------

describe('addPhase', () => {
  const content = makeContent([makePhase('phase-1', 'Existing', [])]);

  test('dry_run returns preview without writing', async () => {
    seedProject('p1', 'Test', content);
    const result = await addPhase(adapter, {
      project_id: 'p1', title: 'Deployment', dry_run: true
    });
    expect(result.action).toBe('add_phase');
    expect(result.preview.id).toBe('(will be generated)');
    expect(result.preview.title).toBe('Deployment');
  });

  test('dry_run=false creates phase and persists', async () => {
    seedProject('p1', 'Test', content);
    const result = await addPhase(adapter, {
      project_id: 'p1', title: 'Deployment', dry_run: false
    });
    expect(result.id).toMatch(/^phase-\d+$/);
    expect(result.title).toBe('Deployment');
    expect(result.milestones).toEqual([]);
    expect(result.order).toBe(2);
  });

  test('first phase gets order 1', async () => {
    seedProject('p1', 'Test', makeContent([]));
    const result = await addPhase(adapter, {
      project_id: 'p1', title: 'Phase One', dry_run: false
    });
    expect(result.order).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// editTask
// ---------------------------------------------------------------------------

describe('editTask', () => {
  const task = makeTask('task-1', 'Old title');
  const phase = makePhase('phase-1', 'Phase A', [makeMilestone('m-1', 'MS A', [task])]);
  const content = makeContent([phase]);

  test('dry_run returns before/after without writing', async () => {
    seedProject('p1', 'Test', content);
    const result = await editTask(adapter, {
      project_id: 'p1', task_id: 'task-1', title: 'New title', dry_run: true
    });
    expect(result.action).toBe('edit_task');
    expect(result.before.title).toBe('Old title');
    expect(result.after.title).toBe('New title');
  });

  test('dry_run=false applies edit and persists', async () => {
    seedProject('p1', 'Test', content);
    const result = await editTask(adapter, {
      project_id: 'p1', task_id: 'task-1',
      title: 'Updated title', description: 'New desc', technology: 'React',
      dry_run: false
    });
    expect(result.title).toBe('Updated title');
    expect(result.description).toBe('New desc');
    expect(result.technology).toBe('React');
  });

  test('partial update — only provided fields change', async () => {
    seedProject('p1', 'Test', content);
    const result = await editTask(adapter, {
      project_id: 'p1', task_id: 'task-1', description: 'Only desc changed', dry_run: false
    });
    expect(result.title).toBe('Old title');
    expect(result.description).toBe('Only desc changed');
  });

  test('throws when no fields provided', async () => {
    seedProject('p1', 'Test', content);
    await expect(
      editTask(adapter, { project_id: 'p1', task_id: 'task-1', dry_run: true })
    ).rejects.toThrow('Provide at least one field to update: title, description, technology');
  });

  test('throws when task not found', async () => {
    seedProject('p1', 'Test', content);
    await expect(
      editTask(adapter, { project_id: 'p1', task_id: 'nope', title: 'T', dry_run: true })
    ).rejects.toThrow('Task nope not found in project p1');
  });
});

// ---------------------------------------------------------------------------
// editMilestone
// ---------------------------------------------------------------------------

describe('editMilestone', () => {
  const phase = makePhase('phase-1', 'Phase A', [makeMilestone('m-1', 'Old MS')]);
  const content = makeContent([phase]);

  test('dry_run returns before/after without writing', async () => {
    seedProject('p1', 'Test', content);
    const result = await editMilestone(adapter, {
      project_id: 'p1', milestone_id: 'm-1', title: 'New MS', dry_run: true
    });
    expect(result.action).toBe('edit_milestone');
    expect(result.before.title).toBe('Old MS');
    expect(result.after.title).toBe('New MS');
  });

  test('dry_run=false applies edit and persists', async () => {
    seedProject('p1', 'Test', content);
    const result = await editMilestone(adapter, {
      project_id: 'p1', milestone_id: 'm-1', title: 'New MS', dry_run: false
    });
    expect(result.title).toBe('New MS');
  });

  test('throws when milestone not found', async () => {
    seedProject('p1', 'Test', content);
    await expect(
      editMilestone(adapter, { project_id: 'p1', milestone_id: 'nope', title: 'T', dry_run: true })
    ).rejects.toThrow('Milestone nope not found in project p1');
  });
});

// ---------------------------------------------------------------------------
// editPhase
// ---------------------------------------------------------------------------

describe('editPhase', () => {
  const content = makeContent([makePhase('phase-1', 'Old Phase')]);

  test('dry_run returns before/after without writing', async () => {
    seedProject('p1', 'Test', content);
    const result = await editPhase(adapter, {
      project_id: 'p1', phase_id: 'phase-1', title: 'New Phase', dry_run: true
    });
    expect(result.action).toBe('edit_phase');
    expect(result.before.title).toBe('Old Phase');
    expect(result.after.title).toBe('New Phase');
  });

  test('dry_run=false applies edit and persists', async () => {
    seedProject('p1', 'Test', content);
    const result = await editPhase(adapter, {
      project_id: 'p1', phase_id: 'phase-1', title: 'New Phase', dry_run: false
    });
    expect(result.title).toBe('New Phase');
  });

  test('throws when phase not found', async () => {
    seedProject('p1', 'Test', content);
    await expect(
      editPhase(adapter, { project_id: 'p1', phase_id: 'nope', title: 'T', dry_run: true })
    ).rejects.toThrow('Phase nope not found in project p1');
  });
});

// ---------------------------------------------------------------------------
// deleteTask
// ---------------------------------------------------------------------------

describe('deleteTask', () => {
  const task = makeTask('task-1', 'Build auth');
  const phase = makePhase('phase-1', 'Phase A', [makeMilestone('m-1', 'MS A', [task])]);
  const content = makeContent([phase]);

  test('dry_run returns item + warning without writing', async () => {
    seedProject('p1', 'Test', content);
    const result = await deleteTask(adapter, {
      project_id: 'p1', task_id: 'task-1', dry_run: true
    });
    expect(result.action).toBe('delete_task');
    expect(result.item.id).toBe('task-1');
    expect(result.item.title).toBe('Build auth');
    expect(result.warning).toContain('permanently delete 1 task');
    expect(result.warning).toContain('cannot be undone');
  });

  test('dry_run=false removes task and persists', async () => {
    seedProject('p1', 'Test', content);
    const result = await deleteTask(adapter, {
      project_id: 'p1', task_id: 'task-1', dry_run: false
    });
    expect(result.deleted).toBe(true);
    expect(result.id).toBe('task-1');
  });

  test('throws when task not found', async () => {
    seedProject('p1', 'Test', content);
    await expect(
      deleteTask(adapter, { project_id: 'p1', task_id: 'nope', dry_run: true })
    ).rejects.toThrow('Task nope not found in project p1');
  });
});

// ---------------------------------------------------------------------------
// deleteMilestone
// ---------------------------------------------------------------------------

describe('deleteMilestone', () => {
  const tasks = [makeTask('t1', 'T1'), makeTask('t2', 'T2'), makeTask('t3', 'T3')];
  const phase = makePhase('phase-1', 'Phase A', [makeMilestone('m-1', 'Big MS', tasks)]);
  const content = makeContent([phase]);

  test('dry_run returns item + warning with task count', async () => {
    seedProject('p1', 'Test', content);
    const result = await deleteMilestone(adapter, {
      project_id: 'p1', milestone_id: 'm-1', dry_run: true
    });
    expect(result.action).toBe('delete_milestone');
    expect(result.item.id).toBe('m-1');
    expect(result.warning).toContain('1 milestone');
    expect(result.warning).toContain('3 tasks');
    expect(result.warning).toContain('cannot be undone');
  });

  test('dry_run=false removes milestone and persists', async () => {
    seedProject('p1', 'Test', content);
    const result = await deleteMilestone(adapter, {
      project_id: 'p1', milestone_id: 'm-1', dry_run: false
    });
    expect(result.deleted).toBe(true);
    expect(result.id).toBe('m-1');
  });

  test('throws when milestone not found', async () => {
    seedProject('p1', 'Test', content);
    await expect(
      deleteMilestone(adapter, { project_id: 'p1', milestone_id: 'nope', dry_run: true })
    ).rejects.toThrow('Milestone nope not found in project p1');
  });
});

// ---------------------------------------------------------------------------
// deletePhase
// ---------------------------------------------------------------------------

describe('deletePhase', () => {
  const phase = makePhase('phase-1', 'Big Phase', [
    makeMilestone('m-1', 'MS 1', [makeTask('t1', 'T1'), makeTask('t2', 'T2')]),
    makeMilestone('m-2', 'MS 2', [makeTask('t3', 'T3')]),
  ]);
  const content = makeContent([phase]);

  test('dry_run returns item + warning with milestone + task counts', async () => {
    seedProject('p1', 'Test', content);
    const result = await deletePhase(adapter, {
      project_id: 'p1', phase_id: 'phase-1', dry_run: true
    });
    expect(result.action).toBe('delete_phase');
    expect(result.item.id).toBe('phase-1');
    expect(result.warning).toContain('1 phase');
    expect(result.warning).toContain('2 milestones');
    expect(result.warning).toContain('3 tasks');
    expect(result.warning).toContain('cannot be undone');
  });

  test('dry_run=false removes phase and persists', async () => {
    seedProject('p1', 'Test', content);
    const result = await deletePhase(adapter, {
      project_id: 'p1', phase_id: 'phase-1', dry_run: false
    });
    expect(result.deleted).toBe(true);
    expect(result.id).toBe('phase-1');
  });

  test('throws when phase not found', async () => {
    seedProject('p1', 'Test', content);
    await expect(
      deletePhase(adapter, { project_id: 'p1', phase_id: 'nope', dry_run: true })
    ).rejects.toThrow('Phase nope not found in project p1');
  });
});

// ---------------------------------------------------------------------------
// createProject
// ---------------------------------------------------------------------------

describe('createProject', () => {
  const minimalInput = {
    title: 'My New App',
    phases: [
      {
        title: 'Phase 1',
        milestones: [
          {
            title: 'Milestone 1',
            tasks: [
              { title: 'Task 1', description: 'First task', technology: 'Node.js' }
            ]
          }
        ]
      }
    ]
  };

  test('inserts project and returns summary counts', async () => {
    const result = await createProject(adapter, minimalInput);
    expect(typeof result.projectId).toBe('string');
    expect(result.title).toBe('My New App');
    expect(result.phaseCount).toBe(1);
    expect(result.milestoneCount).toBe(1);
    expect(result.taskCount).toBe(1);
  });

  test('returns correct counts for multi-phase input', async () => {
    const input = {
      title: 'Multi-phase',
      phases: [
        { title: 'P1', milestones: [{ title: 'M1', tasks: [{ title: 'T1' }, { title: 'T2' }] }] },
        { title: 'P2', milestones: [{ title: 'M2', tasks: [{ title: 'T3' }] }] },
      ]
    };
    const result = await createProject(adapter, input);
    expect(result.phaseCount).toBe(2);
    expect(result.milestoneCount).toBe(2);
    expect(result.taskCount).toBe(3);
  });

  test('throws when phases array is empty', async () => {
    await expect(
      createProject(adapter, { title: 'Empty', phases: [] })
    ).rejects.toThrow('Project must have at least one phase');
  });

  test('project is retrievable after creation', async () => {
    const { projectId } = await createProject(adapter, minimalInput);
    const project = adapter.getProject(projectId);
    expect(project).not.toBeNull();
    expect(project.title).toBe('My New App');
  });
});
