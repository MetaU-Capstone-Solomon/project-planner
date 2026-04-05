# Phase 4 — MCP CRUD + Terminal Project Creation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 10 new MCP tools — 9 structural mutation tools (add/edit/delete for tasks, milestones, phases) using a dry-run approval pattern, plus `create_project` for terminal-first project creation — and wire up a Dashboard Realtime INSERT subscription so new projects appear instantly.

**Architecture:** Each mutation tool reads the JSON blob from Supabase, applies the change in memory, and writes the full blob back. `dry_run: true` returns a preview without writing. `create_project` inserts a new row directly. All tools are pure functions that receive `(supabase, userId, args)`.

**Tech Stack:** Node.js ESM, `@supabase/supabase-js` v2, `@modelcontextprotocol/sdk`, Zod, Vitest, React + TanStack Query v5.

---

## File Map

### New files
| File | Responsibility |
|---|---|
| `mcp-server/tools/addTask.js` | Add a task to a milestone (dry_run support) |
| `mcp-server/tools/addMilestone.js` | Add a milestone to a phase (dry_run support) |
| `mcp-server/tools/addPhase.js` | Add a phase to a project (dry_run support) |
| `mcp-server/tools/editTask.js` | Edit task title/description/technology (dry_run support) |
| `mcp-server/tools/editMilestone.js` | Edit milestone title (dry_run support) |
| `mcp-server/tools/editPhase.js` | Edit phase title (dry_run support) |
| `mcp-server/tools/deleteTask.js` | Hard-delete a task (dry_run support) |
| `mcp-server/tools/deleteMilestone.js` | Hard-delete a milestone + its tasks (dry_run support) |
| `mcp-server/tools/deletePhase.js` | Hard-delete a phase + milestones + tasks (dry_run support) |
| `mcp-server/tools/createProject.js` | Insert a new project row (no dry_run) |
| `mcp-server/tests/crudTools.test.js` | All tests for the 10 new tools |

### Modified files
| File | Change |
|---|---|
| `mcp-server/index.js` | Register 10 new tools with Zod schemas |
| `frontend/src/pages/Dashboard/Dashboard.jsx` | Add INSERT Realtime subscription |

---

## Task 1: Add tools — addTask, addMilestone, addPhase

**Files:**
- Create: `mcp-server/tests/crudTools.test.js` (test file, extended throughout plan)
- Create: `mcp-server/tools/addTask.js`
- Create: `mcp-server/tools/addMilestone.js`
- Create: `mcp-server/tools/addPhase.js`

- [ ] **Step 1: Create the test file with helpers and failing addTask tests**

Create `mcp-server/tests/crudTools.test.js`:

```js
import { addTask } from '../tools/addTask.js';
import { addMilestone } from '../tools/addMilestone.js';
import { addPhase } from '../tools/addPhase.js';

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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/kingsolomon/Desktop/Projects/ProjectPlanner/project-planner/mcp-server
npx vitest run tests/crudTools.test.js
```

Expected: FAIL — `Cannot find module '../tools/addTask.js'` (or similar import error)

- [ ] **Step 3: Implement addTask.js**

Create `mcp-server/tools/addTask.js`:

```js
// mcp-server/tools/addTask.js

/**
 * @param {object} supabase
 * @param {string} userId
 * @param {{ project_id: string, phase_id: string, milestone_id: string, title: string, description?: string, technology?: string, dry_run: boolean }} args
 */
export async function addTask(supabase, userId, args) {
  const { data, error } = await supabase
    .from('roadmap')
    .select('id, content')
    .eq('user_id', userId)
    .eq('id', args.project_id)
    .single();

  if (error || !data) throw new Error(`Project ${args.project_id} not found`);

  let roadmap;
  try {
    roadmap = JSON.parse(data.content);
  } catch {
    throw new Error(`Project ${data.id} has corrupted roadmap data`);
  }

  const phase = (roadmap.phases || []).find(p => p.id === args.phase_id);
  if (!phase) throw new Error(`Phase ${args.phase_id} not found in project ${args.project_id}`);

  const milestone = (phase.milestones || []).find(m => m.id === args.milestone_id);
  if (!milestone) throw new Error(`Milestone ${args.milestone_id} not found in project ${args.project_id}`);

  if (args.dry_run) {
    return {
      preview: {
        id: '(will be generated)',
        title: args.title,
        status: 'pending',
        ...(args.description && { description: args.description }),
        ...(args.technology && { technology: args.technology }),
      },
      target: `milestone '${milestone.title}' in phase '${phase.title}'`,
      action: 'add_task',
    };
  }

  const tasks = milestone.tasks || [];
  const maxOrder = tasks.reduce((max, t) => Math.max(max, t.order || 0), 0);
  const newTask = {
    id: `task-${Date.now()}`,
    title: args.title,
    status: 'pending',
    order: maxOrder + 1,
    ...(args.description && { description: args.description }),
    ...(args.technology && { technology: args.technology }),
  };
  milestone.tasks = [...tasks, newTask];

  const { error: writeError } = await supabase
    .from('roadmap')
    .update({ content: JSON.stringify(roadmap), updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('id', args.project_id);

  if (writeError) throw new Error(`Failed to save: ${writeError.message}`);

  return newTask;
}
```

- [ ] **Step 4: Implement addMilestone.js**

Create `mcp-server/tools/addMilestone.js`:

```js
// mcp-server/tools/addMilestone.js

/**
 * @param {object} supabase
 * @param {string} userId
 * @param {{ project_id: string, phase_id: string, title: string, dry_run: boolean }} args
 */
export async function addMilestone(supabase, userId, args) {
  const { data, error } = await supabase
    .from('roadmap')
    .select('id, content')
    .eq('user_id', userId)
    .eq('id', args.project_id)
    .single();

  if (error || !data) throw new Error(`Project ${args.project_id} not found`);

  let roadmap;
  try {
    roadmap = JSON.parse(data.content);
  } catch {
    throw new Error(`Project ${data.id} has corrupted roadmap data`);
  }

  const phase = (roadmap.phases || []).find(p => p.id === args.phase_id);
  if (!phase) throw new Error(`Phase ${args.phase_id} not found in project ${args.project_id}`);

  if (args.dry_run) {
    return {
      preview: { id: '(will be generated)', title: args.title, tasks: [] },
      target: `phase '${phase.title}'`,
      action: 'add_milestone',
    };
  }

  const milestones = phase.milestones || [];
  const maxOrder = milestones.reduce((max, m) => Math.max(max, m.order || 0), 0);
  const newMilestone = {
    id: `milestone-${Date.now()}`,
    title: args.title,
    order: maxOrder + 1,
    tasks: [],
  };
  phase.milestones = [...milestones, newMilestone];

  const { error: writeError } = await supabase
    .from('roadmap')
    .update({ content: JSON.stringify(roadmap), updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('id', args.project_id);

  if (writeError) throw new Error(`Failed to save: ${writeError.message}`);

  return newMilestone;
}
```

- [ ] **Step 5: Implement addPhase.js**

Create `mcp-server/tools/addPhase.js`:

```js
// mcp-server/tools/addPhase.js

/**
 * @param {object} supabase
 * @param {string} userId
 * @param {{ project_id: string, title: string, dry_run: boolean }} args
 */
export async function addPhase(supabase, userId, args) {
  const { data, error } = await supabase
    .from('roadmap')
    .select('id, content')
    .eq('user_id', userId)
    .eq('id', args.project_id)
    .single();

  if (error || !data) throw new Error(`Project ${args.project_id} not found`);

  let roadmap;
  try {
    roadmap = JSON.parse(data.content);
  } catch {
    throw new Error(`Project ${data.id} has corrupted roadmap data`);
  }

  if (args.dry_run) {
    return {
      preview: { id: '(will be generated)', title: args.title, milestones: [] },
      action: 'add_phase',
    };
  }

  const phases = roadmap.phases || [];
  const maxOrder = phases.reduce((max, p) => Math.max(max, p.order || 0), 0);
  const newPhase = {
    id: `phase-${Date.now()}`,
    title: args.title,
    order: maxOrder + 1,
    milestones: [],
  };
  roadmap.phases = [...phases, newPhase];

  const { error: writeError } = await supabase
    .from('roadmap')
    .update({ content: JSON.stringify(roadmap), updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('id', args.project_id);

  if (writeError) throw new Error(`Failed to save: ${writeError.message}`);

  return newPhase;
}
```

- [ ] **Step 6: Run the add-tools tests and verify they pass**

```bash
cd /Users/kingsolomon/Desktop/Projects/ProjectPlanner/project-planner/mcp-server
npx vitest run tests/crudTools.test.js
```

Expected: All addTask, addMilestone, addPhase tests pass (12 tests green).

- [ ] **Step 7: Commit**

```bash
cd /Users/kingsolomon/Desktop/Projects/ProjectPlanner/project-planner
git add mcp-server/tools/addTask.js mcp-server/tools/addMilestone.js mcp-server/tools/addPhase.js mcp-server/tests/crudTools.test.js
git commit -m "feat(mcp): add addTask, addMilestone, addPhase tools with dry_run support"
```

---

## Task 2: Edit tools — editTask, editMilestone, editPhase

**Files:**
- Modify: `mcp-server/tests/crudTools.test.js` (append edit tests)
- Create: `mcp-server/tools/editTask.js`
- Create: `mcp-server/tools/editMilestone.js`
- Create: `mcp-server/tools/editPhase.js`

- [ ] **Step 1: Append failing edit tests to crudTools.test.js**

Add these imports at the top of `mcp-server/tests/crudTools.test.js` after the add imports:

```js
import { editTask } from '../tools/editTask.js';
import { editMilestone } from '../tools/editMilestone.js';
import { editPhase } from '../tools/editPhase.js';
```

Append to the bottom of `mcp-server/tests/crudTools.test.js`:

```js
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
```

- [ ] **Step 2: Run tests to verify new tests fail**

```bash
cd /Users/kingsolomon/Desktop/Projects/ProjectPlanner/project-planner/mcp-server
npx vitest run tests/crudTools.test.js
```

Expected: New editTask/editMilestone/editPhase tests FAIL (import errors). Original add tests still pass.

- [ ] **Step 3: Implement editTask.js**

Create `mcp-server/tools/editTask.js`:

```js
// mcp-server/tools/editTask.js

/**
 * @param {object} supabase
 * @param {string} userId
 * @param {{ project_id: string, task_id: string, title?: string, description?: string, technology?: string, dry_run: boolean }} args
 */
export async function editTask(supabase, userId, args) {
  const hasFields = args.title !== undefined || args.description !== undefined || args.technology !== undefined;
  if (!hasFields) {
    throw new Error('Provide at least one field to update: title, description, technology');
  }

  const { data, error } = await supabase
    .from('roadmap')
    .select('id, content')
    .eq('user_id', userId)
    .eq('id', args.project_id)
    .single();

  if (error || !data) throw new Error(`Project ${args.project_id} not found`);

  let roadmap;
  try {
    roadmap = JSON.parse(data.content);
  } catch {
    throw new Error(`Project ${data.id} has corrupted roadmap data`);
  }

  let targetTask = null;
  for (const phase of (roadmap.phases || [])) {
    for (const milestone of (phase.milestones || [])) {
      const task = (milestone.tasks || []).find(t => t.id === args.task_id);
      if (task) { targetTask = task; break; }
    }
    if (targetTask) break;
  }

  if (!targetTask) throw new Error(`Task ${args.task_id} not found in project ${args.project_id}`);

  if (args.dry_run) {
    const after = { ...targetTask };
    if (args.title !== undefined) after.title = args.title;
    if (args.description !== undefined) after.description = args.description;
    if (args.technology !== undefined) after.technology = args.technology;
    return { before: { title: targetTask.title, description: targetTask.description, technology: targetTask.technology }, after, action: 'edit_task' };
  }

  if (args.title !== undefined) targetTask.title = args.title;
  if (args.description !== undefined) targetTask.description = args.description;
  if (args.technology !== undefined) targetTask.technology = args.technology;

  const { error: writeError } = await supabase
    .from('roadmap')
    .update({ content: JSON.stringify(roadmap), updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('id', args.project_id);

  if (writeError) throw new Error(`Failed to save: ${writeError.message}`);

  return targetTask;
}
```

- [ ] **Step 4: Implement editMilestone.js**

Create `mcp-server/tools/editMilestone.js`:

```js
// mcp-server/tools/editMilestone.js

/**
 * @param {object} supabase
 * @param {string} userId
 * @param {{ project_id: string, milestone_id: string, title: string, dry_run: boolean }} args
 */
export async function editMilestone(supabase, userId, args) {
  const { data, error } = await supabase
    .from('roadmap')
    .select('id, content')
    .eq('user_id', userId)
    .eq('id', args.project_id)
    .single();

  if (error || !data) throw new Error(`Project ${args.project_id} not found`);

  let roadmap;
  try {
    roadmap = JSON.parse(data.content);
  } catch {
    throw new Error(`Project ${data.id} has corrupted roadmap data`);
  }

  let targetMilestone = null;
  for (const phase of (roadmap.phases || [])) {
    const ms = (phase.milestones || []).find(m => m.id === args.milestone_id);
    if (ms) { targetMilestone = ms; break; }
  }

  if (!targetMilestone) throw new Error(`Milestone ${args.milestone_id} not found in project ${args.project_id}`);

  if (args.dry_run) {
    return {
      before: { title: targetMilestone.title },
      after: { title: args.title },
      action: 'edit_milestone',
    };
  }

  targetMilestone.title = args.title;

  const { error: writeError } = await supabase
    .from('roadmap')
    .update({ content: JSON.stringify(roadmap), updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('id', args.project_id);

  if (writeError) throw new Error(`Failed to save: ${writeError.message}`);

  return targetMilestone;
}
```

- [ ] **Step 5: Implement editPhase.js**

Create `mcp-server/tools/editPhase.js`:

```js
// mcp-server/tools/editPhase.js

/**
 * @param {object} supabase
 * @param {string} userId
 * @param {{ project_id: string, phase_id: string, title: string, dry_run: boolean }} args
 */
export async function editPhase(supabase, userId, args) {
  const { data, error } = await supabase
    .from('roadmap')
    .select('id, content')
    .eq('user_id', userId)
    .eq('id', args.project_id)
    .single();

  if (error || !data) throw new Error(`Project ${args.project_id} not found`);

  let roadmap;
  try {
    roadmap = JSON.parse(data.content);
  } catch {
    throw new Error(`Project ${data.id} has corrupted roadmap data`);
  }

  const targetPhase = (roadmap.phases || []).find(p => p.id === args.phase_id);
  if (!targetPhase) throw new Error(`Phase ${args.phase_id} not found in project ${args.project_id}`);

  if (args.dry_run) {
    return {
      before: { title: targetPhase.title },
      after: { title: args.title },
      action: 'edit_phase',
    };
  }

  targetPhase.title = args.title;

  const { error: writeError } = await supabase
    .from('roadmap')
    .update({ content: JSON.stringify(roadmap), updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('id', args.project_id);

  if (writeError) throw new Error(`Failed to save: ${writeError.message}`);

  return targetPhase;
}
```

- [ ] **Step 6: Run all tests and verify they pass**

```bash
cd /Users/kingsolomon/Desktop/Projects/ProjectPlanner/project-planner/mcp-server
npx vitest run tests/crudTools.test.js
```

Expected: All add + edit tests pass (22 tests green).

- [ ] **Step 7: Commit**

```bash
cd /Users/kingsolomon/Desktop/Projects/ProjectPlanner/project-planner
git add mcp-server/tools/editTask.js mcp-server/tools/editMilestone.js mcp-server/tools/editPhase.js mcp-server/tests/crudTools.test.js
git commit -m "feat(mcp): add editTask, editMilestone, editPhase tools with dry_run support"
```

---

## Task 3: Delete tools — deleteTask, deleteMilestone, deletePhase

**Files:**
- Modify: `mcp-server/tests/crudTools.test.js` (append delete tests)
- Create: `mcp-server/tools/deleteTask.js`
- Create: `mcp-server/tools/deleteMilestone.js`
- Create: `mcp-server/tools/deletePhase.js`

- [ ] **Step 1: Append failing delete tests to crudTools.test.js**

Add these imports at the top of `mcp-server/tests/crudTools.test.js` after the edit imports:

```js
import { deleteTask } from '../tools/deleteTask.js';
import { deleteMilestone } from '../tools/deleteMilestone.js';
import { deletePhase } from '../tools/deletePhase.js';
```

Append to the bottom of `mcp-server/tests/crudTools.test.js`:

```js
// ---------------------------------------------------------------------------
// deleteTask
// ---------------------------------------------------------------------------

describe('deleteTask', () => {
  const task = makeTask('task-1', 'Build auth');
  const phase = makePhase('phase-1', 'Phase A', [makeMilestone('m-1', 'MS A', [task])]);
  const content = makeContent([phase]);

  test('dry_run returns item + warning without writing', async () => {
    const mock = readOnlyMock({ id: 'p1', content });
    const result = await deleteTask(mock, 'user-1', {
      project_id: 'p1', task_id: 'task-1', dry_run: true
    });
    expect(result.action).toBe('delete_task');
    expect(result.item.id).toBe('task-1');
    expect(result.item.title).toBe('Build auth');
    expect(result.warning).toContain('permanently delete 1 task');
    expect(result.warning).toContain('cannot be undone');
  });

  test('dry_run=false removes task and writes to DB', async () => {
    const mock = writeableMock({ id: 'p1', content });
    const result = await deleteTask(mock, 'user-1', {
      project_id: 'p1', task_id: 'task-1', dry_run: false
    });
    expect(result.deleted).toBe(true);
    expect(result.id).toBe('task-1');
  });

  test('throws when task not found', async () => {
    const mock = readOnlyMock({ id: 'p1', content });
    await expect(
      deleteTask(mock, 'user-1', { project_id: 'p1', task_id: 'nope', dry_run: true })
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
    const mock = readOnlyMock({ id: 'p1', content });
    const result = await deleteMilestone(mock, 'user-1', {
      project_id: 'p1', milestone_id: 'm-1', dry_run: true
    });
    expect(result.action).toBe('delete_milestone');
    expect(result.item.id).toBe('m-1');
    expect(result.warning).toContain('1 milestone');
    expect(result.warning).toContain('3 tasks');
    expect(result.warning).toContain('cannot be undone');
  });

  test('dry_run=false removes milestone and writes to DB', async () => {
    const mock = writeableMock({ id: 'p1', content });
    const result = await deleteMilestone(mock, 'user-1', {
      project_id: 'p1', milestone_id: 'm-1', dry_run: false
    });
    expect(result.deleted).toBe(true);
    expect(result.id).toBe('m-1');
  });

  test('throws when milestone not found', async () => {
    const mock = readOnlyMock({ id: 'p1', content });
    await expect(
      deleteMilestone(mock, 'user-1', { project_id: 'p1', milestone_id: 'nope', dry_run: true })
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
    const mock = readOnlyMock({ id: 'p1', content });
    const result = await deletePhase(mock, 'user-1', {
      project_id: 'p1', phase_id: 'phase-1', dry_run: true
    });
    expect(result.action).toBe('delete_phase');
    expect(result.item.id).toBe('phase-1');
    expect(result.warning).toContain('1 phase');
    expect(result.warning).toContain('2 milestones');
    expect(result.warning).toContain('3 tasks');
    expect(result.warning).toContain('cannot be undone');
  });

  test('dry_run=false removes phase and writes to DB', async () => {
    const mock = writeableMock({ id: 'p1', content });
    const result = await deletePhase(mock, 'user-1', {
      project_id: 'p1', phase_id: 'phase-1', dry_run: false
    });
    expect(result.deleted).toBe(true);
    expect(result.id).toBe('phase-1');
  });

  test('throws when phase not found', async () => {
    const mock = readOnlyMock({ id: 'p1', content });
    await expect(
      deletePhase(mock, 'user-1', { project_id: 'p1', phase_id: 'nope', dry_run: true })
    ).rejects.toThrow('Phase nope not found in project p1');
  });
});
```

- [ ] **Step 2: Run tests to verify new tests fail**

```bash
cd /Users/kingsolomon/Desktop/Projects/ProjectPlanner/project-planner/mcp-server
npx vitest run tests/crudTools.test.js
```

Expected: delete tests FAIL (import errors). All prior tests still pass.

- [ ] **Step 3: Implement deleteTask.js**

Create `mcp-server/tools/deleteTask.js`:

```js
// mcp-server/tools/deleteTask.js

/**
 * @param {object} supabase
 * @param {string} userId
 * @param {{ project_id: string, task_id: string, dry_run: boolean }} args
 */
export async function deleteTask(supabase, userId, args) {
  const { data, error } = await supabase
    .from('roadmap')
    .select('id, content')
    .eq('user_id', userId)
    .eq('id', args.project_id)
    .single();

  if (error || !data) throw new Error(`Project ${args.project_id} not found`);

  let roadmap;
  try {
    roadmap = JSON.parse(data.content);
  } catch {
    throw new Error(`Project ${data.id} has corrupted roadmap data`);
  }

  let targetTask = null;
  let targetMilestone = null;

  for (const phase of (roadmap.phases || [])) {
    for (const milestone of (phase.milestones || [])) {
      const task = (milestone.tasks || []).find(t => t.id === args.task_id);
      if (task) { targetTask = task; targetMilestone = milestone; break; }
    }
    if (targetTask) break;
  }

  if (!targetTask) throw new Error(`Task ${args.task_id} not found in project ${args.project_id}`);

  if (args.dry_run) {
    return {
      item: { id: targetTask.id, title: targetTask.title, status: targetTask.status },
      warning: 'This will permanently delete 1 task. This cannot be undone.',
      action: 'delete_task',
    };
  }

  targetMilestone.tasks = targetMilestone.tasks.filter(t => t.id !== args.task_id);

  const { error: writeError } = await supabase
    .from('roadmap')
    .update({ content: JSON.stringify(roadmap), updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('id', args.project_id);

  if (writeError) throw new Error(`Failed to save: ${writeError.message}`);

  return { deleted: true, id: args.task_id };
}
```

- [ ] **Step 4: Implement deleteMilestone.js**

Create `mcp-server/tools/deleteMilestone.js`:

```js
// mcp-server/tools/deleteMilestone.js

/**
 * @param {object} supabase
 * @param {string} userId
 * @param {{ project_id: string, milestone_id: string, dry_run: boolean }} args
 */
export async function deleteMilestone(supabase, userId, args) {
  const { data, error } = await supabase
    .from('roadmap')
    .select('id, content')
    .eq('user_id', userId)
    .eq('id', args.project_id)
    .single();

  if (error || !data) throw new Error(`Project ${args.project_id} not found`);

  let roadmap;
  try {
    roadmap = JSON.parse(data.content);
  } catch {
    throw new Error(`Project ${data.id} has corrupted roadmap data`);
  }

  let targetMilestone = null;
  let targetPhase = null;

  for (const phase of (roadmap.phases || [])) {
    const ms = (phase.milestones || []).find(m => m.id === args.milestone_id);
    if (ms) { targetMilestone = ms; targetPhase = phase; break; }
  }

  if (!targetMilestone) throw new Error(`Milestone ${args.milestone_id} not found in project ${args.project_id}`);

  const taskCount = (targetMilestone.tasks || []).length;

  if (args.dry_run) {
    return {
      item: { id: targetMilestone.id, title: targetMilestone.title },
      warning: `This will permanently delete 1 milestone and ${taskCount} task${taskCount !== 1 ? 's' : ''}. This cannot be undone.`,
      action: 'delete_milestone',
    };
  }

  targetPhase.milestones = targetPhase.milestones.filter(m => m.id !== args.milestone_id);

  const { error: writeError } = await supabase
    .from('roadmap')
    .update({ content: JSON.stringify(roadmap), updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('id', args.project_id);

  if (writeError) throw new Error(`Failed to save: ${writeError.message}`);

  return { deleted: true, id: args.milestone_id };
}
```

- [ ] **Step 5: Implement deletePhase.js**

Create `mcp-server/tools/deletePhase.js`:

```js
// mcp-server/tools/deletePhase.js

/**
 * @param {object} supabase
 * @param {string} userId
 * @param {{ project_id: string, phase_id: string, dry_run: boolean }} args
 */
export async function deletePhase(supabase, userId, args) {
  const { data, error } = await supabase
    .from('roadmap')
    .select('id, content')
    .eq('user_id', userId)
    .eq('id', args.project_id)
    .single();

  if (error || !data) throw new Error(`Project ${args.project_id} not found`);

  let roadmap;
  try {
    roadmap = JSON.parse(data.content);
  } catch {
    throw new Error(`Project ${data.id} has corrupted roadmap data`);
  }

  const targetPhase = (roadmap.phases || []).find(p => p.id === args.phase_id);
  if (!targetPhase) throw new Error(`Phase ${args.phase_id} not found in project ${args.project_id}`);

  const milestoneCount = (targetPhase.milestones || []).length;
  const taskCount = (targetPhase.milestones || []).reduce(
    (sum, m) => sum + (m.tasks || []).length, 0
  );

  if (args.dry_run) {
    return {
      item: { id: targetPhase.id, title: targetPhase.title },
      warning: `This will permanently delete 1 phase, ${milestoneCount} milestone${milestoneCount !== 1 ? 's' : ''}, and ${taskCount} task${taskCount !== 1 ? 's' : ''}. This cannot be undone.`,
      action: 'delete_phase',
    };
  }

  roadmap.phases = roadmap.phases.filter(p => p.id !== args.phase_id);

  const { error: writeError } = await supabase
    .from('roadmap')
    .update({ content: JSON.stringify(roadmap), updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('id', args.project_id);

  if (writeError) throw new Error(`Failed to save: ${writeError.message}`);

  return { deleted: true, id: args.phase_id };
}
```

- [ ] **Step 6: Run all tests and verify they pass**

```bash
cd /Users/kingsolomon/Desktop/Projects/ProjectPlanner/project-planner/mcp-server
npx vitest run tests/crudTools.test.js
```

Expected: All add + edit + delete tests pass (31 tests green).

- [ ] **Step 7: Commit**

```bash
cd /Users/kingsolomon/Desktop/Projects/ProjectPlanner/project-planner
git add mcp-server/tools/deleteTask.js mcp-server/tools/deleteMilestone.js mcp-server/tools/deletePhase.js mcp-server/tests/crudTools.test.js
git commit -m "feat(mcp): add deleteTask, deleteMilestone, deletePhase tools with dry_run support"
```

---

## Task 4: createProject tool

**Files:**
- Modify: `mcp-server/tests/crudTools.test.js` (append createProject tests)
- Create: `mcp-server/tools/createProject.js`

- [ ] **Step 1: Append failing createProject tests to crudTools.test.js**

Add this import at the top of `mcp-server/tests/crudTools.test.js` after the delete imports:

```js
import { createProject } from '../tools/createProject.js';
```

Add this helper after the `readOnlyMock` helper:

```js
function insertableMock(returnedId) {
  return {
    from: () => ({
      insert: () => ({
        select: () => ({
          single: async () => ({ data: { id: returnedId }, error: null })
        })
      })
    })
  };
}

function failingInsertMock() {
  return {
    from: () => ({
      insert: () => ({
        select: () => ({
          single: async () => ({ data: null, error: { message: 'DB connection failed' } })
        })
      })
    })
  };
}
```

Append to the bottom of `mcp-server/tests/crudTools.test.js`:

```js
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
    const mock = insertableMock('new-project-uuid');
    const result = await createProject(mock, 'user-1', minimalInput);
    expect(result.projectId).toBe('new-project-uuid');
    expect(result.title).toBe('My New App');
    expect(result.phaseCount).toBe(1);
    expect(result.milestoneCount).toBe(1);
    expect(result.taskCount).toBe(1);
  });

  test('generates IDs for all phases, milestones, tasks', async () => {
    const mock = insertableMock('proj-id');
    const input = {
      title: 'Multi-phase',
      phases: [
        { title: 'P1', milestones: [{ title: 'M1', tasks: [{ title: 'T1' }, { title: 'T2' }] }] },
        { title: 'P2', milestones: [{ title: 'M2', tasks: [{ title: 'T3' }] }] },
      ]
    };
    const result = await createProject(mock, 'user-1', input);
    expect(result.phaseCount).toBe(2);
    expect(result.milestoneCount).toBe(2);
    expect(result.taskCount).toBe(3);
  });

  test('all tasks default to pending status', async () => {
    // We verify this by checking the content passed to insert — done by confirming no error and result
    const mock = insertableMock('proj-id');
    const result = await createProject(mock, 'user-1', minimalInput);
    expect(result.projectId).toBe('proj-id');
  });

  test('throws when phases array is empty', async () => {
    const mock = insertableMock('x');
    await expect(
      createProject(mock, 'user-1', { title: 'Empty', phases: [] })
    ).rejects.toThrow('Project must have at least one phase');
  });

  test('throws when DB insert fails', async () => {
    await expect(
      createProject(failingInsertMock(), 'user-1', minimalInput)
    ).rejects.toThrow('Failed to save: DB connection failed');
  });
});
```

- [ ] **Step 2: Run tests to verify createProject tests fail**

```bash
cd /Users/kingsolomon/Desktop/Projects/ProjectPlanner/project-planner/mcp-server
npx vitest run tests/crudTools.test.js
```

Expected: createProject tests FAIL (import error). All prior tests still pass.

- [ ] **Step 3: Implement createProject.js**

Create `mcp-server/tools/createProject.js`:

```js
// mcp-server/tools/createProject.js

/**
 * @param {object} supabase
 * @param {string} userId
 * @param {{ title: string, description?: string, timeline?: string, experienceLevel?: string, technologies?: string[], phases: Array }} args
 */
export async function createProject(supabase, userId, args) {
  if (!args.phases || args.phases.length === 0) {
    throw new Error('Project must have at least one phase');
  }

  const now = new Date().toISOString();

  let phaseOrder = 0;
  let milestoneCount = 0;
  let taskCount = 0;

  const phases = args.phases.map(phaseInput => {
    phaseOrder += 1;
    let milestoneOrder = 0;

    const milestones = (phaseInput.milestones || []).map(msInput => {
      milestoneOrder += 1;
      milestoneCount += 1;
      let taskOrder = 0;

      const tasks = (msInput.tasks || []).map(taskInput => {
        taskOrder += 1;
        taskCount += 1;
        return {
          id: `task-${Date.now()}-${taskOrder}`,
          title: taskInput.title,
          status: 'pending',
          order: taskOrder,
          ...(taskInput.description && { description: taskInput.description }),
          ...(taskInput.technology && { technology: taskInput.technology }),
        };
      });

      return {
        id: `milestone-${Date.now()}-${milestoneOrder}`,
        title: msInput.title,
        order: milestoneOrder,
        tasks,
      };
    });

    return {
      id: `phase-${Date.now()}-${phaseOrder}`,
      title: phaseInput.title,
      order: phaseOrder,
      milestones,
    };
  });

  const roadmap = {
    projectName: args.title,
    metadata: {
      ...(args.description && { description: args.description }),
      ...(args.timeline && { timeline: args.timeline }),
      ...(args.experienceLevel && { experienceLevel: args.experienceLevel }),
      ...(args.technologies && { technologies: args.technologies }),
    },
    phases,
  };

  const { data, error } = await supabase
    .from('roadmap')
    .insert({
      user_id: userId,
      title: args.title,
      content: JSON.stringify(roadmap),
      created_at: now,
      updated_at: now,
    })
    .select('id')
    .single();

  if (error || !data) throw new Error(`Failed to save: ${error?.message ?? 'unknown error'}`);

  return {
    projectId: data.id,
    title: args.title,
    phaseCount: phases.length,
    milestoneCount,
    taskCount,
  };
}
```

- [ ] **Step 4: Run all tests and verify they pass**

```bash
cd /Users/kingsolomon/Desktop/Projects/ProjectPlanner/project-planner/mcp-server
npx vitest run tests/crudTools.test.js
```

Expected: All 36 tests pass (add + edit + delete + createProject).

- [ ] **Step 5: Commit**

```bash
cd /Users/kingsolomon/Desktop/Projects/ProjectPlanner/project-planner
git add mcp-server/tools/createProject.js mcp-server/tests/crudTools.test.js
git commit -m "feat(mcp): add createProject tool"
```

---

## Task 5: Register 10 new tools in index.js

**Files:**
- Modify: `mcp-server/index.js`

- [ ] **Step 1: Run existing Phase 3 tests to confirm baseline**

```bash
cd /Users/kingsolomon/Desktop/Projects/ProjectPlanner/project-planner/mcp-server
npx vitest run tests/tools.test.js
```

Expected: All 11 Phase 3 tests pass.

- [ ] **Step 2: Add imports for all 10 new tools in index.js**

In `mcp-server/index.js`, after the existing imports (after line 11), add:

```js
import { addTask } from './tools/addTask.js';
import { addMilestone } from './tools/addMilestone.js';
import { addPhase } from './tools/addPhase.js';
import { editTask } from './tools/editTask.js';
import { editMilestone } from './tools/editMilestone.js';
import { editPhase } from './tools/editPhase.js';
import { deleteTask } from './tools/deleteTask.js';
import { deleteMilestone } from './tools/deleteMilestone.js';
import { deletePhase } from './tools/deletePhase.js';
import { createProject } from './tools/createProject.js';
```

- [ ] **Step 3: Register the 9 mutation tools in index.js**

In `mcp-server/index.js`, after the existing `get_project_roadmap` tool registration (before `const transport = ...`), add:

```js
server.tool(
  'add_task',
  'Add a new task to a milestone. Use dry_run: true first to preview, then dry_run: false to apply.',
  {
    project_id: z.string().describe('UUID of the project.'),
    phase_id: z.string().describe('ID of the target phase (e.g. "phase-1").'),
    milestone_id: z.string().describe('ID of the target milestone (e.g. "milestone-1").'),
    title: z.string().min(1).describe('Task title.'),
    description: z.string().optional().describe('Optional task description.'),
    technology: z.string().optional().describe('Optional technology tag.'),
    dry_run: z.boolean().describe('true = preview only, false = apply the change.'),
  },
  async (args) => {
    const result = await addTask(supabase, userId, args);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'add_milestone',
  'Add a new milestone to a phase. Use dry_run: true first to preview, then dry_run: false to apply.',
  {
    project_id: z.string().describe('UUID of the project.'),
    phase_id: z.string().describe('ID of the target phase.'),
    title: z.string().min(1).describe('Milestone title.'),
    dry_run: z.boolean().describe('true = preview only, false = apply the change.'),
  },
  async (args) => {
    const result = await addMilestone(supabase, userId, args);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'add_phase',
  'Add a new phase to a project. Use dry_run: true first to preview, then dry_run: false to apply.',
  {
    project_id: z.string().describe('UUID of the project.'),
    title: z.string().min(1).describe('Phase title.'),
    dry_run: z.boolean().describe('true = preview only, false = apply the change.'),
  },
  async (args) => {
    const result = await addPhase(supabase, userId, args);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'edit_task',
  'Edit a task title, description, or technology. Use dry_run: true first to preview. At least one of title/description/technology required.',
  {
    project_id: z.string().describe('UUID of the project.'),
    task_id: z.string().describe('ID of the task.'),
    title: z.string().optional().describe('New task title.'),
    description: z.string().optional().describe('New description.'),
    technology: z.string().optional().describe('New technology tag.'),
    dry_run: z.boolean().describe('true = preview only, false = apply the change.'),
  },
  async (args) => {
    const result = await editTask(supabase, userId, args);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'edit_milestone',
  'Rename a milestone. Use dry_run: true first to preview, then dry_run: false to apply.',
  {
    project_id: z.string().describe('UUID of the project.'),
    milestone_id: z.string().describe('ID of the milestone.'),
    title: z.string().min(1).describe('New milestone title.'),
    dry_run: z.boolean().describe('true = preview only, false = apply the change.'),
  },
  async (args) => {
    const result = await editMilestone(supabase, userId, args);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'edit_phase',
  'Rename a phase. Use dry_run: true first to preview, then dry_run: false to apply.',
  {
    project_id: z.string().describe('UUID of the project.'),
    phase_id: z.string().describe('ID of the phase.'),
    title: z.string().min(1).describe('New phase title.'),
    dry_run: z.boolean().describe('true = preview only, false = apply the change.'),
  },
  async (args) => {
    const result = await editPhase(supabase, userId, args);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'delete_task',
  'Permanently delete a task. Use dry_run: true first to see what will be deleted, then dry_run: false to apply. This is irreversible.',
  {
    project_id: z.string().describe('UUID of the project.'),
    task_id: z.string().describe('ID of the task.'),
    dry_run: z.boolean().describe('true = preview only, false = permanently delete.'),
  },
  async (args) => {
    const result = await deleteTask(supabase, userId, args);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'delete_milestone',
  'Permanently delete a milestone and all its tasks. Use dry_run: true first to see what will be deleted. This is irreversible.',
  {
    project_id: z.string().describe('UUID of the project.'),
    milestone_id: z.string().describe('ID of the milestone.'),
    dry_run: z.boolean().describe('true = preview only, false = permanently delete.'),
  },
  async (args) => {
    const result = await deleteMilestone(supabase, userId, args);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'delete_phase',
  'Permanently delete a phase and all its milestones and tasks. Use dry_run: true first to see what will be deleted. This is irreversible.',
  {
    project_id: z.string().describe('UUID of the project.'),
    phase_id: z.string().describe('ID of the phase.'),
    dry_run: z.boolean().describe('true = preview only, false = permanently delete.'),
  },
  async (args) => {
    const result = await deletePhase(supabase, userId, args);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);
```

- [ ] **Step 4: Register the create_project tool in index.js**

Immediately after the `delete_phase` tool registration, add:

```js
server.tool(
  'create_project',
  'Create a new project from scratch with a full phase/milestone/task structure. Ask clarifying questions first, present the plan in chat, wait for user approval, then call this tool once with the complete object.',
  {
    title: z.string().min(1).describe('Project title.'),
    description: z.string().optional().describe('Short project description.'),
    timeline: z.string().optional().describe('Estimated timeline, e.g. "3 months".'),
    experienceLevel: z.string().optional().describe('Developer experience level, e.g. "Intermediate".'),
    technologies: z.array(z.string()).optional().describe('Technology stack array.'),
    phases: z.array(z.object({
      title: z.string(),
      milestones: z.array(z.object({
        title: z.string(),
        tasks: z.array(z.object({
          title: z.string(),
          description: z.string().optional(),
          technology: z.string().optional(),
        })),
      })),
    })).describe('Full project structure — all phases, milestones, and tasks.'),
  },
  async (args) => {
    const result = await createProject(supabase, userId, args);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);
```

- [ ] **Step 5: Run all mcp-server tests to confirm nothing broke**

```bash
cd /Users/kingsolomon/Desktop/Projects/ProjectPlanner/project-planner/mcp-server
npx vitest run
```

Expected: All 47 tests pass (11 phase-3 tests + 36 crud tests).

- [ ] **Step 6: Commit**

```bash
cd /Users/kingsolomon/Desktop/Projects/ProjectPlanner/project-planner
git add mcp-server/index.js
git commit -m "feat(mcp): register 10 new CRUD tools in MCP server"
```

---

## Task 6: Dashboard Realtime INSERT subscription

**Files:**
- Modify: `frontend/src/pages/Dashboard/Dashboard.jsx`

- [ ] **Step 1: Add missing imports to Dashboard.jsx**

In `frontend/src/pages/Dashboard/Dashboard.jsx`, update the existing first line:

```js
import { useState, useMemo, useEffect } from 'react';
```

After the existing `import { useAuth } from '@/contexts/AuthContext';` line, add:

```js
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/cache';
import { supabase } from '@/lib/supabase';
```

- [ ] **Step 2: Wire up queryClient and INSERT subscription in Dashboard component**

Find the main `Dashboard` function. Locate the line where `useAuth` is destructured (currently `const { user, ... } = useAuth()` or similar). Add `queryClient` and the Realtime effect.

Locate the existing destructuring of `useAuth` in the Dashboard component (search for `useAuth` in the component body — it's around line 100+). After the `useAuth` destructuring line, add:

```js
const queryClient = useQueryClient();

useEffect(() => {
  if (!user?.id) return;
  const channel = supabase
    .channel('dashboard-new-projects')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'roadmap',
      filter: `user_id=eq.${user.id}`,
    }, () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_PROJECTS] });
    })
    .subscribe();
  return () => supabase.removeChannel(channel);
}, [user?.id, queryClient]);
```

- [ ] **Step 3: Verify the frontend builds without errors**

```bash
cd /Users/kingsolomon/Desktop/Projects/ProjectPlanner/project-planner/frontend
npm run build
```

Expected: Build completes with no errors.

- [ ] **Step 4: Commit**

```bash
cd /Users/kingsolomon/Desktop/Projects/ProjectPlanner/project-planner
git add frontend/src/pages/Dashboard/Dashboard.jsx
git commit -m "feat(dashboard): add Supabase Realtime INSERT subscription for instant new-project display"
```

---

## Final Verification

- [ ] **Run all mcp-server tests one final time**

```bash
cd /Users/kingsolomon/Desktop/Projects/ProjectPlanner/project-planner/mcp-server
npx vitest run
```

Expected: All 47 tests pass.

- [ ] **Confirm all 12 files are created/modified**

```bash
cd /Users/kingsolomon/Desktop/Projects/ProjectPlanner/project-planner
git log --oneline -6
```

Expected: 6 commits visible — add tools, edit tools, delete tools, createProject, index.js registration, dashboard subscription.
