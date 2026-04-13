# ProPlan MCP

Persistent project memory and session continuity for Claude Code. Never lose context between sessions.

## What it does

- **Remembers your project** — phases, milestones, tasks, and progress survive across sessions
- **Resumes automatically** — Claude picks up exactly where you left off
- **Scans your repo** — run `scan_repo` once and Claude understands your codebase
- **Works offline** — SQLite local mode, no account required
- **Syncs to dashboard** — optional cloud sync to [proplan.dev](https://project-planner-7zw4.onrender.com)

## Quick start

```bash
npx @proplandev/mcp init
```

That's it. The wizard:
- Writes `.mcp.json` so Claude Code finds the server
- Writes `CLAUDE.md` with session resume instructions
- Updates `.gitignore` to protect local data
- Auto-adds all ProPlan tools to Claude settings (skips approval prompts)

Then restart Claude Code, open your project, and type **start** or **continue**.

## Tools

| Tool | What it does |
|---|---|
| `get_project_status` | List projects or get full status + session handoff |
| `create_project` | Create a new project with phases, milestones, tasks |
| `scan_repo` | Analyze codebase structure and auto-generate a roadmap |
| `get_project_roadmap` | Full roadmap JSON |
| `get_tasks` | Tasks filtered by status, milestone, or phase |
| `get_next_tasks` | What to work on next |
| `update_task_status` | Mark tasks pending / in_progress / completed |
| `add_note_to_task` | Attach notes to a task |
| `add_task` | Add a task to a milestone |
| `edit_task` | Edit task title or description |
| `delete_task` | Delete a task |
| `add_milestone` | Add a milestone to a phase |
| `edit_milestone` | Rename a milestone |
| `delete_milestone` | Delete a milestone and its tasks |
| `add_phase` | Add a phase to the roadmap |
| `edit_phase` | Rename a phase |
| `delete_phase` | Delete a phase and its milestones |
| `rename_project` | Rename a project |
| `delete_project` | Permanently delete a project |
| `set_project_goal` | Set the north-star goal for a project |
| `add_session_summary` | Record what was done this session (auto-syncs if token cached) |
| `export_to_cloud` | Sync local projects to the ProPlan dashboard |
| `import_from_cloud` | Pull a project from the dashboard into local SQLite |

## Storage

**Local (default)** — data stored in `.project-planner/db.sqlite` in your project. No account needed. Everything stays on your machine.

**Sync to dashboard** — run `export_to_cloud` from Claude Code at any time to push your projects to [proplan.dev](https://project-planner-7zw4.onrender.com). Requires a free account and MCP token from Settings → Claude Code Integration.

**Import from dashboard** — if you created a project on the dashboard first, run `import_from_cloud` to pull it into your local SQLite and start tracking it in Claude Code.

## Manual setup

If you prefer to configure `.mcp.json` yourself:

```json
{
  "mcpServers": {
    "project-planner": {
      "command": "npx",
      "args": ["-y", "@proplandev/mcp"]
    }
  }
}
```

## Requirements

- Node.js 18+
- Claude Code (or any MCP-compatible client)
