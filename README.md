# ProPlan — MCP Project Tracker for Claude Code

ProPlan is a Model Context Protocol (MCP) server that gives Claude Code persistent memory about your projects. It tracks phases, milestones, tasks, and session history so Claude can pick up exactly where you left off — without you repeating yourself.

## The Problem It Solves

Every time you open a new Claude Code session, Claude has forgotten everything. You re-explain the project, re-describe what's done, re-state what's next. ProPlan fixes this.

```
You: continue

Claude: I see we were working on the auth middleware. Last session you finished
JWT validation but left the refresh token logic incomplete. You have 3 tasks
in progress across Phase 2. Want to pick up from there?
```

That's it. One word. Full context.

---

## Features

- **Session memory** — `projectGoal`, session summaries, and recent task notes survive across sessions
- **Structured roadmap** — phases → milestones → tasks with `pending / in_progress / completed` status
- **Transactional notes** — every status change carries a note; Claude's intent and outcomes are recorded
- **Structural scan** — `scan_repo` returns a structural summary of your codebase (functions, classes, imports) instead of raw content, keeping token usage low
- **Tech stack persistence** — `scan_repo` stores detected languages and top dependencies in the project blob; visible to Claude on every session start
- **Smart cache** — scan results are hashed; if the directory tree hasn't changed, the cached metadata is returned instantly
- **Task filtering** — `get_tasks` filters by status, phase, or keyword across the full roadmap
- **Local-first** — defaults to SQLite, zero config; optional Supabase sync for the web dashboard
- **Dry-run safety** — all mutations (add/edit/delete) support `dry_run: true` to preview before applying

---

## Quick Setup

### 1. Clone and install

```bash
git clone https://github.com/MetaU-Capstone-Solomon/project-planner.git
cd project-planner/mcp-server
npm install
```

### 2. Run the init script

```bash
npm run init
```

The init script will:
- Ask whether you want local (SQLite) or cloud (Supabase) mode
- Ask whether to write to your project's `.mcp.json` or your user-level `~/.mcp.json`
- Write the correct config and print the next steps

### 3. Restart Claude Code

Reload the MCP server (or restart Claude Code). You're done.

---

## Manual Setup

If you prefer to edit `.mcp.json` yourself:

**Local mode (recommended to start):**
```json
{
  "mcpServers": {
    "project-planner": {
      "command": "node",
      "args": ["/absolute/path/to/project-planner/mcp-server/index.js"]
    }
  }
}
```

**Cloud mode (requires Supabase + MCP token):**
```json
{
  "mcpServers": {
    "project-planner": {
      "command": "node",
      "args": ["/absolute/path/to/project-planner/mcp-server/index.js"],
      "env": {
        "SUPABASE_URL": "your-supabase-url",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key",
        "MCP_TOKEN": "your-mcp-token"
      }
    }
  }
}
```

---

## Skip Approval Prompts (Recommended)

Add this to `~/.claude/settings.json` to auto-approve read-only tools. Write operations (create, edit, delete) stay gated:

```json
{
  "allowedTools": [
    "mcp__project-planner__get_project_status",
    "mcp__project-planner__get_next_tasks",
    "mcp__project-planner__get_project_roadmap",
    "mcp__project-planner__get_tasks",
    "mcp__project-planner__add_session_summary",
    "mcp__project-planner__update_task_status",
    "mcp__project-planner__add_note_to_task"
  ]
}
```

---

## How It Works

### Starting a project

Ask Claude to create a project from your plan doc or from scratch:

```
scan_repo my project at docs/plan.md, then create a project from it
```

Claude will call `scan_repo` to read the doc, then `create_project` with a full phase/milestone/task breakdown. After creation, call `set_project_goal` to anchor the permanent north-star goal.

### During a session

As Claude works through tasks, it calls `update_task_status` with notes:

```
in_progress note: "Implementing refresh token rotation — writing the DB update first"
completed note:   "Refresh token rotation done. Next: add rate limiting middleware"
```

These notes are stored permanently and surfaced in every session handoff.

### Resuming a session

Claude calls `get_project_status` with `include_handoff: true` — one call that returns:
- Overall completion stats
- `projectGoal` — the permanent anchor you set at project creation
- `lastSession` — what was done last time, key decisions, what's next
- `recentTasks` — last N tasks with their most recent notes, `in_progress` sorted first
- `tech_metadata` — detected languages and top dependencies (if `scan_repo` was run)

### Scanning a repo

```
scan_repo path: "src/", project_id: "<your-project-id>"
```

Returns the directory tree, key file contents (README, package.json, markdown docs), and a structural summary of source files (functions, classes, imports per file). Persists `tech_metadata` to the project. On subsequent scans, if the directory tree hash matches, returns the cached metadata instantly.

---

## Available Tools

| Tool | Description |
|------|-------------|
| `get_project_status` | Status for one or all projects. `include_handoff: true` returns full session resume context. |
| `get_project_roadmap` | Full roadmap. `summary_only: true` strips descriptions and notes for a lightweight view. |
| `get_next_tasks` | Next pending/in-progress tasks ordered by phase and milestone. |
| `get_tasks` | Filter tasks by `status`, `phase_id`, and/or `keyword`. |
| `get_session_handoff` | Session resume context — goal, last session, recent tasks with notes. |
| `create_project` | Create a project with full phase/milestone/task structure. |
| `update_task_status` | Update task status with a required note (max 150 chars). |
| `add_note_to_task` | Append a note to a task without changing status. |
| `add_task` | Add a task to a milestone. Supports `dry_run`. |
| `add_milestone` | Add a milestone to a phase. Supports `dry_run`. |
| `add_phase` | Add a phase to a project. Supports `dry_run`. |
| `edit_task` | Edit task title, description, or technology. Supports `dry_run`. |
| `edit_milestone` | Rename a milestone. Supports `dry_run`. |
| `edit_phase` | Rename a phase. Supports `dry_run`. |
| `delete_task` | Permanently delete a task. Supports `dry_run`. |
| `delete_milestone` | Permanently delete a milestone and its tasks. Supports `dry_run`. |
| `delete_phase` | Permanently delete a phase and all its contents. Supports `dry_run`. |
| `delete_project` | Permanently delete a project. Supports `dry_run`. |
| `rename_project` | Rename a project. |
| `set_project_goal` | Set the permanent project goal shown in every session handoff. |
| `add_session_summary` | Save a session summary (capped at 10; oldest dropped). |
| `scan_repo` | Scan directory tree + structural analysis. Persists `tech_metadata` when `project_id` given. |
| `export_to_cloud` | Migrate local SQLite projects to Supabase. |

---

## Data Storage

**Local mode:** All data lives in `.project-planner/db.sqlite` inside your project directory. Nothing leaves your machine.

**Cloud mode:** Data syncs to your Supabase instance and is visible in the ProPlan web dashboard. Requires a Supabase project and an MCP token from the dashboard settings.

---

## Project Structure

```
mcp-server/
  index.js              # MCP server entry point — tool registration
  bin/
    init.js             # Setup CLI — writes .mcp.json for you
  adapters/
    SqliteAdapter.js    # Local SQLite storage
    SupabaseAdapter.js  # Cloud Supabase storage
  tools/                # One file per MCP tool
  lib/
    fileAnalyzer.js     # Zero-dependency structural analyzer (JS/TS/Python/Go/Rust)
  tests/                # Jest test suite (187 tests)
```

---

## License

MIT
