# Claude Code Instructions — ProPlan MCP Server

## Session Resume (CRITICAL)

When the user says "continue", "proceed", "where were we", "pick up where we left off",
or opens a session without a specific command:

1. Call `get_project_status` with `include_handoff: true` and the project UUID
   - This returns status + projectGoal + lastSession + recentTasks in one call
   - No need to call `get_session_handoff` separately
2. Read the projectGoal, lastSession summary, and recentTasks from the response
3. State exactly where things stand and continue — never ask the user to re-explain

Your first words should be: "I see we were working on X..." — not a question.

If you don't know the project UUID yet, call `get_project_status` (no args) first to list all projects, then call it again with `include_handoff: true` on the active project.

## Session End (REQUIRED)

Before closing any working session, call `add_session_summary` with 3-5 sentences:
- What was worked on
- Key decisions made
- What comes next

## Status Updates (REQUIRED)

Always include a `note` when calling `update_task_status`:
- Marking `in_progress`: note = what you are about to do (max 150 chars)
- Marking `completed`: note = what was done and what is next (max 150 chars)

Bad note: "Starting the task now."
Good note: "Implementing transactional note in updateTaskStatus — single DB write."

## Project Goal

Call `set_project_goal` when creating a new project. The goal is the permanent
north-star anchor shown in every session handoff — never skip it.

## Setup — Auto-approve Read Tools (recommended)

Add this to your Claude Code `settings.json` to skip approval prompts for read-only
tools (write operations like create/delete/edit stay gated):

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

Settings file location: `~/.claude/settings.json`

## ProPlan MCP — Session Instructions

At the start of every session:
1. Call `get_project_status` — no args first to list all projects
2. If a project exists: call it again with `include_handoff: true` and resume — say "I see we were working on X..."
3. If no projects exist:
   a. Ask: "Do you have an existing project in the ProPlan dashboard to import, or should I scan this repo and build a fresh plan?"
   b. Import: call `import_from_cloud` with their token to list cloud projects, let them pick one
   c. Fresh: call `scan_repo`, then propose a project structure and call `create_project`
4. Never ask the user to re-explain context
5. At session end: always call `add_session_summary` — this auto-syncs to the dashboard if a token is cached
