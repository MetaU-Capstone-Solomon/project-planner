# Phase 4 — MCP CRUD + Terminal Project Creation Design

**Date:** 2026-04-05  
**Status:** Approved  
**Author:** Solomon Agyire

---

## Overview

Extend the Phase 3 MCP server with 10 new tools: 9 structural mutation tools (add/edit/delete for tasks, milestones, phases) using a dry-run approval pattern, plus `create_project` for terminal-first project creation. One frontend addition: a Supabase Realtime INSERT subscription on the Dashboard so new projects appear instantly when created via `create_project`.

---

## Approval Pattern

All mutation tools use a `dry_run` boolean parameter:

- `dry_run: true` — reads data, returns a preview of what will change, **never writes**
- `dry_run: false` — performs the actual write

**Claude's workflow for every mutation:**
1. Call tool with `dry_run: true` → show preview to user
2. Wait for user confirmation ("yes", "confirm", "do it")
3. Call tool again with `dry_run: false` → write to DB → Realtime fires → frontend updates live

**Claude's workflow for `create_project`:**
1. Ask clarifying questions in terminal chat (stack, timeline, experience level, scope)
2. Present the full structured plan as a text summary in chat
3. Wait for user approval
4. Call `create_project` once with the complete object — no dry-run needed

All deletes are **hard deletes** — permanently removed, no soft delete or recovery.

---

## Tool Schemas

### Add Tools

```js
add_task({
  project_id: string,       // UUID of the project
  phase_id: string,         // ID of the target phase
  milestone_id: string,     // ID of the target milestone
  title: string,
  description?: string,
  technology?: string,
  dry_run: boolean
})

add_milestone({
  project_id: string,
  phase_id: string,         // ID of the target phase
  title: string,
  dry_run: boolean
})

add_phase({
  project_id: string,
  title: string,
  dry_run: boolean
})
```

### Edit Tools

```js
edit_task({
  project_id: string,
  task_id: string,
  title?: string,           // at least one of title/description/technology required
  description?: string,
  technology?: string,
  dry_run: boolean
})

edit_milestone({
  project_id: string,
  milestone_id: string,
  title: string,
  dry_run: boolean
})

edit_phase({
  project_id: string,
  phase_id: string,
  title: string,
  dry_run: boolean
})
```

### Delete Tools

```js
delete_task({
  project_id: string,
  task_id: string,
  dry_run: boolean
})

delete_milestone({
  project_id: string,
  milestone_id: string,
  dry_run: boolean
})

delete_phase({
  project_id: string,
  phase_id: string,
  dry_run: boolean
})
```

### Create Tool

```js
create_project({
  title: string,
  description?: string,
  timeline?: string,            // e.g. "3 months"
  experienceLevel?: string,     // e.g. "Intermediate"
  technologies?: string[],
  phases: [
    {
      title: string,
      milestones: [
        {
          title: string,
          tasks: [
            {
              title: string,
              description?: string,
              technology?: string
            }
          ]
        }
      ]
    }
  ]
})
```

---

## ID Generation & Ordering

New items get IDs generated at write time (not dry-run time):
- Phase: `phase-${Date.now()}`
- Milestone: `milestone-${Date.now()}`
- Task: `task-${Date.now()}`

`order` values: new items appended at end → `max(existing order values) + 1`. If no siblings exist, `order: 1`.

`create_project` generates all IDs and order values for the entire tree at write time. Task `status` defaults to `"pending"`.

---

## Data Flow

### Mutation (dry_run: true)
```
Read roadmap blob from Supabase
Find target by ID (phase_id / milestone_id / task_id)
Build and return preview object
Do NOT write anything
```

### Mutation (dry_run: false)
```
Read roadmap blob from Supabase
Find target by ID
Apply mutation in memory
Write full blob back to Supabase (updated_at refreshed)
Supabase Realtime fires UPDATE event
ProjectDetailPage Realtime subscription invalidates React Query cache
Frontend re-renders with new data
```

### create_project
```
Generate IDs + order values for all phases/milestones/tasks
Insert new row into roadmap table (user_id = authenticated userId from PAT)
Supabase Realtime fires INSERT event
Dashboard Realtime subscription invalidates userProjects React Query cache
New project appears in dashboard immediately
Return { projectId, title, phaseCount, milestoneCount, taskCount }
```

---

## Dry-Run Response Shapes

### Add (dry_run: true)
```json
{
  "preview": { "id": "(will be generated)", "title": "...", "status": "pending", ... },
  "target": "milestone 'Milestone Name' in phase 'Phase Name'",
  "action": "add_task"
}
```

### Edit (dry_run: true)
```json
{
  "before": { "title": "Old title", "description": "..." },
  "after":  { "title": "New title", "description": "..." },
  "action": "edit_task"
}
```

### Delete (dry_run: true)
```json
{
  "item": { "id": "task-1", "title": "...", "status": "pending" },
  "warning": "This will permanently delete 1 task. This cannot be undone.",
  "action": "delete_task"
}

// delete_milestone
{
  "item": { "id": "milestone-1", "title": "..." },
  "warning": "This will permanently delete 1 milestone and 4 tasks. This cannot be undone.",
  "action": "delete_milestone"
}

// delete_phase
{
  "item": { "id": "phase-1", "title": "..." },
  "warning": "This will permanently delete 1 phase, 3 milestones, and 12 tasks. This cannot be undone.",
  "action": "delete_phase"
}
```

---

## Error Handling

| Scenario | Error message |
|---|---|
| `phase_id` not found | `"Phase {id} not found in project {id}"` |
| `milestone_id` not found | `"Milestone {id} not found in project {id}"` |
| `task_id` not found | `"Task {id} not found in project {id}"` |
| `project_id` not found / not owned by user | `"Project {id} not found"` |
| `edit_task` with no fields to change | `"Provide at least one field to update: title, description, technology"` |
| `create_project` with empty phases array | `"Project must have at least one phase"` |
| DB write failure | `"Failed to save: {message}"` |
| `dry_run: true` always | Never writes — safe to call at any time |

---

## Frontend Change — Dashboard Realtime (INSERT)

Single addition to `frontend/src/pages/Dashboard/Dashboard.jsx`:

```js
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

`supabase` and `user` are already available in `Dashboard.jsx`. `QUERY_KEYS.USER_PROJECTS` is `'userProjects'` per `frontend/src/constants/cache.js`.

No other frontend changes needed — all mutation tools trigger the existing `ProjectDetailPage` Realtime UPDATE subscription from Phase 3.

---

## File Map

### New files
- `mcp-server/tools/addTask.js`
- `mcp-server/tools/addMilestone.js`
- `mcp-server/tools/addPhase.js`
- `mcp-server/tools/editTask.js`
- `mcp-server/tools/editMilestone.js`
- `mcp-server/tools/editPhase.js`
- `mcp-server/tools/deleteTask.js`
- `mcp-server/tools/deleteMilestone.js`
- `mcp-server/tools/deletePhase.js`
- `mcp-server/tools/createProject.js`
- `mcp-server/tests/crudTools.test.js`

### Modified files
- `mcp-server/index.js` — register 10 new tools
- `frontend/src/pages/Dashboard/Dashboard.jsx` — add INSERT Realtime subscription

---

## Out of Scope

- Reordering phases/milestones/tasks (drag-and-drop reorder via MCP)
- Bulk operations (e.g. delete multiple tasks at once)
- Undo/redo
- Any frontend UI for approval — approval happens in Claude Code chat only
- Local-first mode (Phase 5)
