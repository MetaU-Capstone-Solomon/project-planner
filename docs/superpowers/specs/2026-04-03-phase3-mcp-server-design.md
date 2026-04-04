# Phase 3 — MCP Server Design

**Date:** 2026-04-03  
**Status:** Approved  
**Author:** Solomon Agyire

---

## Overview

Build a standalone MCP (Model Context Protocol) server that exposes Project Planner data as tools Claude Code can call. Users register the server once in their `.mcp.json`, generate a Personal Access Token in Settings, and Claude Code can then read project status, pick up tasks, mark them complete, and attach notes — all reflected live in the frontend via Supabase Realtime.

---

## Architecture

### Data Flow

```
Claude Code → stdio → mcp-server/index.js
  → auth.js (PAT lookup → userId)
  → tools/*.js (read/write roadmap table in Supabase directly)
  → Supabase Realtime fires UPDATE event
  → Frontend Realtime subscription fires
  → queryClient.invalidateQueries(['project', projectId])
  → ProjectDetailPage re-renders live
```

### File Structure

```
project-planner/
├── backend/
│   ├── routes/
│   │   └── user.js                      (add PAT endpoints)
│   └── migrations/
│       └── add-mcp-tokens.sql           (new table)
│
├── mcp-server/                          (new standalone package)
│   ├── package.json
│   ├── index.js                         (entry point — registers tools, starts stdio transport)
│   ├── auth.js                          (validatePat → userId)
│   ├── supabase.js                      (Supabase client from env)
│   └── tools/
│       ├── getProjectStatus.js
│       ├── getNextTasks.js
│       ├── updateTaskStatus.js
│       ├── addNoteToTask.js
│       └── getProjectRoadmap.js
│
└── frontend/src/
    ├── components/McpStatusBadge/
    │   └── McpStatusBadge.jsx           (update: connected/disconnected state)
    └── pages/Settings/
        └── SettingsPage.jsx             (add: Claude Code Integration section)
```

---

## Database

### New Table: `mcp_tokens`

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK → auth.users UNIQUE | one active token per user |
| token | text UNIQUE | `mcp_` prefix + 32 random bytes (hex) |
| created_at | timestamptz | |

**RLS:** user can only read/delete their own row. Insert/upsert via service role key (backend route only).

### Task Schema Addition

Tasks in the `roadmap.content` JSON blob gain an optional `notes` field:

```json
{
  "id": "task-1",
  "title": "...",
  "status": "pending",
  "notes": [
    { "text": "Started scaffolding", "createdAt": "2026-04-03T12:00:00Z" }
  ]
}
```

`notes` defaults to `[]` if absent. Non-breaking — existing tasks without the field are treated as having an empty array.

---

## Backend API — New Routes (`backend/routes/user.js`)

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/user/mcp-token` | JWT | Generate (or replace) PAT. Returns token value **once only**. |
| `DELETE` | `/api/user/mcp-token` | JWT | Revoke PAT. |
| `GET` | `/api/user/mcp-token/status` | JWT | Returns `{ exists: boolean }`. Never returns the token value. |

Token format: `mcp_` + `crypto.randomBytes(32).toString('hex')` (68 chars total).

---

## MCP Server

### Setup

```json
// .mcp.json (user's Claude Code project config)
{
  "mcpServers": {
    "project-planner": {
      "command": "node",
      "args": ["/absolute/path/to/project-planner/mcp-server/index.js"],
      "env": {
        "MCP_TOKEN": "<token from Settings>",
        "SUPABASE_URL": "<project Supabase URL>",
        "SUPABASE_SERVICE_ROLE_KEY": "<service role key>"
      }
    }
  }
}
```

### Auth (`auth.js`)

On server startup, `validatePat(token)` queries `mcp_tokens` for the token and returns the associated `user_id`. If not found, the server exits with a clear error message. The `userId` is cached in memory for the lifetime of the process — no per-call DB lookup.

### Dependencies

```json
{
  "@modelcontextprotocol/sdk": "^1.0.0",
  "@supabase/supabase-js": "^2.0.0"
}
```

---

## MCP Tools

### `get_project_status`

- **Input:** `project_id` (string, optional)
- **Behavior:** If `project_id` omitted, returns a summary of all user's projects. If provided, returns detailed status for that project: title, total phases, total tasks, completed tasks, completion %, current active phase.
- **Output:** JSON object or array of project summaries.

### `get_next_tasks`

- **Input:** `project_id` (string, required), `limit` (integer, default 5, max 20)
- **Behavior:** Walks phases → milestones → tasks in order. Returns the first `limit` tasks with status `pending` or `in_progress`. Each task includes its phase title and milestone title for context.
- **Output:** Array of task objects with full context.
- **Claude Code usage:** User can ask "get my next task" (limit 1), "get the next 3 tasks" (limit 3), etc.

### `update_task_status`

- **Input:** `project_id` (string), `task_id` (string), `status` (`pending` | `in_progress` | `completed`)
- **Behavior:** Reads the roadmap JSON blob, finds the task by `id` (deep search through phases/milestones/tasks), updates `status`, writes back. Uses optimistic read-modify-write; retries once on conflict.
- **Output:** The updated task object.
- **Claude Code usage:** Claude calls this once per task to mark a batch complete. Multiple calls = multiple tasks updated sequentially.

### `add_note_to_task`

- **Input:** `project_id` (string), `task_id` (string), `note` (string)
- **Behavior:** Finds the task, appends `{ text: note, createdAt: ISO timestamp }` to `notes[]`, writes back.
- **Output:** The updated task object with notes array.

### `get_project_roadmap`

- **Input:** `project_id` (string)
- **Behavior:** Returns the full parsed `content` JSON for the project. Used for full context loading at the start of a Claude Code session.
- **Output:** Complete roadmap object (phases → milestones → tasks).

---

## Frontend Changes

### Realtime Subscription (`ProjectDetailPage.jsx`)

```js
useEffect(() => {
  const channel = supabase
    .channel(`roadmap-mcp-${projectId}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'roadmap',
      filter: `id=eq.${projectId}`
    }, () => {
      queryClient.invalidateQueries(['project', projectId]);
    })
    .subscribe();
  return () => supabase.removeChannel(channel);
}, [projectId]);
```

No new dependencies. Supabase Realtime is already available via the existing Supabase JS client.

### `McpStatusBadge.jsx`

- On mount, calls `GET /api/user/mcp-token/status`
- If `exists: true` → green dot + "MCP connected"
- If `exists: false` → existing gray dot + "MCP disconnected" (current behavior)

### Settings Page — Claude Code Integration Section

Located at the bottom of `SettingsPage.jsx`, after the API Key section.

**States:**

1. **No token:** "Claude Code Integration" card with a "Generate token" button.
2. **Token just generated:** Token displayed in a read-only input (monospace) with a copy button. Warning: "This token will not be shown again." Revoke button visible.
3. **Token exists (page reload):** "Token active — generated [date]" with revoke button. No token value shown.
4. **Below token (all states):** Collapsible "Setup instructions" block with the `.mcp.json` snippet pre-filled with `SUPABASE_URL` from env (the frontend already knows this). User fills in their local path and pastes the token.

---

## Error Handling

| Scenario | Behavior |
|---|---|
| MCP_TOKEN env var missing on startup | Server logs clear error and exits |
| PAT not found in DB | Server logs "Invalid MCP_TOKEN" and exits |
| Project not found / not owned by user | Tool returns MCP error: "Project not found" |
| Task not found | Tool returns MCP error: "Task {id} not found in project {id}" |
| DB write failure | Tool returns MCP error with message; no partial write |
| Realtime disconnect | Supabase JS reconnects automatically |

---

## Out of Scope

- Multi-user MCP sessions (one PAT = one user)
- PAT expiry / rotation (revoke-and-regenerate is the flow)
- Task assignment via MCP
- Creating new projects or phases via MCP
