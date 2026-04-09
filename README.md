<div align="center">

# ProPlan

**Persistent project memory for Claude Code**

Give Claude a permanent brain for your codebase — it remembers goals, decisions, and progress across every session.

[![npm](https://img.shields.io/npm/v/@proplandev/mcp?color=black&label=npm)](https://www.npmjs.com/package/@proplandev/mcp)
[![license](https://img.shields.io/github/license/MetaU-Capstone-Solomon/project-planner?color=black)](LICENSE)
[![tests](https://img.shields.io/badge/tests-199%20passing-black)](mcp-server/tests)
[![node](https://img.shields.io/badge/node-%3E%3D18-black)](https://nodejs.org)
[![MCP](https://img.shields.io/badge/MCP-compatible-black)](https://modelcontextprotocol.io)

[Quick Start](#quick-start) · [How It Works](#how-it-works) · [Tools](#available-tools) · [Manual Setup](#manual-setup)

</div>

---

## The Problem

Every time you open a new Claude Code session, Claude has forgotten everything. You re-explain the project. You re-describe what's done. You re-state what's next.

**ProPlan fixes this.**

```
You: continue

Claude: I see we were working on the auth middleware. Last session you finished
        JWT validation but left the refresh token logic incomplete. You have 3
        tasks in progress across Phase 2. Want to pick up from there?
```

> **One word. Full context.**

<!-- When you have a demo GIF, drop it here:
![ProPlan demo](docs/demo.gif)
-->

---

## Features

| | |
|---|---|
| **Session Memory** | `projectGoal`, session summaries, and task notes survive every session restart |
| **Structured Roadmap** | Phases → Milestones → Tasks with `pending / in_progress / completed` tracking |
| **Transactional Notes** | Every status change carries a note — Claude's intent and outcomes are permanently recorded |
| **Structural Code Scan** | `scan_repo` extracts functions, classes, and imports from source files instead of dumping raw content |
| **Tech Stack Persistence** | Detected languages, dependencies, and file map stored in the project — visible on every session start |
| **Smart Cache** | Directory tree is hashed — if nothing changed, cached metadata is returned instantly |
| **Task Filtering** | `get_tasks` filters by status, phase, or keyword across the full roadmap (up to 500 results) |
| **Local-First** | Defaults to SQLite, zero config. Optional Supabase sync for the web dashboard. |
| **Dry-Run Safety** | Every mutation supports `dry_run: true` — preview before you apply |

---

## Quick Start

**Three commands. No config files to hand-edit.**

```bash
# 1. Clone and install
git clone https://github.com/MetaU-Capstone-Solomon/project-planner.git
cd project-planner/mcp-server
npm install

# 2. Run the interactive setup
npm run init

# 3. Restart Claude Code — you're done
```

The `init` script detects your environment, asks local vs cloud mode, and writes `.mcp.json` for you.

---

## Skip Approval Prompts

Add this to `~/.claude/settings.json` to auto-approve read-only tools. Write operations stay gated behind approval.

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

### 1 — Create a project

Point Claude at your plan doc or describe it from scratch:

```
scan_repo path: "docs/plan.md", then create a project from it
```

Claude reads the doc, generates a full phase/milestone/task breakdown, and stores it locally. Set a permanent goal with `set_project_goal` — this becomes the north-star anchor Claude sees on every future session start.

### 2 — Work with notes

Every status update carries a note. Claude writes the intent going in, and the outcome coming out:

```
in_progress → "Implementing refresh token rotation — writing the DB update first"
completed   → "Refresh token rotation done. Next: add rate limiting middleware"
```

These notes are stored permanently in the task record.

### 3 — Resume from anywhere

On session start, Claude calls `get_project_status` with `include_handoff: true` — **one tool call** that returns:

- Overall completion stats and current phase
- `projectGoal` — the permanent anchor
- `lastSession` — what was done, key decisions, what comes next
- `recentTasks` — last N tasks with notes, `in_progress` sorted first
- `tech_metadata` — detected languages and top dependencies

No second tool call. No re-explaining. Full context in one round trip.

### 4 — Scan your repo

```
scan_repo path: "src/", project_id: "<uuid>"
```

Returns the directory tree, markdown docs, and a structural summary of every source file — functions, classes, imports, exports. No raw file dumps. Persists to the project blob. Hash-cached so subsequent scans on unchanged repos cost zero tokens.

---

## Available Tools

### Read Tools *(auto-approvable)*

| Tool | Description |
|------|-------------|
| `get_project_status` | Status for one or all projects. Pass `include_handoff: true` for full session resume context in one call. |
| `get_project_roadmap` | Full roadmap. `summary_only: true` strips descriptions and notes for a lightweight token-efficient view. |
| `get_next_tasks` | Next `pending` or `in_progress` tasks ordered by phase → milestone. |
| `get_tasks` | Filter by `status`, `phase_id`, and/or `keyword`. Default 100, max 500 results. |
| `scan_repo` | Directory tree + structural code analysis. Persists `tech_metadata` when `project_id` provided. |

### Write Tools *(approval required)*

| Tool | Description |
|------|-------------|
| `create_project` | Create a project with full phase/milestone/task structure. |
| `update_task_status` | Update status with a required note (max 150 chars). |
| `add_note_to_task` | Append a note without changing status. |
| `add_task` | Add a task to a milestone. Supports `dry_run`. |
| `add_milestone` | Add a milestone to a phase. Supports `dry_run`. |
| `add_phase` | Add a phase to a project. Supports `dry_run`. |
| `edit_task` | Edit title, description, or technology. Supports `dry_run`. |
| `edit_milestone` | Rename a milestone. Supports `dry_run`. |
| `edit_phase` | Rename a phase. Supports `dry_run`. |
| `delete_task` | Permanently delete a task. Supports `dry_run`. |
| `delete_milestone` | Delete a milestone and all its tasks. Supports `dry_run`. |
| `delete_phase` | Delete a phase and all its contents. Supports `dry_run`. |
| `delete_project` | Delete a project entirely. Supports `dry_run`. |
| `rename_project` | Rename a project. |
| `set_project_goal` | Set the permanent project goal shown on every session start. |
| `add_session_summary` | Save a session summary. Capped at 10 — oldest dropped automatically. |
| `export_to_cloud` | Migrate local SQLite projects to Supabase. |

---

## Manual Setup

Prefer to edit `.mcp.json` yourself? Here are the two configs:

<details>
<summary><strong>Local mode</strong> (SQLite — recommended to start)</summary>

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

Data lives in `.project-planner/db.sqlite` inside your project. Nothing leaves your machine.

</details>

<details>
<summary><strong>Cloud mode</strong> (Supabase + web dashboard)</summary>

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

Data syncs to your Supabase instance and appears in the ProPlan web dashboard. MCP token is generated from the dashboard settings page.

</details>

---

## Token Efficiency

ProPlan is designed to keep Claude's context lean:

| Scenario | Without ProPlan | With ProPlan |
|---|---|---|
| Repo scan (100 source files) | ~500KB raw content | ~30KB structural summaries |
| Roadmap read (50 tasks) | ~40KB with all descriptions | ~8KB with `summary_only: true` |
| Session start | 2 tool calls | 1 call with `include_handoff: true` |
| Re-scan unchanged repo | Full analysis every time | Hash match → cached instantly |
| Task descriptions | Unbounded | Hard-capped at 300 chars |

---

## Project Structure

```
mcp-server/
├── index.js              # MCP server — tool registration
├── bin/
│   └── init.js           # Interactive setup CLI
├── adapters/
│   ├── SqliteAdapter.js  # Local SQLite storage
│   └── SupabaseAdapter.js# Cloud Supabase storage
├── tools/                # One file per MCP tool (21 tools)
├── lib/
│   └── fileAnalyzer.js   # Zero-dependency structural analyzer
│                         # Supports JS/TS/Python/Go/Rust
└── tests/                # Jest test suite — 199 tests, real SQLite
```

---

## Requirements

- Node.js 18+
- Claude Code (or any MCP-compatible client)
- For cloud mode: a Supabase project

---

## License

MIT · Built by [Solomon Agyire](https://github.com/MetaU-Capstone-Solomon)
