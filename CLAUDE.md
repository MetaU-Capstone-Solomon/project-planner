# Claude Code Instructions

## Session Start (ALWAYS DO THIS FIRST)

1. Call `get_project_status` (MCP tool)
2. **If no projects exist:**
   - Read `docs/PROJECT_SCOPE.md` (if it exists) and offer to create a tracking project from it
   - If no scope doc exists, ask: "Do you have an existing project to map out, a plan doc to import, or are you starting from scratch?"
3. **If projects exist:**
   - Call `get_project_status` with `include_handoff: true` on the active/most-recently-updated project
   - Read `projectGoal`, `lastSession`, `recentTasks`, and `tech_metadata` from the single response
   - State exactly where things stand and continue — your first words should be "I see we were working on X..."
   - **Never ask the user to re-explain context**
   - **Never call `get_session_handoff` separately — `include_handoff: true` covers it**

## Resuming Work

When the user says "continue", "proceed", "where were we", "pick up where we left off", or starts a session without a specific command — follow the Session Start steps above. Do not ask clarifying questions before calling the tools.

## During Work

- When marking a task `in_progress`: call `update_task_status` with a note describing what you're about to do (max 150 chars)
- When marking a task `completed`: call `update_task_status` with a note describing what was done and what's next (max 150 chars)
- Bad note: "Starting the task now." — Good note: "Implementing transactional note in updateTaskStatus — single DB write."

## Session End (REQUIRED)

Before closing any working session, call `add_session_summary` with 3-5 sentences:
- What was worked on
- Key decisions made
- What comes next

## Project Context

`docs/PROJECT_SCOPE.md` — full feature list, tech stack, DB schema, file map, what's done/pending. Read it when you need architectural context or when creating a new project plan from it.

## Git Commits

- **NEVER add `Co-Authored-By:` trailers to commit messages.** The user does not want Claude appearing as a contributor on GitHub.
- Write clean commit messages with no attribution lines.

## Working Style

- Always update `docs/PROJECT_SCOPE.md` when a phase completes or a new decision is made.
- When creating a project from the scope doc, map each phase as a phase, each major feature area as a milestone, and each concrete deliverable as a task.
