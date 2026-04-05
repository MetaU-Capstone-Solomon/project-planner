import { addTask } from '../tools/addTask.js';
import { addMilestone } from '../tools/addMilestone.js';
import { addPhase } from '../tools/addPhase.js';
import { editTask } from '../tools/editTask.js';
import { editMilestone } from '../tools/editMilestone.js';
import { editPhase } from '../tools/editPhase.js';

// ---------------------------------------------------------------------------
// Shared helpers (reused across all tasks in this file)
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

// Supports: select chain (read) + update chain (write)
function writeableMock(row) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            single: async () => ({ data: row, error: null })
          })
        })
      }),
      update: () => ({
        eq: () => ({
          eq: () => ({ error: null })
        })
      })
    })
  };
}

// Read-only mock (for dry_run tests that never reach write)
function readOnlyMock(row) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            single: async () => ({ data: row, error: row ? null : { code: 'PGRST116' } })
          })
        })
      })
    })
  };
}

// ---------------------------------------------------------------------------
// addTask
// ---------------------------------------------------------------------------

describe('addTask', () => {
  const phase = makePhase('phase-1', 'Setup', [makeMilestone('m-1', 'Infra', [])]);
  const content = makeContent([phase]);

  test('dry_run returns preview without writing', async () => {
    const mock = readOnlyMock({ id: 'p1', content });
    const result = await addTask(mock, 'user-1', {
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

  test('dry_run=false creates task and writes to DB', async () => {
    const mock = writeableMock({ id: 'p1', content });
    const result = await addTask(mock, 'user-1', {
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
    const mock = writeableMock({ id: 'p1', content: makeContent([phaseWithTasks]) });
    const result = await addTask(mock, 'user-1', {
      project_id: 'p1', phase_id: 'phase-1', milestone_id: 'm-1',
      title: 'New task', dry_run: false
    });
    expect(result.order).toBe(8);
  });

  test('throws when project not found', async () => {
    const mock = readOnlyMock(null);
    await expect(
      addTask(mock, 'user-1', { project_id: 'bad', phase_id: 'p', milestone_id: 'm', title: 'T', dry_run: true })
    ).rejects.toThrow('Project bad not found');
  });

  test('throws when phase not found', async () => {
    const mock = readOnlyMock({ id: 'p1', content: makeContent([]) });
    await expect(
      addTask(mock, 'user-1', { project_id: 'p1', phase_id: 'missing', milestone_id: 'm-1', title: 'T', dry_run: true })
    ).rejects.toThrow('Phase missing not found in project p1');
  });

  test('throws when milestone not found', async () => {
    const mock = readOnlyMock({ id: 'p1', content: makeContent([makePhase('phase-1', 'P', [])]) });
    await expect(
      addTask(mock, 'user-1', { project_id: 'p1', phase_id: 'phase-1', milestone_id: 'missing', title: 'T', dry_run: true })
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
    const mock = readOnlyMock({ id: 'p1', content });
    const result = await addMilestone(mock, 'user-1', {
      project_id: 'p1', phase_id: 'phase-1', title: 'Database', dry_run: true
    });
    expect(result.action).toBe('add_milestone');
    expect(result.preview.id).toBe('(will be generated)');
    expect(result.preview.title).toBe('Database');
    expect(result.target).toContain('Backend');
  });

  test('dry_run=false creates milestone and writes to DB', async () => {
    const mock = writeableMock({ id: 'p1', content });
    const result = await addMilestone(mock, 'user-1', {
      project_id: 'p1', phase_id: 'phase-1', title: 'Database', dry_run: false
    });
    expect(result.id).toMatch(/^milestone-\d+$/);
    expect(result.title).toBe('Database');
    expect(result.tasks).toEqual([]);
    expect(result.order).toBe(2);
  });

  test('throws when phase not found', async () => {
    const mock = readOnlyMock({ id: 'p1', content: makeContent([]) });
    await expect(
      addMilestone(mock, 'user-1', { project_id: 'p1', phase_id: 'nope', title: 'M', dry_run: true })
    ).rejects.toThrow('Phase nope not found in project p1');
  });
});

// ---------------------------------------------------------------------------
// addPhase
// ---------------------------------------------------------------------------

describe('addPhase', () => {
  const content = makeContent([makePhase('phase-1', 'Existing', [])]);

  test('dry_run returns preview without writing', async () => {
    const mock = readOnlyMock({ id: 'p1', content });
    const result = await addPhase(mock, 'user-1', {
      project_id: 'p1', title: 'Deployment', dry_run: true
    });
    expect(result.action).toBe('add_phase');
    expect(result.preview.id).toBe('(will be generated)');
    expect(result.preview.title).toBe('Deployment');
  });

  test('dry_run=false creates phase and writes to DB', async () => {
    const mock = writeableMock({ id: 'p1', content });
    const result = await addPhase(mock, 'user-1', {
      project_id: 'p1', title: 'Deployment', dry_run: false
    });
    expect(result.id).toMatch(/^phase-\d+$/);
    expect(result.title).toBe('Deployment');
    expect(result.milestones).toEqual([]);
    expect(result.order).toBe(2);
  });

  test('first phase gets order 1', async () => {
    const mock = writeableMock({ id: 'p1', content: makeContent([]) });
    const result = await addPhase(mock, 'user-1', {
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
    const mock = readOnlyMock({ id: 'p1', content });
    const result = await editTask(mock, 'user-1', {
      project_id: 'p1', task_id: 'task-1', title: 'New title', dry_run: true
    });
    expect(result.action).toBe('edit_task');
    expect(result.before.title).toBe('Old title');
    expect(result.after.title).toBe('New title');
  });

  test('dry_run=false applies edit and writes to DB', async () => {
    const mock = writeableMock({ id: 'p1', content });
    const result = await editTask(mock, 'user-1', {
      project_id: 'p1', task_id: 'task-1',
      title: 'Updated title', description: 'New desc', technology: 'React',
      dry_run: false
    });
    expect(result.title).toBe('Updated title');
    expect(result.description).toBe('New desc');
    expect(result.technology).toBe('React');
  });

  test('partial update — only provided fields change', async () => {
    const mock = writeableMock({ id: 'p1', content });
    const result = await editTask(mock, 'user-1', {
      project_id: 'p1', task_id: 'task-1', description: 'Only desc changed', dry_run: false
    });
    expect(result.title).toBe('Old title');
    expect(result.description).toBe('Only desc changed');
  });

  test('throws when no fields provided', async () => {
    const mock = readOnlyMock({ id: 'p1', content });
    await expect(
      editTask(mock, 'user-1', { project_id: 'p1', task_id: 'task-1', dry_run: true })
    ).rejects.toThrow('Provide at least one field to update: title, description, technology');
  });

  test('throws when task not found', async () => {
    const mock = readOnlyMock({ id: 'p1', content });
    await expect(
      editTask(mock, 'user-1', { project_id: 'p1', task_id: 'nope', title: 'T', dry_run: true })
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
    const mock = readOnlyMock({ id: 'p1', content });
    const result = await editMilestone(mock, 'user-1', {
      project_id: 'p1', milestone_id: 'm-1', title: 'New MS', dry_run: true
    });
    expect(result.action).toBe('edit_milestone');
    expect(result.before.title).toBe('Old MS');
    expect(result.after.title).toBe('New MS');
  });

  test('dry_run=false applies edit and writes to DB', async () => {
    const mock = writeableMock({ id: 'p1', content });
    const result = await editMilestone(mock, 'user-1', {
      project_id: 'p1', milestone_id: 'm-1', title: 'New MS', dry_run: false
    });
    expect(result.title).toBe('New MS');
  });

  test('throws when milestone not found', async () => {
    const mock = readOnlyMock({ id: 'p1', content });
    await expect(
      editMilestone(mock, 'user-1', { project_id: 'p1', milestone_id: 'nope', title: 'T', dry_run: true })
    ).rejects.toThrow('Milestone nope not found in project p1');
  });
});

// ---------------------------------------------------------------------------
// editPhase
// ---------------------------------------------------------------------------

describe('editPhase', () => {
  const content = makeContent([makePhase('phase-1', 'Old Phase')]);

  test('dry_run returns before/after without writing', async () => {
    const mock = readOnlyMock({ id: 'p1', content });
    const result = await editPhase(mock, 'user-1', {
      project_id: 'p1', phase_id: 'phase-1', title: 'New Phase', dry_run: true
    });
    expect(result.action).toBe('edit_phase');
    expect(result.before.title).toBe('Old Phase');
    expect(result.after.title).toBe('New Phase');
  });

  test('dry_run=false applies edit and writes to DB', async () => {
    const mock = writeableMock({ id: 'p1', content });
    const result = await editPhase(mock, 'user-1', {
      project_id: 'p1', phase_id: 'phase-1', title: 'New Phase', dry_run: false
    });
    expect(result.title).toBe('New Phase');
  });

  test('throws when phase not found', async () => {
    const mock = readOnlyMock({ id: 'p1', content });
    await expect(
      editPhase(mock, 'user-1', { project_id: 'p1', phase_id: 'nope', title: 'T', dry_run: true })
    ).rejects.toThrow('Phase nope not found in project p1');
  });
});
