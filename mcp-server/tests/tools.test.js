import { getProjectStatus } from '../tools/getProjectStatus.js';
import { getNextTasks } from '../tools/getNextTasks.js';
import { updateTaskStatus } from '../tools/updateTaskStatus.js';
import { addNoteToTask } from '../tools/addNoteToTask.js';
import { getProjectRoadmap } from '../tools/getProjectRoadmap.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeContent({ phases = [] } = {}) {
  return JSON.stringify({ projectName: 'Test Project', phases });
}

function makePhase(tasks = [], id = 'phase-1', title = 'Phase 1') {
  return { id, title, order: 1, milestones: [{ id: 'm-1', title: 'M1', order: 1, tasks }] };
}

// Build a two-level mock: first .eq filters on user_id, second .eq filters on id
function singleRowMock(row) {
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

function multiRowMock(rows) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({ data: rows, error: null })
      })
    })
  };
}

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

// ---------------------------------------------------------------------------
// getProjectStatus
// ---------------------------------------------------------------------------

describe('getProjectStatus', () => {
  test('returns summary for all projects when no project_id given', async () => {
    const rows = [
      { id: 'p1', title: 'Alpha', content: makeContent({ phases: [makePhase([{ id: 't1', status: 'completed', order: 1 }, { id: 't2', status: 'pending', order: 2 }])] }) },
      { id: 'p2', title: 'Beta',  content: makeContent({ phases: [makePhase([{ id: 't3', status: 'pending', order: 1 }])] }) },
    ];
    const result = await getProjectStatus(multiRowMock(rows), 'user-1', {});
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('Alpha');
    expect(result[0].totalTasks).toBe(2);
    expect(result[0].completedTasks).toBe(1);
    expect(result[0].completionPercent).toBe(50);
  });

  test('returns detail for a specific project', async () => {
    const content = makeContent({ phases: [makePhase([{ id: 't1', status: 'completed', order: 1 }])] });
    const result = await getProjectStatus(singleRowMock({ id: 'p1', title: 'Alpha', content }), 'user-1', { project_id: 'p1' });
    expect(result.title).toBe('Alpha');
    expect(result.totalTasks).toBe(1);
    expect(result.completedTasks).toBe(1);
    expect(result.completionPercent).toBe(100);
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
    const result = await getNextTasks(singleRowMock({ id: 'p1', title: 'P', content }), 'user-1', { project_id: 'p1', limit: 2 });
    expect(result).toHaveLength(2);
    expect(result[0].taskId).toBe('t2');
    expect(result[0].phaseTitle).toBe('Phase 1');
    expect(result[0].milestoneTitle).toBe('M1');
    expect(result[1].taskId).toBe('t3');
  });

  test('respects default limit of 5', async () => {
    const tasks = Array.from({ length: 8 }, (_, i) => ({ id: `t${i}`, title: `Task ${i}`, status: 'pending', order: i }));
    const content = makeContent({ phases: [makePhase(tasks)] });
    const result = await getNextTasks(singleRowMock({ id: 'p1', title: 'P', content }), 'user-1', { project_id: 'p1' });
    expect(result).toHaveLength(5);
  });
});

// ---------------------------------------------------------------------------
// updateTaskStatus
// ---------------------------------------------------------------------------

describe('updateTaskStatus', () => {
  test('updates task status and writes back to DB', async () => {
    const content = makeContent({ phases: [makePhase([{ id: 'task-abc', title: 'Do thing', status: 'pending', order: 1 }])] });
    const mock = writeableMock({ id: 'p1', content });
    const result = await updateTaskStatus(mock, 'user-1', { project_id: 'p1', task_id: 'task-abc', status: 'completed' });
    expect(result.id).toBe('task-abc');
    expect(result.status).toBe('completed');
  });

  test('throws when task not found', async () => {
    const content = makeContent({ phases: [] });
    const mock = writeableMock({ id: 'p1', content });
    await expect(
      updateTaskStatus(mock, 'user-1', { project_id: 'p1', task_id: 'missing', status: 'completed' })
    ).rejects.toThrow('Task missing not found');
  });

  test('throws on invalid status', async () => {
    const content = makeContent({ phases: [] });
    const mock = singleRowMock({ id: 'p1', content });
    await expect(
      updateTaskStatus(mock, 'user-1', { project_id: 'p1', task_id: 't1', status: 'done' })
    ).rejects.toThrow('Invalid status');
  });
});

// ---------------------------------------------------------------------------
// addNoteToTask
// ---------------------------------------------------------------------------

describe('addNoteToTask', () => {
  test('appends note to task notes array', async () => {
    const content = makeContent({ phases: [makePhase([{ id: 't1', title: 'T', status: 'in_progress', order: 1 }])] });
    const mock = writeableMock({ id: 'p1', content });
    const result = await addNoteToTask(mock, 'user-1', { project_id: 'p1', task_id: 't1', note: 'Scaffolding done' });
    expect(result.notes).toHaveLength(1);
    expect(result.notes[0].text).toBe('Scaffolding done');
    expect(result.notes[0].createdAt).toBeDefined();
  });

  test('appends to existing notes without overwriting', async () => {
    const content = makeContent({ phases: [makePhase([{ id: 't1', title: 'T', status: 'pending', order: 1, notes: [{ text: 'first', createdAt: '2026-01-01T00:00:00Z' }] }])] });
    const mock = writeableMock({ id: 'p1', content });
    const result = await addNoteToTask(mock, 'user-1', { project_id: 'p1', task_id: 't1', note: 'second' });
    expect(result.notes).toHaveLength(2);
  });

  test('throws on empty note', async () => {
    const mock = singleRowMock(null);
    await expect(
      addNoteToTask(mock, 'user-1', { project_id: 'p1', task_id: 't1', note: '  ' })
    ).rejects.toThrow('Note text is required');
  });
});

// ---------------------------------------------------------------------------
// getProjectRoadmap
// ---------------------------------------------------------------------------

describe('getProjectRoadmap', () => {
  test('returns parsed roadmap content', async () => {
    const roadmapObj = { projectName: 'My App', phases: [] };
    const content = JSON.stringify(roadmapObj);
    const result = await getProjectRoadmap(singleRowMock({ id: 'p1', title: 'My App', content }), 'user-1', { project_id: 'p1' });
    expect(result.projectName).toBe('My App');
    expect(result.phases).toEqual([]);
  });

  test('throws when project not found', async () => {
    await expect(
      getProjectRoadmap(singleRowMock(null), 'user-1', { project_id: 'nope' })
    ).rejects.toThrow('Project nope not found');
  });
});
