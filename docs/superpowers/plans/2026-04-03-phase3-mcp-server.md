# Phase 3 — MCP Server Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone MCP server that exposes Project Planner data as five Claude Code tools, authenticated via a Personal Access Token generated in Settings, with live frontend updates via Supabase Realtime.

**Architecture:** Standalone `mcp-server/` ESM package (separate from the Express backend) that connects directly to Supabase using the service role key. PAT validation happens once on startup. Each tool function accepts `(supabase, userId, args)` for clean testability. Frontend gains a Realtime subscription that invalidates React Query when the MCP server mutates data.

**Tech Stack:** `@modelcontextprotocol/sdk` ^1.0, `@supabase/supabase-js` ^2, `zod` ^3 (mcp-server); Express + CJS (backend PAT routes); React + Supabase JS v2 Realtime (frontend).

**Node.js requirement:** The `mcp-server` uses ESM with top-level `await`. Requires **Node.js 14.8+**. Recommended: Node 18 LTS or 20 LTS.

---

## File Map

### New files
- `backend/migrations/add-mcp-tokens.sql` — creates `mcp_tokens` table + RLS
- `mcp-server/package.json` — ESM package, declares dependencies
- `mcp-server/supabase.js` — creates and exports the Supabase client from env vars
- `mcp-server/auth.js` — `validatePat(supabase, token)` → `userId`
- `mcp-server/tools/getProjectStatus.js` — tool implementation
- `mcp-server/tools/getNextTasks.js` — tool implementation
- `mcp-server/tools/updateTaskStatus.js` — tool implementation
- `mcp-server/tools/addNoteToTask.js` — tool implementation
- `mcp-server/tools/getProjectRoadmap.js` — tool implementation
- `mcp-server/index.js` — wires all tools into McpServer, starts stdio transport
- `mcp-server/tests/auth.test.js` — PAT validation unit tests
- `mcp-server/tests/tools.test.js` — all five tool unit tests (mocked Supabase)
- `backend/tests/mcpToken.test.js` — token format unit test

### Modified files
- `backend/routes/user.js` — add `POST /mcp-token`, `DELETE /mcp-token`, `GET /mcp-token/status`
- `frontend/src/config/api.js` — add `MCP_TOKEN`, `MCP_TOKEN_STATUS` endpoints
- `frontend/src/components/McpStatusBadge/McpStatusBadge.jsx` — show connected/disconnected based on status API
- `frontend/src/pages/Settings/SettingsPage.jsx` — add Claude Code Integration section
- `frontend/src/pages/ProjectDetail/ProjectDetailPage.jsx` — add Supabase Realtime subscription

---

## Task 1: DB Migration — mcp_tokens table

**Files:**
- Create: `backend/migrations/add-mcp-tokens.sql`

- [ ] **Step 1: Write the migration file**

```sql
-- backend/migrations/add-mcp-tokens.sql

create table if not exists public.mcp_tokens (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null unique references auth.users(id) on delete cascade,
  token       text not null unique,
  created_at  timestamptz not null default now()
);

-- RLS: users can only see and delete their own token
alter table public.mcp_tokens enable row level security;

create policy "Users can read own mcp token"
  on public.mcp_tokens for select
  using (auth.uid() = user_id);

create policy "Users can delete own mcp token"
  on public.mcp_tokens for delete
  using (auth.uid() = user_id);

-- No insert policy — only service role can insert (via backend)
```

- [ ] **Step 2: Apply the migration in Supabase**

Go to the Supabase dashboard → SQL Editor → paste the contents of `add-mcp-tokens.sql` → Run.

Also enable Realtime for the `roadmap` table if not already enabled:
- Supabase dashboard → Database → Replication → toggle `roadmap` table to ON.

- [ ] **Step 3: Commit**

```bash
cd project-planner
git add backend/migrations/add-mcp-tokens.sql
git commit -m "feat: add mcp_tokens migration"
```

---

## Task 2: Backend PAT routes

**Files:**
- Modify: `backend/routes/user.js`
- Create: `backend/tests/mcpToken.test.js`

- [ ] **Step 1: Write the failing test**

Create `backend/tests/mcpToken.test.js`:

```js
// Tests the token generation format — pure function extracted from the route
const crypto = require('crypto');

function generateMcpToken() {
  return 'mcp_' + crypto.randomBytes(32).toString('hex');
}

describe('MCP token generation', () => {
  test('token starts with mcp_ prefix', () => {
    expect(generateMcpToken()).toMatch(/^mcp_/);
  });

  test('token is 68 characters (4 prefix + 64 hex)', () => {
    expect(generateMcpToken()).toHaveLength(68);
  });

  test('each call produces a unique token', () => {
    expect(generateMcpToken()).not.toBe(generateMcpToken());
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd project-planner/backend
npm test -- --testPathPattern=mcpToken
```

Expected: FAIL — `generateMcpToken is not defined` (it's defined inside the test file; this will actually pass once the file exists, which is fine — the test validates format)

- [ ] **Step 3: Add the three PAT routes to `backend/routes/user.js`**

Add after the existing `POST /dismiss-byok-nudge` route, before `module.exports`:

```js
// POST /api/user/mcp-token  — generate (or replace) a PAT
router.post('/mcp-token', extractUserId, async (req, res) => {
  const crypto = require('crypto');
  const token = 'mcp_' + crypto.randomBytes(32).toString('hex');
  try {
    const { error } = await supabase
      .from('mcp_tokens')
      .upsert({ user_id: req.userId, token, created_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (error) throw error;
    res.json({ token });
  } catch (err) {
    console.error('POST /api/user/mcp-token error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/user/mcp-token  — revoke PAT
router.delete('/mcp-token', extractUserId, async (req, res) => {
  try {
    const { error } = await supabase
      .from('mcp_tokens')
      .delete()
      .eq('user_id', req.userId);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/user/mcp-token error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/user/mcp-token/status  — returns { exists: boolean }, never the token value
router.get('/mcp-token/status', extractUserId, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('mcp_tokens')
      .select('id')
      .eq('user_id', req.userId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    res.json({ exists: !!data });
  } catch (err) {
    console.error('GET /api/user/mcp-token/status error:', err);
    res.status(500).json({ error: err.message });
  }
});
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
cd project-planner/backend
npm test -- --testPathPattern=mcpToken
```

Expected: PASS — 3 tests passing.

- [ ] **Step 5: Commit**

```bash
cd project-planner
git add backend/routes/user.js backend/tests/mcpToken.test.js
git commit -m "feat: add PAT routes for MCP token (generate, revoke, status)"
```

---

## Task 3: MCP Server package setup

**Files:**
- Create: `mcp-server/package.json`
- Create: `mcp-server/supabase.js`
- Create: `mcp-server/auth.js`
- Create: `mcp-server/tests/auth.test.js`

- [ ] **Step 1: Write the failing auth test**

Create `mcp-server/tests/auth.test.js`:

```js
import { validatePat } from '../auth.js';

describe('validatePat', () => {
  test('returns userId when token exists in DB', async () => {
    const mockUserId = 'user-123';
    const mockSupabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: { user_id: mockUserId }, error: null })
          })
        })
      })
    };
    const result = await validatePat(mockSupabase, 'mcp_abc123');
    expect(result).toBe(mockUserId);
  });

  test('throws when token not found', async () => {
    const mockSupabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: { code: 'PGRST116' } })
          })
        })
      })
    };
    await expect(validatePat(mockSupabase, 'mcp_invalid')).rejects.toThrow('Invalid MCP_TOKEN');
  });
});
```

- [ ] **Step 2: Create `mcp-server/package.json`**

```json
{
  "name": "project-planner-mcp",
  "version": "1.0.0",
  "type": "module",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "test": "node --experimental-vm-modules node_modules/.bin/jest --testPathPattern=tests/"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "@supabase/supabase-js": "^2.50.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "jest": "^30.3.0"
  },
  "jest": {
    "testEnvironment": "node",
    "extensionsToTreatAsEsm": [".js"],
    "transform": {}
  }
}
```

- [ ] **Step 3: Install dependencies**

```bash
cd project-planner/mcp-server
npm install
```

Expected: `node_modules` created with `@modelcontextprotocol/sdk`, `@supabase/supabase-js`, `zod`.

- [ ] **Step 4: Run the failing test**

```bash
cd project-planner/mcp-server
npm test
```

Expected: FAIL — `Cannot find module '../auth.js'`

- [ ] **Step 5: Create `mcp-server/supabase.js`**

```js
// mcp-server/supabase.js
import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
```

- [ ] **Step 6: Create `mcp-server/auth.js`**

```js
// mcp-server/auth.js

/**
 * Validates a Personal Access Token against the mcp_tokens table.
 * @param {object} supabase - Supabase client
 * @param {string} token - The MCP_TOKEN value from env
 * @returns {Promise<string>} userId
 * @throws if token not found
 */
export async function validatePat(supabase, token) {
  const { data, error } = await supabase
    .from('mcp_tokens')
    .select('user_id')
    .eq('token', token)
    .single();

  if (error || !data) {
    throw new Error('Invalid MCP_TOKEN. Generate a new one in Project Planner Settings.');
  }

  return data.user_id;
}
```

- [ ] **Step 7: Run the test to verify it passes**

```bash
cd project-planner/mcp-server
npm test
```

Expected: PASS — 2 tests passing.

- [ ] **Step 8: Commit**

```bash
cd project-planner
git add mcp-server/
git commit -m "feat: scaffold mcp-server package with auth module"
```

---

## Task 4: MCP tool — getProjectStatus

**Files:**
- Create: `mcp-server/tools/getProjectStatus.js`
- Modify: `mcp-server/tests/tools.test.js` (create on first tool, append on subsequent)

- [ ] **Step 1: Write the failing test**

Create `mcp-server/tests/tools.test.js`:

```js
import { getProjectStatus } from '../tools/getProjectStatus.js';

// Helper: builds a minimal roadmap content object
function makeRoadmap({ phases = [] } = {}) {
  return JSON.stringify({
    projectName: 'Test Project',
    phases,
  });
}

function makePhase(tasks = []) {
  return {
    id: 'phase-1',
    title: 'Phase 1',
    order: 1,
    milestones: [{ id: 'm-1', title: 'M1', order: 1, tasks }],
  };
}

describe('getProjectStatus', () => {
  test('returns summary for all projects when no project_id given', async () => {
    const mockRows = [
      { id: 'proj-1', title: 'Alpha', content: makeRoadmap({ phases: [makePhase([{ id: 't1', status: 'completed' }, { id: 't2', status: 'pending' }])] }) },
      { id: 'proj-2', title: 'Beta',  content: makeRoadmap({ phases: [makePhase([{ id: 't3', status: 'pending' }])] }) },
    ];
    const mockSupabase = {
      from: () => ({ select: () => ({ eq: () => ({ data: mockRows, error: null }) }) })
    };
    const result = await getProjectStatus(mockSupabase, 'user-1', {});
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('Alpha');
    expect(result[0].totalTasks).toBe(2);
    expect(result[0].completedTasks).toBe(1);
    expect(result[0].completionPercent).toBe(50);
  });

  test('returns detail for a specific project when project_id given', async () => {
    const content = makeRoadmap({ phases: [makePhase([{ id: 't1', status: 'completed' }])] });
    const mockSupabase = {
      from: () => ({
        select: () => ({
          eq: (col, val) => col === 'user_id'
            ? { eq: () => ({ single: async () => ({ data: { id: 'proj-1', title: 'Alpha', content }, error: null }) }) }
            : { single: async () => ({ data: { id: 'proj-1', title: 'Alpha', content }, error: null }) }
        })
      })
    };
    const result = await getProjectStatus(mockSupabase, 'user-1', { project_id: 'proj-1' });
    expect(result.title).toBe('Alpha');
    expect(result.totalTasks).toBe(1);
    expect(result.completedTasks).toBe(1);
    expect(result.completionPercent).toBe(100);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd project-planner/mcp-server
npm test -- --testPathPattern=tools
```

Expected: FAIL — `Cannot find module '../tools/getProjectStatus.js'`

- [ ] **Step 3: Create `mcp-server/tools/getProjectStatus.js`**

```js
// mcp-server/tools/getProjectStatus.js

function countTasks(phases) {
  let total = 0, completed = 0;
  for (const phase of phases) {
    for (const milestone of (phase.milestones || [])) {
      for (const task of (milestone.tasks || [])) {
        total++;
        if (task.status === 'completed') completed++;
      }
    }
  }
  return { total, completed };
}

/**
 * @param {object} supabase
 * @param {string} userId
 * @param {{ project_id?: string }} args
 */
export async function getProjectStatus(supabase, userId, args) {
  if (args.project_id) {
    const { data, error } = await supabase
      .from('roadmap')
      .select('id, title, content')
      .eq('user_id', userId)
      .eq('id', args.project_id)
      .single();
    if (error || !data) throw new Error(`Project ${args.project_id} not found`);

    const roadmap = JSON.parse(data.content);
    const { total, completed } = countTasks(roadmap.phases || []);
    const currentPhase = (roadmap.phases || []).find(p =>
      (p.milestones || []).some(m => (m.tasks || []).some(t => t.status !== 'completed'))
    );

    return {
      id: data.id,
      title: data.title,
      totalPhases: (roadmap.phases || []).length,
      totalTasks: total,
      completedTasks: completed,
      completionPercent: total === 0 ? 0 : Math.round((completed / total) * 100),
      currentPhase: currentPhase?.title ?? null,
    };
  }

  // All projects
  const { data, error } = await supabase
    .from('roadmap')
    .select('id, title, content')
    .eq('user_id', userId);
  if (error) throw new Error(`Failed to fetch projects: ${error.message}`);

  return (data || []).map(row => {
    const roadmap = JSON.parse(row.content);
    const { total, completed } = countTasks(roadmap.phases || []);
    return {
      id: row.id,
      title: row.title,
      totalTasks: total,
      completedTasks: completed,
      completionPercent: total === 0 ? 0 : Math.round((completed / total) * 100),
    };
  });
}
```

- [ ] **Step 4: Run to verify it passes**

```bash
cd project-planner/mcp-server
npm test -- --testPathPattern=tools
```

Expected: PASS — 2 tests passing.

- [ ] **Step 5: Commit**

```bash
cd project-planner
git add mcp-server/tools/getProjectStatus.js mcp-server/tests/tools.test.js
git commit -m "feat: add getProjectStatus MCP tool"
```

---

## Task 5: MCP tool — getNextTasks

**Files:**
- Create: `mcp-server/tools/getNextTasks.js`
- Modify: `mcp-server/tests/tools.test.js`

- [ ] **Step 1: Append the failing test to `mcp-server/tests/tools.test.js`**

Add after the existing `getProjectStatus` describe block:

```js
import { getNextTasks } from '../tools/getNextTasks.js';

describe('getNextTasks', () => {
  test('returns pending and in_progress tasks up to limit', async () => {
    const content = JSON.stringify({
      phases: [{
        id: 'p1', title: 'Phase 1', order: 1,
        milestones: [{
          id: 'm1', title: 'M1', order: 1,
          tasks: [
            { id: 't1', title: 'Task 1', status: 'completed', order: 1 },
            { id: 't2', title: 'Task 2', status: 'in_progress', order: 2 },
            { id: 't3', title: 'Task 3', status: 'pending', order: 3 },
            { id: 't4', title: 'Task 4', status: 'pending', order: 4 },
          ]
        }]
      }]
    });
    const mockSupabase = {
      from: () => ({
        select: () => ({
          eq: () => ({ eq: () => ({ single: async () => ({ data: { id: 'proj-1', title: 'P', content }, error: null }) }) })
        })
      })
    };
    const result = await getNextTasks(mockSupabase, 'user-1', { project_id: 'proj-1', limit: 2 });
    expect(result).toHaveLength(2);
    expect(result[0].taskId).toBe('t2');
    expect(result[0].phaseTitle).toBe('Phase 1');
    expect(result[0].milestoneTitle).toBe('M1');
    expect(result[1].taskId).toBe('t3');
  });

  test('respects default limit of 5', async () => {
    const tasks = Array.from({ length: 8 }, (_, i) => ({
      id: `t${i}`, title: `Task ${i}`, status: 'pending', order: i
    }));
    const content = JSON.stringify({
      phases: [{ id: 'p1', title: 'P1', order: 1, milestones: [{ id: 'm1', title: 'M1', order: 1, tasks }] }]
    });
    const mockSupabase = {
      from: () => ({
        select: () => ({
          eq: () => ({ eq: () => ({ single: async () => ({ data: { id: 'proj-1', title: 'P', content }, error: null }) }) })
        })
      })
    };
    const result = await getNextTasks(mockSupabase, 'user-1', { project_id: 'proj-1' });
    expect(result).toHaveLength(5);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd project-planner/mcp-server
npm test -- --testPathPattern=tools
```

Expected: FAIL — `Cannot find module '../tools/getNextTasks.js'`

- [ ] **Step 3: Create `mcp-server/tools/getNextTasks.js`**

```js
// mcp-server/tools/getNextTasks.js

/**
 * @param {object} supabase
 * @param {string} userId
 * @param {{ project_id: string, limit?: number }} args
 */
export async function getNextTasks(supabase, userId, args) {
  const limit = Math.min(args.limit ?? 5, 20);

  const { data, error } = await supabase
    .from('roadmap')
    .select('id, title, content')
    .eq('user_id', userId)
    .eq('id', args.project_id)
    .single();

  if (error || !data) throw new Error(`Project ${args.project_id} not found`);

  const roadmap = JSON.parse(data.content);
  const results = [];

  const phases = [...(roadmap.phases || [])].sort((a, b) => a.order - b.order);
  for (const phase of phases) {
    if (results.length >= limit) break;
    const milestones = [...(phase.milestones || [])].sort((a, b) => a.order - b.order);
    for (const milestone of milestones) {
      if (results.length >= limit) break;
      const tasks = [...(milestone.tasks || [])].sort((a, b) => a.order - b.order);
      for (const task of tasks) {
        if (results.length >= limit) break;
        if (task.status === 'pending' || task.status === 'in_progress') {
          results.push({
            taskId: task.id,
            title: task.title,
            description: task.description ?? '',
            status: task.status,
            technology: task.technology ?? null,
            phaseTitle: phase.title,
            milestoneTitle: milestone.title,
          });
        }
      }
    }
  }

  return results;
}
```

- [ ] **Step 4: Run to verify it passes**

```bash
cd project-planner/mcp-server
npm test -- --testPathPattern=tools
```

Expected: PASS — 4 tests passing.

- [ ] **Step 5: Commit**

```bash
cd project-planner
git add mcp-server/tools/getNextTasks.js mcp-server/tests/tools.test.js
git commit -m "feat: add getNextTasks MCP tool"
```

---

## Task 6: MCP tool — updateTaskStatus

**Files:**
- Create: `mcp-server/tools/updateTaskStatus.js`
- Modify: `mcp-server/tests/tools.test.js`

- [ ] **Step 1: Append the failing test**

Add after the `getNextTasks` describe block in `mcp-server/tests/tools.test.js`:

```js
import { updateTaskStatus } from '../tools/updateTaskStatus.js';

describe('updateTaskStatus', () => {
  test('updates task status and writes back to DB', async () => {
    const content = JSON.stringify({
      phases: [{
        id: 'p1', title: 'P1', order: 1,
        milestones: [{
          id: 'm1', title: 'M1', order: 1,
          tasks: [{ id: 'task-abc', title: 'Do thing', status: 'pending', order: 1 }]
        }]
      }]
    });

    let updatedContent = null;
    const mockSupabase = {
      from: (table) => ({
        select: () => ({
          eq: () => ({ eq: () => ({ single: async () => ({ data: { id: 'proj-1', content }, error: null }) }) })
        }),
        update: (payload) => {
          updatedContent = payload.content;
          return { eq: () => ({ eq: () => ({ error: null }) }) };
        }
      })
    };

    const result = await updateTaskStatus(mockSupabase, 'user-1', {
      project_id: 'proj-1',
      task_id: 'task-abc',
      status: 'completed'
    });

    expect(result.id).toBe('task-abc');
    expect(result.status).toBe('completed');
    expect(JSON.parse(updatedContent).phases[0].milestones[0].tasks[0].status).toBe('completed');
  });

  test('throws when task not found', async () => {
    const content = JSON.stringify({ phases: [{ id: 'p1', title: 'P', order: 1, milestones: [] }] });
    const mockSupabase = {
      from: () => ({
        select: () => ({
          eq: () => ({ eq: () => ({ single: async () => ({ data: { id: 'proj-1', content }, error: null }) }) })
        })
      })
    };
    await expect(
      updateTaskStatus(mockSupabase, 'user-1', { project_id: 'proj-1', task_id: 'missing', status: 'completed' })
    ).rejects.toThrow('Task missing not found');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd project-planner/mcp-server
npm test -- --testPathPattern=tools
```

Expected: FAIL — `Cannot find module '../tools/updateTaskStatus.js'`

- [ ] **Step 3: Create `mcp-server/tools/updateTaskStatus.js`**

```js
// mcp-server/tools/updateTaskStatus.js

const VALID_STATUSES = ['pending', 'in_progress', 'completed'];

/**
 * @param {object} supabase
 * @param {string} userId
 * @param {{ project_id: string, task_id: string, status: string }} args
 */
export async function updateTaskStatus(supabase, userId, args) {
  if (!VALID_STATUSES.includes(args.status)) {
    throw new Error(`Invalid status "${args.status}". Must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  const { data, error } = await supabase
    .from('roadmap')
    .select('id, content')
    .eq('user_id', userId)
    .eq('id', args.project_id)
    .single();

  if (error || !data) throw new Error(`Project ${args.project_id} not found`);

  const roadmap = JSON.parse(data.content);
  let targetTask = null;

  for (const phase of (roadmap.phases || [])) {
    for (const milestone of (phase.milestones || [])) {
      const task = (milestone.tasks || []).find(t => t.id === args.task_id);
      if (task) {
        task.status = args.status;
        targetTask = task;
        break;
      }
    }
    if (targetTask) break;
  }

  if (!targetTask) throw new Error(`Task ${args.task_id} not found in project ${args.project_id}`);

  const { error: writeError } = await supabase
    .from('roadmap')
    .update({ content: JSON.stringify(roadmap), updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('id', args.project_id);

  if (writeError) throw new Error(`Failed to save: ${writeError.message}`);

  return targetTask;
}
```

- [ ] **Step 4: Run to verify it passes**

```bash
cd project-planner/mcp-server
npm test -- --testPathPattern=tools
```

Expected: PASS — 6 tests passing.

- [ ] **Step 5: Commit**

```bash
cd project-planner
git add mcp-server/tools/updateTaskStatus.js mcp-server/tests/tools.test.js
git commit -m "feat: add updateTaskStatus MCP tool"
```

---

## Task 7: MCP tool — addNoteToTask

**Files:**
- Create: `mcp-server/tools/addNoteToTask.js`
- Modify: `mcp-server/tests/tools.test.js`

- [ ] **Step 1: Append the failing test**

Add after the `updateTaskStatus` describe block in `mcp-server/tests/tools.test.js`:

```js
import { addNoteToTask } from '../tools/addNoteToTask.js';

describe('addNoteToTask', () => {
  test('appends note to task notes array', async () => {
    const content = JSON.stringify({
      phases: [{
        id: 'p1', title: 'P1', order: 1,
        milestones: [{
          id: 'm1', title: 'M1', order: 1,
          tasks: [{ id: 'task-1', title: 'T', status: 'in_progress', order: 1 }]
        }]
      }]
    });

    let updatedContent = null;
    const mockSupabase = {
      from: () => ({
        select: () => ({
          eq: () => ({ eq: () => ({ single: async () => ({ data: { id: 'proj-1', content }, error: null }) }) })
        }),
        update: (payload) => {
          updatedContent = payload.content;
          return { eq: () => ({ eq: () => ({ error: null }) }) };
        }
      })
    };

    const result = await addNoteToTask(mockSupabase, 'user-1', {
      project_id: 'proj-1',
      task_id: 'task-1',
      note: 'Scaffolding done'
    });

    expect(result.notes).toHaveLength(1);
    expect(result.notes[0].text).toBe('Scaffolding done');
    expect(result.notes[0].createdAt).toBeDefined();
    expect(JSON.parse(updatedContent).phases[0].milestones[0].tasks[0].notes[0].text).toBe('Scaffolding done');
  });

  test('appends to existing notes without overwriting', async () => {
    const content = JSON.stringify({
      phases: [{
        id: 'p1', title: 'P', order: 1,
        milestones: [{
          id: 'm1', title: 'M', order: 1,
          tasks: [{ id: 't1', title: 'T', status: 'pending', order: 1, notes: [{ text: 'first note', createdAt: '2026-01-01T00:00:00Z' }] }]
        }]
      }]
    });
    const mockSupabase = {
      from: () => ({
        select: () => ({
          eq: () => ({ eq: () => ({ single: async () => ({ data: { id: 'proj-1', content }, error: null }) }) })
        }),
        update: () => ({ eq: () => ({ eq: () => ({ error: null }) }) })
      })
    };
    const result = await addNoteToTask(mockSupabase, 'user-1', { project_id: 'proj-1', task_id: 't1', note: 'second note' });
    expect(result.notes).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd project-planner/mcp-server
npm test -- --testPathPattern=tools
```

Expected: FAIL — `Cannot find module '../tools/addNoteToTask.js'`

- [ ] **Step 3: Create `mcp-server/tools/addNoteToTask.js`**

```js
// mcp-server/tools/addNoteToTask.js

/**
 * @param {object} supabase
 * @param {string} userId
 * @param {{ project_id: string, task_id: string, note: string }} args
 */
export async function addNoteToTask(supabase, userId, args) {
  if (!args.note || !args.note.trim()) throw new Error('Note text is required');

  const { data, error } = await supabase
    .from('roadmap')
    .select('id, content')
    .eq('user_id', userId)
    .eq('id', args.project_id)
    .single();

  if (error || !data) throw new Error(`Project ${args.project_id} not found`);

  const roadmap = JSON.parse(data.content);
  let targetTask = null;

  for (const phase of (roadmap.phases || [])) {
    for (const milestone of (phase.milestones || [])) {
      const task = (milestone.tasks || []).find(t => t.id === args.task_id);
      if (task) {
        if (!Array.isArray(task.notes)) task.notes = [];
        task.notes.push({ text: args.note.trim(), createdAt: new Date().toISOString() });
        targetTask = task;
        break;
      }
    }
    if (targetTask) break;
  }

  if (!targetTask) throw new Error(`Task ${args.task_id} not found in project ${args.project_id}`);

  const { error: writeError } = await supabase
    .from('roadmap')
    .update({ content: JSON.stringify(roadmap), updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('id', args.project_id);

  if (writeError) throw new Error(`Failed to save: ${writeError.message}`);

  return targetTask;
}
```

- [ ] **Step 4: Run to verify it passes**

```bash
cd project-planner/mcp-server
npm test -- --testPathPattern=tools
```

Expected: PASS — 8 tests passing.

- [ ] **Step 5: Commit**

```bash
cd project-planner
git add mcp-server/tools/addNoteToTask.js mcp-server/tests/tools.test.js
git commit -m "feat: add addNoteToTask MCP tool"
```

---

## Task 8: MCP tool — getProjectRoadmap

**Files:**
- Create: `mcp-server/tools/getProjectRoadmap.js`
- Modify: `mcp-server/tests/tools.test.js`

- [ ] **Step 1: Append the failing test**

Add after the `addNoteToTask` describe block in `mcp-server/tests/tools.test.js`:

```js
import { getProjectRoadmap } from '../tools/getProjectRoadmap.js';

describe('getProjectRoadmap', () => {
  test('returns parsed roadmap content', async () => {
    const roadmapObj = { projectName: 'My App', phases: [] };
    const content = JSON.stringify(roadmapObj);
    const mockSupabase = {
      from: () => ({
        select: () => ({
          eq: () => ({ eq: () => ({ single: async () => ({ data: { id: 'proj-1', title: 'My App', content }, error: null }) }) })
        })
      })
    };
    const result = await getProjectRoadmap(mockSupabase, 'user-1', { project_id: 'proj-1' });
    expect(result.projectName).toBe('My App');
    expect(result.phases).toEqual([]);
  });

  test('throws when project not found', async () => {
    const mockSupabase = {
      from: () => ({
        select: () => ({
          eq: () => ({ eq: () => ({ single: async () => ({ data: null, error: { code: 'PGRST116' } }) }) })
        })
      })
    };
    await expect(
      getProjectRoadmap(mockSupabase, 'user-1', { project_id: 'nope' })
    ).rejects.toThrow('Project nope not found');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd project-planner/mcp-server
npm test -- --testPathPattern=tools
```

Expected: FAIL — `Cannot find module '../tools/getProjectRoadmap.js'`

- [ ] **Step 3: Create `mcp-server/tools/getProjectRoadmap.js`**

```js
// mcp-server/tools/getProjectRoadmap.js

/**
 * @param {object} supabase
 * @param {string} userId
 * @param {{ project_id: string }} args
 */
export async function getProjectRoadmap(supabase, userId, args) {
  const { data, error } = await supabase
    .from('roadmap')
    .select('id, title, content')
    .eq('user_id', userId)
    .eq('id', args.project_id)
    .single();

  if (error || !data) throw new Error(`Project ${args.project_id} not found`);

  return JSON.parse(data.content);
}
```

- [ ] **Step 4: Run to verify it passes**

```bash
cd project-planner/mcp-server
npm test -- --testPathPattern=tools
```

Expected: PASS — 10 tests passing.

- [ ] **Step 5: Commit**

```bash
cd project-planner
git add mcp-server/tools/getProjectRoadmap.js mcp-server/tests/tools.test.js
git commit -m "feat: add getProjectRoadmap MCP tool"
```

---

## Task 9: MCP server index.js — wire all tools

**Files:**
- Create: `mcp-server/index.js`

- [ ] **Step 1: Create `mcp-server/index.js`**

```js
// mcp-server/index.js
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { supabase } from './supabase.js';
import { validatePat } from './auth.js';
import { getProjectStatus } from './tools/getProjectStatus.js';
import { getNextTasks } from './tools/getNextTasks.js';
import { updateTaskStatus } from './tools/updateTaskStatus.js';
import { addNoteToTask } from './tools/addNoteToTask.js';
import { getProjectRoadmap } from './tools/getProjectRoadmap.js';

const { MCP_TOKEN } = process.env;
if (!MCP_TOKEN) {
  console.error('MCP_TOKEN env var is required. Generate one in Project Planner Settings.');
  process.exit(1);
}

// Validate PAT once on startup — get userId for all subsequent tool calls
const userId = await validatePat(supabase, MCP_TOKEN);

const server = new McpServer({
  name: 'project-planner',
  version: '1.0.0',
});

server.tool(
  'get_project_status',
  'Get completion status for one or all projects. Omit project_id for a summary of all projects.',
  { project_id: z.string().optional().describe('UUID of the project. Omit to get all projects.') },
  async ({ project_id }) => {
    const result = await getProjectStatus(supabase, userId, { project_id });
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'get_next_tasks',
  'Get the next pending or in-progress tasks for a project, ordered by phase and milestone.',
  {
    project_id: z.string().describe('UUID of the project.'),
    limit: z.number().int().min(1).max(20).optional().describe('How many tasks to return (default 5, max 20).'),
  },
  async ({ project_id, limit }) => {
    const result = await getNextTasks(supabase, userId, { project_id, limit });
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'update_task_status',
  'Mark a task as pending, in_progress, or completed.',
  {
    project_id: z.string().describe('UUID of the project.'),
    task_id: z.string().describe('ID of the task (e.g. "task-1").'),
    status: z.enum(['pending', 'in_progress', 'completed']).describe('New status.'),
  },
  async ({ project_id, task_id, status }) => {
    const result = await updateTaskStatus(supabase, userId, { project_id, task_id, status });
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'add_note_to_task',
  'Attach a progress note to a task. Notes are appended and never overwrite existing ones.',
  {
    project_id: z.string().describe('UUID of the project.'),
    task_id: z.string().describe('ID of the task.'),
    note: z.string().min(1).describe('The note text to attach.'),
  },
  async ({ project_id, task_id, note }) => {
    const result = await addNoteToTask(supabase, userId, { project_id, task_id, note });
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'get_project_roadmap',
  'Get the full roadmap for a project — all phases, milestones, and tasks.',
  { project_id: z.string().describe('UUID of the project.') },
  async ({ project_id }) => {
    const result = await getProjectRoadmap(supabase, userId, { project_id });
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
```

- [ ] **Step 2: Smoke-test the server starts without crashing (with a dummy token)**

```bash
cd project-planner/mcp-server
MCP_TOKEN=dummy SUPABASE_URL=https://x.supabase.co SUPABASE_SERVICE_ROLE_KEY=dummy node index.js 2>&1 | head -5
```

Expected: process starts then exits with "Invalid MCP_TOKEN" error (because the dummy token won't be found in the DB). That's correct — it means the server boots, connects to Supabase, and validates the token. It should NOT crash with a syntax or import error.

- [ ] **Step 3: Commit**

```bash
cd project-planner
git add mcp-server/index.js
git commit -m "feat: wire all tools into MCP server index"
```

---

## Task 10: Frontend — API endpoints

**Files:**
- Modify: `frontend/src/config/api.js`

- [ ] **Step 1: Add MCP token endpoints**

Open `frontend/src/config/api.js`. Replace the file with:

```js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export { API_BASE_URL };

export const API_ENDPOINTS = {
  CHAT: `${API_BASE_URL}/api/chat`,
  UPLOAD: `${API_BASE_URL}/api/upload`,
  SUMMARIZE: `${API_BASE_URL}/api/summarize`,
  INVITE_COLLABORATOR: `${API_BASE_URL}/api/invite-collaborator`,
  ACCEPT_INVITATION: `${API_BASE_URL}/api/accept-invitation`,
  USER_SETTINGS: `${API_BASE_URL}/api/user/settings`,
  USER_ROLE: `${API_BASE_URL}/api/user/role`,
  USER_API_KEY: `${API_BASE_URL}/api/user/api-key`,
  USER_ACCOUNT: `${API_BASE_URL}/api/user/account`,
  DISMISS_BYOK: `${API_BASE_URL}/api/user/dismiss-byok-nudge`,
  MCP_TOKEN: `${API_BASE_URL}/api/user/mcp-token`,
  MCP_TOKEN_STATUS: `${API_BASE_URL}/api/user/mcp-token/status`,
};

export default API_ENDPOINTS;
```

- [ ] **Step 2: Commit**

```bash
cd project-planner
git add frontend/src/config/api.js
git commit -m "feat: add MCP token API endpoints to config"
```

---

## Task 11: Frontend — McpStatusBadge update

**Files:**
- Modify: `frontend/src/components/McpStatusBadge/McpStatusBadge.jsx`

- [ ] **Step 1: Rewrite McpStatusBadge to check token status**

Replace the entire contents of `frontend/src/components/McpStatusBadge/McpStatusBadge.jsx` with:

```jsx
import { useState, useEffect } from 'react';
import Tooltip from '@/components/ui/Tooltip';
import { API_ENDPOINTS } from '@/config/api';
import { supabase } from '@/lib/supabase';

export default function McpStatusBadge() {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    async function checkStatus() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const res = await fetch(API_ENDPOINTS.MCP_TOKEN_STATUS, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) return;
        const { exists } = await res.json();
        setConnected(exists);
      } catch {
        // silently fail — badge stays disconnected
      }
    }
    checkStatus();
  }, []);

  return (
    <Tooltip
      content={connected ? 'Claude Code is connected' : 'Connect Claude Code in Settings'}
      position="top"
    >
      <div className="flex cursor-default items-center gap-1.5">
        <span
          className={`h-2 w-2 rounded-full ${
            connected ? 'bg-green-500' : 'bg-[var(--text-muted)]'
          }`}
        />
        <span className="text-xs text-[var(--text-muted)]">
          {connected ? 'MCP connected' : 'MCP disconnected'}
        </span>
      </div>
    </Tooltip>
  );
}
```

- [ ] **Step 2: Verify it renders without errors**

Start the frontend dev server and open any page that shows `McpStatusBadge` (Dashboard header or ProjectDetail sidebar). The badge should show "MCP disconnected" (no token generated yet). No console errors.

```bash
cd project-planner/frontend
npm run dev
```

- [ ] **Step 3: Commit**

```bash
cd project-planner
git add frontend/src/components/McpStatusBadge/McpStatusBadge.jsx
git commit -m "feat: McpStatusBadge checks token status and shows connected/disconnected"
```

---

## Task 12: Frontend — Settings Claude Code Integration section

**Files:**
- Modify: `frontend/src/pages/Settings/SettingsPage.jsx`

- [ ] **Step 1: Add state and handlers for MCP token**

In `SettingsPage.jsx`, add these imports at the top of the file (after existing imports):

```jsx
import { Copy, Check as CheckIcon, Plug } from 'lucide-react';
```

Add these state variables inside `SettingsPage` after the existing state declarations:

```jsx
const [mcpTokenExists, setMcpTokenExists] = useState(false);
const [mcpToken, setMcpToken] = useState(null); // only set once after generation
const [mcpTokenCopied, setMcpTokenCopied] = useState(false);
const [mcpLoading, setMcpLoading] = useState(false);
const [mcpStatusLoading, setMcpStatusLoading] = useState(true);
```

Add this `useEffect` to check token status on mount (after the existing `useEffect` for API key scroll):

```jsx
useEffect(() => {
  async function checkMcpStatus() {
    try {
      const session = await getSession();
      if (!session) return;
      const res = await fetch(API_ENDPOINTS.MCP_TOKEN_STATUS, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) return;
      const { exists } = await res.json();
      setMcpTokenExists(exists);
    } catch {
      // silently fail
    } finally {
      setMcpStatusLoading(false);
    }
  }
  checkMcpStatus();
}, []);
```

Add these two handler functions after `handleRemoveKey`:

```jsx
async function handleGenerateMcpToken() {
  setMcpLoading(true);
  try {
    const session = await getSession();
    const res = await fetch(API_ENDPOINTS.MCP_TOKEN, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setMcpToken(data.token);
    setMcpTokenExists(true);
    toast.success('Token generated. Copy it now — it won\'t be shown again.');
  } catch (err) {
    toast.error(err.message || 'Failed to generate token.');
  } finally {
    setMcpLoading(false);
  }
}

async function handleRevokeMcpToken() {
  setMcpLoading(true);
  try {
    const session = await getSession();
    const res = await fetch(API_ENDPOINTS.MCP_TOKEN, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!res.ok) throw new Error();
    setMcpToken(null);
    setMcpTokenExists(false);
    toast.success('MCP token revoked.');
  } catch {
    toast.error('Failed to revoke token.');
  } finally {
    setMcpLoading(false);
  }
}

function handleCopyMcpToken() {
  if (!mcpToken) return;
  navigator.clipboard.writeText(mcpToken);
  setMcpTokenCopied(true);
  setTimeout(() => setMcpTokenCopied(false), 2000);
}
```

- [ ] **Step 2: Add the Claude Code Integration section to the JSX**

In the JSX, find the line:

```jsx
      <Divider />

      <SectionHeading
        title="Account actions"
```

Insert the following block **before** that `<Divider />`:

```jsx
      <Divider />

      {/* SECTION 4 — Claude Code Integration */}
      <SectionHeading
        title="Claude Code Integration"
        description="Connect Claude Code to your projects. Generate a token once and paste it into your .mcp.json."
      />
      {mcpStatusLoading ? (
        <Skeleton className="h-24 rounded-xl" />
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
          {!mcpTokenExists && !mcpToken && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">No token active</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">Generate a token to connect Claude Code to this account.</p>
              </div>
              <Button onClick={handleGenerateMcpToken} loading={mcpLoading} size="sm">
                Generate token
              </Button>
            </div>
          )}

          {mcpToken && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                Copy this token now — it won't be shown again.
              </p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={mcpToken}
                  className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 font-mono text-xs text-[var(--text-primary)]"
                />
                <Button variant="secondary" size="sm" onClick={handleCopyMcpToken}>
                  {mcpTokenCopied ? <CheckIcon size={14} /> : <Copy size={14} />}
                </Button>
              </div>
              <Button variant="destructive" size="sm" onClick={handleRevokeMcpToken} loading={mcpLoading}>
                Revoke
              </Button>
            </div>
          )}

          {mcpTokenExists && !mcpToken && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                <p className="text-sm font-medium text-[var(--text-primary)]">Token active</p>
              </div>
              <Button variant="destructive" size="sm" onClick={handleRevokeMcpToken} loading={mcpLoading}>
                Revoke
              </Button>
            </div>
          )}

          <details className="mt-4">
            <summary className="cursor-pointer text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
              Setup instructions
            </summary>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-[var(--bg-elevated)] p-3 text-xs text-[var(--text-primary)]">{`// Add to your .mcp.json
{
  "mcpServers": {
    "project-planner": {
      "command": "node",
      "args": ["/path/to/project-planner/mcp-server/index.js"],
      "env": {
        "MCP_TOKEN": "<your token>",
        "SUPABASE_URL": "<your Supabase URL>",
        "SUPABASE_SERVICE_ROLE_KEY": "<service role key>"
      }
    }
  }
}`}</pre>
          </details>
        </div>
      )}
```

- [ ] **Step 3: Verify in the browser**

With the dev server running, open Settings. Scroll to the bottom. You should see:
- "Claude Code Integration" heading
- A card with "No token active" state and "Generate token" button
- Clicking "Generate token" should show the token once with a copy button
- After refreshing the page, it should show "Token active" with a Revoke button

- [ ] **Step 4: Commit**

```bash
cd project-planner
git add frontend/src/pages/Settings/SettingsPage.jsx
git commit -m "feat: add Claude Code Integration section to Settings"
```

---

## Task 13: Frontend — Realtime subscription in ProjectDetailPage

**Files:**
- Modify: `frontend/src/pages/ProjectDetail/ProjectDetailPage.jsx`

- [ ] **Step 1: Add supabase import to ProjectDetailPage**

Check the top of `frontend/src/pages/ProjectDetail/ProjectDetailPage.jsx`. If `supabase` is not already imported, add it after the existing imports:

```jsx
import { supabase } from '@/lib/supabase';
```

- [ ] **Step 2: Add the Realtime subscription useEffect**

Inside the `ProjectDetailPage` component function, locate the existing `useQueryClient` usage. Add this `useEffect` after the existing ones (e.g., after the `useEffect` that loads the project):

```jsx
// Realtime: invalidate project cache when MCP server writes to the roadmap table
useEffect(() => {
  if (!projectId) return;

  const channel = supabase
    .channel(`roadmap-mcp-${projectId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'roadmap',
        filter: `id=eq.${projectId}`,
      },
      () => {
        queryClient.invalidateQueries([QUERY_KEYS.PROJECT_DETAILS, projectId]);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [projectId, queryClient]);
```

- [ ] **Step 3: Verify Realtime works end-to-end**

With the frontend dev server running and a project open in the browser:

1. Open the Supabase dashboard → Table Editor → `roadmap` table
2. Manually edit the `content` column of any row (change a task's `status` from `pending` to `in_progress`)
3. Click Save

The project detail page in the browser should update within 1-2 seconds without a manual refresh.

- [ ] **Step 4: Commit**

```bash
cd project-planner
git add frontend/src/pages/ProjectDetail/ProjectDetailPage.jsx
git commit -m "feat: add Supabase Realtime subscription for live MCP updates in ProjectDetailPage"
```

---

## Task 14: End-to-end smoke test

- [ ] **Step 1: Start backend and frontend**

```bash
# Terminal 1
cd project-planner/backend && node index.js

# Terminal 2
cd project-planner/frontend && npm run dev
```

- [ ] **Step 2: Generate a real MCP token**

1. Open `http://localhost:5173/settings` in browser
2. Scroll to "Claude Code Integration"
3. Click "Generate token" — copy the token value

- [ ] **Step 3: Create `.mcp.json` in the repo root**

```json
{
  "mcpServers": {
    "project-planner": {
      "command": "node",
      "args": ["mcp-server/index.js"],
      "env": {
        "MCP_TOKEN": "<paste token here>",
        "SUPABASE_URL": "<your SUPABASE_URL from backend/.env>",
        "SUPABASE_SERVICE_ROLE_KEY": "<your SUPABASE_SERVICE_ROLE_KEY from backend/.env>"
      }
    }
  }
}
```

- [ ] **Step 4: Test the MCP server manually**

```bash
cd project-planner
MCP_TOKEN=<your-token> SUPABASE_URL=<url> SUPABASE_SERVICE_ROLE_KEY=<key> node mcp-server/index.js
```

Expected: process starts and waits (no exit, no error). Press Ctrl+C to stop.

- [ ] **Step 5: Open Claude Code and test tools**

In Claude Code (with `.mcp.json` present in the project directory), try:

- "Use get_project_status to show me all my projects"
- "Use get_next_tasks on project [id] with limit 3"
- "Use update_task_status to mark task [id] as in_progress"

Verify the ProjectDetail page updates live in the browser.

- [ ] **Step 6: Final commit**

```bash
cd project-planner
git add .mcp.json.example  # (optional: add a .mcp.json.example with placeholders)
git commit -m "feat: Phase 3 MCP server complete — all tools, PAT auth, Realtime"
```

---

## Task 15: Update PROJECT_SCOPE.md

**Files:**
- Modify: `docs/PROJECT_SCOPE.md`

- [ ] **Step 1: Update the Phase 3 section**

In `docs/PROJECT_SCOPE.md`, find the `### Phase 3 — MCP Server ← NEXT` section and replace it with:

```markdown
### Phase 3 — MCP Server ✅ COMPLETE

**Branch:** main  
**Spec:** `docs/superpowers/specs/2026-04-03-phase3-mcp-server-design.md`  
**Plan:** `docs/superpowers/plans/2026-04-03-phase3-mcp-server.md`

**What was delivered:**

**Backend:**
- `mcp_tokens` table with RLS (`backend/migrations/add-mcp-tokens.sql`)
- `POST /api/user/mcp-token` — generate/replace PAT
- `DELETE /api/user/mcp-token` — revoke PAT
- `GET /api/user/mcp-token/status` — returns `{ exists: boolean }`

**MCP Server (`mcp-server/`):**
- Standalone ESM package using `@modelcontextprotocol/sdk`
- PAT validated once on startup → userId cached for session
- Five tools: `get_project_status`, `get_next_tasks`, `update_task_status`, `add_note_to_task`, `get_project_roadmap`
- Users configure via `.mcp.json` with `MCP_TOKEN` + Supabase credentials

**Frontend:**
- `McpStatusBadge` — shows connected/disconnected based on token status API
- Settings — "Claude Code Integration" section: generate, copy, revoke token + setup instructions
- `ProjectDetailPage` — Supabase Realtime subscription; invalidates React Query on MCP write

**Next session — first action:**
- Determine Phase 4 scope (stretch features or production hardening)
```

- [ ] **Step 2: Commit**

```bash
cd project-planner
git add docs/PROJECT_SCOPE.md
git commit -m "docs: mark Phase 3 MCP server as complete in PROJECT_SCOPE"
```
