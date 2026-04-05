# Project Planner — Full Project Scope & Implementation Record

> **Purpose:** This document is the single source of truth for every feature, technical decision, and implementation detail discussed. Feed it to Claude at the start of each session to resume without losing context.

**Last updated:** 2026-04-03  
**Intern:** Solomon Agyire | **Manager:** Jessica Sun | **Director:** Zahra Surani

---

## CURRENT SESSION STATUS

> **READ THIS FIRST before doing anything in a new session.**

---

### Phase 1 — Full UI Redesign ✅ COMPLETE (merged to main 2026-04-01)

**All 24 tasks shipped and merged.** The frontend has been fully rebuilt.

**What was delivered:**
- CSS design token system: `frontend/src/index.css` — CSS custom properties for all colors, shadows, radius; full light + dark mode via `.dark` class + `data-theme` attr
- Tailwind config simplified to semantic CSS var tokens (`frontend/tailwind.config.js`)
- Framer Motion installed + motion constants (`frontend/src/constants/motion.js`): `spring`, `stagger`, `pageTransition`, `scaleIn`, `fade`
- ThemeContext updated — persists to localStorage, syncs `.dark` class and `data-theme`, exposes `theme`/`toggleTheme` (`frontend/src/contexts/ThemeContext.jsx`)
- **12 new base UI components** in `frontend/src/components/ui/`:
  - `Button` — 4 variants (primary/secondary/ghost/destructive), 3 sizes, loading state
  - `Card` — hover-lift with spring animation
  - `Badge` — 8 variants including admin/editor/viewer role badges
  - `Input` + `Textarea` — focus glow, label association via `useId`, error state
  - `Modal` — AnimatePresence, Escape key, backdrop blur, bottom-sheet on mobile
  - `Spinner` + `Skeleton` — shimmer loading states
  - `Avatar` + `AvatarGroup` — initials fallback, deterministic color, stacked group
  - `Tooltip` — 4 positions, hover-controlled
  - `ProgressRing` — animated SVG with `useMotionValue`/`useTransform`, glow filter
  - `ThemeToggle` — spring rotate animation on icon swap
- **App.jsx** — `AnimatePresence mode="wait"` page transitions, `/profile → /settings` redirect (`frontend/src/App.jsx`)
- **RootLayout + Navbar** — sticky blur nav, `layoutId` sliding active indicator, ThemeToggle, Avatar linked to settings (`frontend/src/layouts/RootLayout.jsx`)
- **Landing page** — 3D parallax card stack (mouse-move CSS vars), hero stagger, features `whileInView`, orb background (`frontend/src/pages/Home/Home.jsx`)
- **Auth page** — split layout (dark left panel with orb + dot pattern, light right panel), Google OAuth only (`frontend/src/pages/Auth/Auth.jsx`)
- **Auth Callback** — swapped old LoadingSpinner for `ui/Spinner` (`frontend/src/pages/Auth/Callback.jsx`)
- **Dashboard** — 4 stat cards with `ProgressRing`, stagger grid, project cards with inline progress, skeleton loading, empty state (`frontend/src/pages/Dashboard/Dashboard.jsx`)
- **New Project Chat** — 2-panel layout (input left, roadmap output right), drag-drop file upload zone, generation skeletons, preserved all existing hooks (`frontend/src/pages/NewProjectChat/NewProjectChatPage.jsx`)
- **Project Detail** — 3-panel layout: left sidebar phase nav (with `layoutId` indicator + ProgressRing), main content with `PhaseSection` accordion, fixed bottom progress bar, mobile scrollable phase tabs, MCP placeholder in sidebar (`frontend/src/pages/ProjectDetail/ProjectDetailPage.jsx`)
- **Settings** — consolidated single-scroll page: Profile section, 3 role cards (Developer/Founder/Student) with animated selection, API key section with usage bar (`frontend/src/pages/Settings/SettingsPage.jsx`)
- **Accept Invitation** — animated 3-state card (loading/success/error) with SVG path-draw checkmark, orb background (`frontend/src/pages/AcceptInvitation/AcceptInvitationPage.jsx`)
- **Profile** — simplified to `<Navigate to="/settings" replace />` (`frontend/src/pages/Profile/Profile.jsx`)

**UI polish completed (2026-04-01 session):**
- Committed all pre-Phase-1 unstaged collaboration work (backend services, TeamPanel, projectService, SQL fix files)
- Fixed double `pageTransition` animation: removed redundant `motion.div` wrapper from `RootLayout` — each page handles its own transition
- Fixed `group-hover` arrow animation on Dashboard project cards (added `group` class to `Card`)
- Fixed file-upload spinner size (lg → sm for inline text context)
- Wired `TeamPanel` into `ProjectDetailPage`: added `teamPanelOpen` state, Team button (admin-only, alongside Invite/Phase), and rendered `<TeamPanel>` in modal section

---

### Phase 2 — Role Functionalities ✅ COMPLETE (on branch `phase-2-role-functionalities`, 2026-04-03)

**Branch:** `phase-2-role-functionalities` — ready to merge into `main`.  
**Spec:** `docs/superpowers/specs/2026-04-01-phase2-role-functionalities-design.md`  
**Scope:** Frontend-only. No new DB columns, no new API routes.

**What was delivered:**

**Foundation:**
- `frontend/src/constants/roleConfig.js` — `ROLE_CONFIG` + `DEFAULT_CONFIG` feature flag objects per role
- `frontend/src/hooks/useRoleConfig.js` — `useRoleConfig()` returns `{ role, config }` built on existing `useUserRole`

**New components:**
- `McpStatusBadge` — "MCP disconnected" with tooltip "coming in Phase 3"; used in Dashboard header and ProjectDetail sidebar
- `TaskExplainer` — Student "Explain this" + "Break it down" buttons; calls `POST /api/chat` with role-specific prompt, shows response inline in collapsible panel
- `TeamOverviewWidget` — Founder/PM dashboard widget; shows each project with collaborator `AvatarGroup` and count
- `LearningPathBar` — Student dashboard bar; cross-project task completion progress with spring animation

**Dashboard (`Dashboard.jsx`):**
- Fixed stat key mismatch bug (was always showing 0 for completed/tasks/members — keys were wrong)
- Founder/PM: milestone-oriented stat card labels, `TeamOverviewWidget`, always-visible Invite button
- Developer: tech stack filter chips above project grid, estimated hours badge on project cards
- Student: `LearningPathBar`, encouragement banner that adapts copy to completion percentage
- All roles: `McpStatusBadge` in header subtitle

**ProjectDetail (`ProjectDetailPage.jsx`):**
- Replaced hardcoded MCP placeholder text with `McpStatusBadge` component in sidebar
- Developer: clickable resource link badges (external links) + estimated hours per task inline
- Student: `TaskExplainer` rendered on every task item
- Founder/PM: Invite button always visible in header regardless of `userRole`
- `config` prop passed to `PhaseSection` for all task-level role features

**Settings (`SettingsPage.jsx`):**
- Developer (`settingsDefaultApiKey`): API key section scrolls into view on mount
- Student (`hideApiKeyNudge`): entire API key section hidden

**Next session — first action:**
1. Merge `phase-2-role-functionalities` into `main` (same stash/merge flow as Phase 1)
2. Start Phase 3 — MCP Server

---

### Phase 3 — MCP Server ✅ COMPLETE (on branch `phase-3-mcp-server`, 2026-04-04)

**Branch:** `phase-3-mcp-server` — ready to merge into `main`.

**Completed:**
- Database: `mcp_tokens` table with RLS
- Backend: 3 new routes (`POST /api/user/mcp-token`, `DELETE /api/user/mcp-token`, `GET /api/user/mcp-token/status`)
- MCP Server: Standalone ESM package with 5 tools (project status, next tasks, update task, add note, roadmap)
- Frontend: `McpStatusBadge`, Settings integration, Realtime subscription for live updates
- Tests: 17 tests covering token format, PAT validation, all 5 tools

**Next session — first action:**
1. Apply `backend/migrations/add-mcp-tokens.sql` in Supabase dashboard (SQL Editor)
2. Enable Realtime for the `roadmap` table (Supabase dashboard → Database → Replication)
3. Merge `phase-3-mcp-server` into `main` (same stash/merge flow as Phase 1 and 2)
4. Determine Phase 4 scope

---

### Phase 2 — Role Functionalities (detail, for reference)

**All three roles (Developer, Founder/PM, Student) get MCP connection as a base feature.**
Each role then adds on top:

**Developer (on top of base):**
- Tech stack quick-filter on dashboard ✅
- Estimated hours shown prominently on tasks ✅
- Code/resource links rendered as clickable badges ✅
- Settings defaults to API key tab ✅

**Founder / PM (on top of base):**
- Task assignment — assign any task to a specific team member ⏳ (deferred — no collaborator picker UI yet)
- Team overview widget on dashboard ✅
- Dashboard stats oriented toward milestones completed ✅
- Invite button always prominent ✅

**Student (on top of base):**
- "Explain this" button on every task ✅
- "Break this down" — splits a task into smaller sub-steps ✅
- Learning Path progress bar across all projects on dashboard
- Encouragement micro-copy at milestone/phase completion
- No API key nudge (free tier is appropriate)

**All roles:**
- MCP status indicator in project header (connected / disconnected)
- Ability to connect Claude Code via MCP

---

### Phase 3 — MCP Server ✅ COMPLETE (on branch `phase-3-mcp-server`, 2026-04-04)

**Branch:** `phase-3-mcp-server` — ready to merge into `main`.  
**Spec:** `docs/superpowers/specs/2026-04-03-phase3-mcp-server-design.md`  
**Plan:** `docs/superpowers/plans/2026-04-03-phase3-mcp-server.md`

**What was delivered:**

**Database:**
- `backend/migrations/add-mcp-tokens.sql` — `mcp_tokens` table with RLS (one token per user, service-role insert only)

**Backend (new routes in `backend/routes/user.js`):**
- `POST /api/user/mcp-token` — generate/replace PAT (`mcp_` + 32 random bytes hex)
- `DELETE /api/user/mcp-token` — revoke PAT
- `GET /api/user/mcp-token/status` — returns `{ exists: boolean }` (never exposes token value)

**MCP Server (`mcp-server/`):**
- Standalone ESM package using `@modelcontextprotocol/sdk` + `@supabase/supabase-js` v2 + `zod`
- PAT validated once on startup → `userId` cached for lifetime of process
- Five tools: `get_project_status`, `get_next_tasks`, `update_task_status`, `add_note_to_task`, `get_project_roadmap`
- `get_next_tasks` supports `limit` param (default 5, max 20) — Claude can fetch 1, 3, or N tasks
- `update_task_status` called once per task — Claude marks a batch complete with sequential calls
- Users configure via `.mcp.json` with `MCP_TOKEN` + Supabase credentials (copy once, done)

**Frontend:**
- `McpStatusBadge` — checks `GET /mcp-token/status` on mount; shows green dot "MCP connected" or gray "MCP disconnected"
- Settings — "Claude Code Integration" section: generate/copy/revoke token + collapsible `.mcp.json` setup instructions
- `ProjectDetailPage` — Supabase Realtime subscription on `roadmap` table; invalidates React Query cache on MCP write → live UI updates

**Tests:**
- `backend/tests/mcpToken.test.js` — token format (3 tests)
- `mcp-server/tests/auth.test.js` — PAT validation (2 tests)
- `mcp-server/tests/tools.test.js` — all 5 tools (12 tests)

**Next session — first action:**
1. Apply `backend/migrations/add-mcp-tokens.sql` in Supabase dashboard (SQL Editor)
2. Enable Realtime for the `roadmap` table (Supabase dashboard → Database → Replication)
3. Merge `phase-3-mcp-server` into `main` (same stash/merge flow as Phase 1 and 2)
4. Determine Phase 4 scope

---

### Unstaged Work on `main`

All collaboration work committed. Phase 2 is on `phase-2-role-functionalities` branch — merge into `main` at session start before beginning Phase 3.

**SQL files are committed but may not yet be applied to Supabase DB:**
- `fix-rls-circular-dependency.sql` — apply if `get_project_collaborators` returns an RLS error
- `fix-roadmap-collaboration-rls.sql` — apply if roadmap collaboration queries fail

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Database Schema](#3-database-schema)
4. [Architecture Overview](#4-architecture-overview)
5. [Feature Areas & Status](#5-feature-areas--status)
   - [5.1 Core — AI Roadmap Generation](#51-core--ai-roadmap-generation)
   - [5.2 Foundation — User Settings, BYOK, Onboarding](#52-foundation--user-settings-byok-onboarding)
   - [5.3 Collaboration — Invitations, Roles, Team Management](#53-collaboration--invitations-roles-team-management)
   - [5.4 Project Management — Edit, Delete, Reorder](#54-project-management--edit-delete-reorder)
   - [5.5 Progress Tracking](#55-progress-tracking)
   - [5.6 Caching](#56-caching)
   - [5.7 Settings Page](#57-settings-page)
6. [What Is Done vs. What Is Pending](#6-what-is-done-vs-what-is-pending)
7. [Unstaged Changes (In-Progress Work)](#7-unstaged-changes-in-progress-work)
8. [Known Issues & Constraints](#8-known-issues--constraints)
9. [File Map — Complete](#9-file-map--complete)
10. [API Endpoints Reference](#10-api-endpoints-reference)
11. [Permission Model](#11-permission-model)
12. [Constants & Messages Reference](#12-constants--messages-reference)

---

## 1. Project Overview

**App:** Project Planner and Roadmap Generator  
**Tagline:** Turn project ideas into actionable, AI-generated step-by-step roadmaps.

**Core loop:**
1. User signs in (Google OAuth via Supabase)
2. User describes a project idea (text or file upload)
3. AI generates a roadmap: phases → milestones → tasks with resources
4. User tracks progress, edits tasks/milestones/phases
5. (Stretch) User invites teammates who collaborate on the same roadmap

**Target users:** Engineering students, developers, founders/PMs.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, TanStack Query v5, React Router v6, Tailwind CSS, lucide-react |
| Backend | Node.js, Express |
| Database | Supabase (PostgreSQL + Auth + RLS) |
| AI — Free tier | Google Gemini (`gemini-2.0-flash` or `gemini-3.1-flash-lite-preview`) via `@google/generative-ai` SDK |
| AI — User BYOK | Gemini (`AIza…` keys) or Claude (`sk-ant-…` keys) via `@anthropic-ai/sdk` |
| API key encryption | Node.js `crypto` — AES-256-GCM |
| File parsing | `pdf-parse`, `mammoth` (DOCX), plain text |
| Email | Nodemailer (SMTP via Gmail or SendGrid) inside `InvitationService` |
| Testing | Jest (backend unit tests) |
| State | React Query (server state), React `useState`/`useContext` (local/auth state) |
| Caching | React Query `staleTime` / `gcTime` per resource type |
| Auth | Supabase Auth — Google OAuth, JWT, session tokens |

---

## 3. Database Schema

### Tables in Production

#### `roadmap` (main projects table — naming is legacy)
Stores all AI-generated project content as a single JSON blob in `content`.

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK → auth.users | owner |
| title | text | project title |
| content | text | full roadmap JSON stringified |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### `project_collaborators`
Tracks team members and their roles on a project.

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| project_id | UUID FK → roadmap(id) ON DELETE CASCADE | |
| user_id | UUID FK → auth.users ON DELETE CASCADE | |
| role | text CHECK IN ('admin', 'editor', 'viewer') | |
| invited_by | UUID FK → auth.users | |
| status | text CHECK IN ('pending', 'accepted', 'declined') | default 'accepted' |
| invited_at | timestamptz | |
| responded_at | timestamptz | |
| UNIQUE | (project_id, user_id) | |

#### `project_invitations`
Tracks email-based invitations (for users not yet registered or not yet logged in).

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| project_id | UUID FK → roadmap(id) ON DELETE CASCADE | |
| email | text | invitee email |
| role | text CHECK IN ('editor', 'viewer') | admin cannot be invited, only owner |
| invited_by | UUID FK → auth.users | |
| token | text UNIQUE | random token included in email link |
| expires_at | timestamptz | 7 days from creation |
| status | text CHECK IN ('pending', 'accepted', 'declined', 'expired') | |
| UNIQUE | (project_id, email) | prevents duplicate invitations |

#### `project_activities` (exists in migration, not actively used yet)
Audit trail for all project events.

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| project_id | UUID FK | |
| user_id | UUID FK | |
| activity_type | text | |
| description | text | |
| metadata | JSONB | |

#### `user_settings`
Per-user configuration: role, BYOK API key, usage tracking.

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK UNIQUE → auth.users | |
| role | text CHECK IN ('developer', 'founder_pm', 'student') | set in Onboarding/Settings |
| api_key_encrypted | text | AES-256-GCM encrypted; NULL = free tier |
| api_provider | text CHECK IN ('gemini', 'claude') | NULL when no key |
| monthly_usage | integer DEFAULT 0 | free-tier generation count |
| usage_limit | integer DEFAULT 10 | free-tier monthly cap |
| usage_reset_at | timestamptz | rolling 30-day reset |
| byok_nudge_dismissed | boolean DEFAULT false | whether user dismissed BYOK prompt |

### DB Functions
- `get_project_collaborators(p_project_id UUID)` — RPC that joins `project_collaborators` with `auth.users` to return full_name + email alongside role.

### RLS Summary
- `roadmap`: owner access + accepted collaborators can view; only owner can delete.
- `project_collaborators`: visible to anyone on the project; admins/owners can insert/delete.
- `project_invitations`: visible to project owner; insert by project owner only.
- `user_settings`: each user can only read/write their own row.

---

## 4. Architecture Overview

```
Browser (React + React Query)
  ↓ /api/* (Express, port 3001)
Backend (Node/Express)
  ├── /api/chat            → AIProviderService → Gemini or Claude
  ├── /api/upload          → FileProcessingService → text extraction + summarization
  ├── /api/summarize       → TextSummarizer
  ├── /api/prioritize      → RoadmapPrioritizationService
  ├── /api/invite-collaborator → InvitationService → Nodemailer (email)
  ├── /api/accept-invitation   → direct Supabase admin client
  └── /api/user/*          → user.js router → Supabase admin client
        GET    /settings   → read user_settings row
        POST   /role       → update role
        POST   /api-key    → validate key, encrypt, store
        DELETE /api-key    → remove key
        POST   /dismiss-byok-nudge → set byok_nudge_dismissed=true
  ↓
Supabase (PostgreSQL + RLS + Auth)
```

**AI routing logic (AIProviderService):**
1. Load `user_settings` for current user (create row if first-time)
2. Reset monthly_usage if `usage_reset_at` is past
3. If `api_key_encrypted` is set → decrypt → route to user's provider (Gemini or Claude)
4. Else (free tier) → check `monthly_usage < usage_limit` → use app's Gemini key → increment counter
5. If limit exceeded → throw `UsageLimitError` (HTTP 429, code `USAGE_LIMIT_REACHED`)

**Key encryption:** AES-256-GCM. Stored as `iv:authTag:ciphertext` (hex-encoded, colon-separated). Key pulled from `ENCRYPTION_KEY` env var (64 hex chars = 32 bytes).

---

## 5. Feature Areas & Status

### 5.1 Core — AI Roadmap Generation

**Status: COMPLETE**

**Flow:**
1. User opens `/new-project-chat`
2. Enters project description (text) or uploads a file (PDF, DOCX, TXT, DOC — max 5MB)
3. File → `/api/upload` → FileProcessingService extracts text → returns `extractedText`
4. Long/unstructured text → `/api/summarize` → TextSummarizer condenses it
5. Description sent to `/api/chat` (with `Authorization: Bearer <jwt>`) → AIProviderService → Gemini/Claude
6. AI returns structured JSON roadmap
7. Roadmap parsed, displayed in `NewProjectChatPage`
8. User clicks Save → stored in `roadmap` table as stringified JSON

**Roadmap data shape (inside `content` JSON):**
```json
{
  "projectName": "...",
  "description": "...",
  "timeline": "3 months",
  "experienceLevel": "Intermediate",
  "technologies": ["React", "Node.js"],
  "scope": "MVP",
  "phases": [
    {
      "id": "phase-1",
      "title": "Setup & Architecture",
      "timeline": "Week 1-2",
      "order": 1,
      "milestones": [
        {
          "id": "milestone-1",
          "title": "Project scaffolding",
          "timeline": "Day 1-3",
          "order": 1,
          "tasks": [
            {
              "id": "task-1",
              "title": "Initialize repo",
              "description": "...",
              "technology": "Git",
              "resources": ["https://..."],
              "status": "pending",
              "order": 1
            }
          ]
        }
      ]
    }
  ]
}
```

**Prioritization:** After generation, `/api/prioritize` re-orders phases/tasks using a weighted scoring algorithm (dependency analysis, timeline fit, experience level, scope, risk assessment). Config-driven weights in `backend/services/prioritizationConfig.js`.

---

### 5.2 Foundation — User Settings, BYOK, Onboarding

**Status: COMPLETE (all committed)**

**Sub-features:**

**Onboarding (OnboardingModal):**
- Fires once when user saves their **first** project
- Shows role picker: Developer / Founder-PM / Student
- Saves role to `user_settings` via `POST /api/user/role`
- Role controls which features are surfaced prominently in ProjectDetailPage

**BYOK Modal (BYOKModal):**
- Trigger 1: First successful AI generation (appears in NewProjectChatPage)
- Trigger 2: User has 1 free generation remaining
- Prompts user to add their own Gemini or Claude API key
- On dismiss: calls `POST /api/user/dismiss-byok-nudge`

**API Key Management (ApiKeyPanel in Settings):**
- User pastes API key
- Auto-detects provider: `sk-ant-` → Claude, `AIza` → Gemini
- Frontend sends key to `POST /api/user/api-key`
- Backend validates key with minimal test call (1 token), then encrypts + stores
- UI shows masked key (`sk-ant-a...••••••••`)
- Delete key button → `DELETE /api/user/api-key`

**Usage Tracking:**
- Dashboard shows banner: "X of 10 free generations used this month. Add your key →"
- Banner only shown when user has no BYOK key and `monthly_usage > 0`
- Resets every 30 days (rolling window)

**Settings Page (`/settings`):**
- Two tabs: Profile (role selection) and API Key
- Deep-linkable via `?tab=api-key`

---

### 5.3 Collaboration — Invitations, Roles, Team Management

**Status: PARTIALLY COMPLETE — collaboration backend + some frontend done; wiring incomplete**

#### What is fully implemented (committed):

**Backend:**
- `POST /api/invite-collaborator` — validates fields, calls InvitationService
- `POST /api/accept-invitation` — validates JWT, checks invitation token, inserts into `project_collaborators`, marks invitation accepted
- `InvitationService.sendInvitation()` — creates token, stores invitation in DB, sends email via Nodemailer
- Email template redesigned (clean, minimal, table-based HTML)

**Frontend:**
- `InviteCollaboratorsModal` — form with email, role (editor/viewer), optional message; validates email, sends to backend
- `checkUserPermission()` in `projectService.js` — checks collaborator table first, then falls back to owner check via `roadmap` table
- Permission checks on `getProject`, `updateProject`, `deleteProject`
- Role-based UI: Invite button shows for `admin` role or `founder_pm` user role
- `MESSAGES.COLLABORATION` constants: roles, permissions, role descriptions
- `AcceptInvitationPage` — route `/accept-invitation?token=…&project=…`, handles auth redirect flow
- `Auth/Callback.jsx` — after OAuth login, checks `localStorage.pendingInvitation` and redirects there

#### What is implemented but NOT yet committed (unstaged):

1. **`frontend/src/pages/AcceptInvitation/AcceptInvitationPage.jsx`** (new file)
   - Reads `token` and `project` from URL query params
   - If not logged in → saves URL to `localStorage.pendingInvitation` → redirects to `/auth`
   - After login, `Callback.jsx` picks up the saved URL and redirects back
   - Calls `POST /api/accept-invitation` with Bearer token
   - Shows success (auto-redirect to project) or error state

2. **`frontend/src/components/Collaboration/TeamPanel.jsx`** (new file)
   - Modal listing all collaborators on a project
   - Calls `getProjectCollaborators()` → `supabase.rpc('get_project_collaborators', …)`
   - Admins see a trash icon to remove members (calls `removeCollaborator()`)
   - Role color badges: admin=purple, editor=blue, viewer=gray

3. **`frontend/src/services/projectService.js`** additions:
   - `getSharedProjects()` — queries `project_collaborators` for accepted entries, fetches those roadmaps, returns with `isShared: true`
   - `getProjectCollaborators(projectId)` — RPC call
   - `removeCollaborator(projectId, userId)` — deletes from `project_collaborators`

4. **`frontend/src/hooks/useDashboardData.js`** — updated to call both `getUserProjects()` and `getSharedProjects()` in parallel, merges results

5. **`frontend/src/components/ProjectCard/ProjectCard.jsx`** — accepts `isShared` prop, shows "Shared" badge with Users icon

6. **`backend/services/invitationService.js`** — cleaner email HTML template

7. **`backend/routes/user.js`** — better error message forwarding for API key validation failures

#### What is STILL MISSING (not built yet):

- **TeamPanel not wired into ProjectDetailPage** — `TeamPanel.jsx` exists but `ProjectDetailPage` does not import or render it; there's no "Team" button to open it
- **Dashboard does not pass `isShared` to ProjectCard** — the `project.isShared` flag is returned by `getSharedProjects` but the Dashboard mapping needs to pass it as a prop
- **No UI to distinguish owned vs. shared projects** in the "Your Roadmaps" list heading (could split into sections or just rely on badge)
- **`MESSAGES.ERROR.COLLABORATORS_LOAD_FAILED`** — referenced in TeamPanel, needs to be verified in constants
- **Shared project edit restrictions in UI** — viewer-role users currently get backend errors when trying to edit; frontend should hide/disable edit controls based on role

---

### 5.4 Project Management — Edit, Delete, Reorder

**Status: COMPLETE (stretch goals)**

- **Editable Tasks:** Edit task title + description via modal in PhaseModal. Validated (no empty titles). Debounced persist (800ms) to Supabase.
- **Milestone Edit/Delete/Reorder:** Drag-and-drop reorder in PhaseModal. Edit modal for details. Delete with confirmation. Frontend validates order before sending. Backend validates edge cases.
- **Phase Create/Edit/Delete:** PhaseModal (create), EditPhaseModal (edit), delete with confirmation. Order preserved.
- **Phase Reorder:** `PHASE_REORDERED` success message. Validated on both frontend and backend.

---

### 5.5 Progress Tracking

**Status: COMPLETE (stretch goal)**

- Task status dropdown: `pending` → `in-progress` → `completed` (+ `blocked`)
- Progress calculated at task, milestone, phase, and overall project level
- `calculateOverallProgress()` in `utils/roadmapUtils.js`
- Progress bars and completion ratios displayed in PhaseCardNew and ProgressBar components
- Task status updates debounced (800ms) before persisting to Supabase
- On persist, React Query cache invalidated for both project detail and user projects

---

### 5.6 Caching

**Status: COMPLETE (stretch goal)**

- TanStack Query v5 (note: `gcTime`, NOT `cacheTime` — v5 renamed it)
- Cache keys: `QUERY_KEYS.USER_PROJECTS`, `QUERY_KEYS.PROJECT_DETAILS`
- `CACHE_CONFIG` in `constants/cache.js` — separate `staleTime`, `gcTime`, `retry` per resource
- On project edit → `queryClient.invalidateQueries([QUERY_KEYS.PROJECT_DETAILS, projectId])` + `queryClient.invalidateQueries([QUERY_KEYS.USER_PROJECTS])`
- Dashboard data cached; only re-fetched when stale or after mutation

---

### 5.7 Settings Page

**Status: COMPLETE**

- Route: `/settings` (protected)
- Nav link in `RootLayout`
- Two tabs: **Profile** (role picker) and **API Key** (ApiKeyPanel)
- Deep-linkable: `?tab=api-key` navigates directly to key tab
- `useUserSettings` hook (React Query) fetches from `GET /api/user/settings`
- `useInvalidateUserSettings` hook to refresh after mutations

---

## 6. What Is Done vs. What Is Pending

### DONE (committed to main)

| Feature | Notes |
|---|---|
| AI roadmap generation (Gemini free tier) | |
| File upload + text extraction (PDF/DOCX/TXT) | |
| Text summarization + prioritization algorithms | |
| Task / Milestone / Phase CRUD (create, edit, delete, reorder) | |
| Progress tracking system | |
| React Query caching (`staleTime`/`gcTime`) | |
| user_settings DB migration | |
| AIProviderService (BYOK routing — Gemini + Claude) | |
| EncryptionService (AES-256-GCM) | |
| Backend user settings API routes | |
| OnboardingModal (role picker) | |
| BYOKModal + ApiKeyPanel | |
| useUserSettings + useUserRole hooks | |
| Usage tracking + indicator on Dashboard | |
| Collaboration DB migration (`project_collaborators`, `project_invitations`) | |
| InvitationService + email sending | |
| `POST /api/invite-collaborator` + `POST /api/accept-invitation` | |
| InviteCollaboratorsModal | |
| `checkUserPermission()` in projectService | |
| Role-based UI gate (Invite button) | |
| Auth Callback pending-invitation redirect | |
| **Phase 1 UI Redesign — all pages rebuilt** | Merged 2026-04-01 |
| CSS design token system (light + dark mode) | `frontend/src/index.css` |
| Tailwind semantic token config | `frontend/tailwind.config.js` |
| 12 base UI components in `frontend/src/components/ui/` | |
| Framer Motion animations across all pages | |
| AnimatePresence page transitions | `frontend/src/App.jsx` |
| RootLayout + sticky navbar redesign | `frontend/src/layouts/RootLayout.jsx` |
| Landing page with 3D card stack | `frontend/src/pages/Home/Home.jsx` |
| Auth split layout + Google-only sign in | `frontend/src/pages/Auth/Auth.jsx` |
| Dashboard — ProgressRing cards + stagger | `frontend/src/pages/Dashboard/Dashboard.jsx` |
| New Project Chat — 2-panel + drag-drop upload | `frontend/src/pages/NewProjectChat/NewProjectChatPage.jsx` |
| Project Detail — 3-panel + sidebar + bottom bar | `frontend/src/pages/ProjectDetail/ProjectDetailPage.jsx` |
| Settings — consolidated single-scroll page | `frontend/src/pages/Settings/SettingsPage.jsx` |
| Accept Invitation — animated SVG states | `frontend/src/pages/AcceptInvitation/AcceptInvitationPage.jsx` |
| Profile — redirect to /settings | `frontend/src/pages/Profile/Profile.jsx` |

### PENDING — Next session priorities

**Step 0 — Commit unstaged work first (see "Unstaged Work" section above)**

**Step 1 — UI polish pass (do this before Phase 2)**
Run the app in browser and walk every page. Identify any visual issues introduced by the redesign. Common things to check:
- Mobile responsiveness on each page
- Dark ↔ light mode toggle on all pages
- ProgressRing rendering in Dashboard cards
- Project Detail sidebar phase nav scrolling
- New Project Chat output panel rendering `ChatContainer` correctly
- Settings role card selection persisting
- Consider lazy-loading heavy pages (`ProjectDetail`, `NewProjectChat`) with `React.lazy` + `Suspense` to reduce 788kB bundle

**Step 2 — Wire TeamPanel into Project Detail**
`TeamPanel.jsx` exists (`frontend/src/components/Collaboration/TeamPanel.jsx`) but was skipped in Phase 1 because its import path wasn't confirmed. The Project Detail page already has a "Team" button that sets `teamPanelOpen` state — just import and render `<TeamPanel>` at the bottom of the return.

**Step 3 — Pass `isShared` from Dashboard data to project cards**
`useDashboardData.js` already returns `isShared` on each project. The Dashboard `ProjectCardItem` already renders a "Shared" badge when `project.isShared` is truthy. Just verify this is flowing through correctly.

**Step 4 — Verify `get_project_collaborators` DB function**
Run in Supabase SQL editor: `SELECT * FROM get_project_collaborators('<any-project-id>');` — if it errors, apply the SQL from `fix-rls-circular-dependency.sql` and `fix-roadmap-collaboration-rls.sql`.

**Step 5 — Phase 2 (Role Functionalities)**
Do not start until Steps 0–4 are done.

---

## 7. Unstaged Work (In-Progress Before Phase 1)

> These files are modified/untracked on `main` but not yet committed. Commit them at the start of the next session before doing anything else.

### Modified files
- `backend/package.json` + `backend/package-lock.json` — dependency updates
- `backend/routes/user.js` — better API key error message forwarding
- `backend/services/aiProviderService.js` — minor tweaks
- `backend/services/fileProcessingService.js` — minor tweaks
- `backend/services/invitationService.js` — email template redesign
- `backend/utils/scoringUtils.js` — minor fix
- `frontend/src/components/ProjectCard/ProjectCard.jsx` — isShared "Shared" badge
- `frontend/src/hooks/useDashboardData.js` — fetches shared + owned projects, returns `isShared` flag
- `frontend/src/pages/Auth/Callback.jsx` — pending invitation redirect on login
- `frontend/src/services/projectService.js` — `getSharedProjects`, `getProjectCollaborators`, `removeCollaborator`

### New untracked files
- `frontend/src/components/Collaboration/TeamPanel.jsx` — team member management panel (needs to be wired into ProjectDetailPage)
- `fix-rls-circular-dependency.sql` — SQL fix for RLS policy
- `fix-roadmap-collaboration-rls.sql` — SQL fix for collaboration RLS

---

## 8. Known Issues & Constraints

1. **React Query v5 naming:** `gcTime` not `cacheTime`. Any new query config must use `gcTime`.
2. **`get_project_collaborators` DB function** — used in `getProjectCollaborators()` via `supabase.rpc()`. Must exist in Supabase. If it doesn't, TeamPanel will fail silently.
3. **Gemini model name** — currently `gemini-3.1-flash-lite-preview` (free tier) and `gemini-3.1-flash-lite-preview` (user key). Was previously `gemini-1.5-flash` — already fixed in a commit.
4. **Claude model for BYOK** — `claude-sonnet-4-5` for generation, `claude-haiku-4-5-20251001` for key validation.
5. **Project title deduplication** — `project_invitations` has `UNIQUE(project_id, email)`. Re-inviting the same email will fail. InvitationService should handle or update the existing invitation.
6. **Owner has no `project_collaborators` row** — permission check first looks in `project_collaborators`, then falls back to ownership check in `roadmap.user_id`. This is by design.
7. **Admin role can only be set directly in DB** — only 'editor' and 'viewer' can be invited via the modal. The project owner is implicitly admin.
8. **`frontend/.npmrc` was deleted** — tracked as a modification in unstaged changes.
9. **Branch is 29 commits ahead of origin/main** — not pushed yet.

---

## 9. File Map — Complete

### Frontend

```
frontend/src/
├── App.jsx                          — routes definition; all page imports
├── main.jsx
├── index.css
├── assets/
├── config/
│   └── api.js                       — API_BASE_URL, API_ENDPOINTS object
├── constants/
│   ├── cache.js                     — CACHE_CONFIG, QUERY_KEYS
│   ├── colors.js                    — COLOR_CLASSES, COLOR_PATTERNS
│   ├── dashboard.js                 — STATS_CONFIG, DASHBOARD_MESSAGES
│   ├── forms.js                     — FORM_LIMITS, MODAL_SIZES, BUTTON_CONFIGS
│   ├── messages.js                  — MESSAGES (all user-facing strings + COLLABORATION)
│   ├── projectCard.js               — getProgressColor
│   ├── roadmap.js                   — MARKDOWN constants
│   └── routes.js                    — ROUTES, getProjectDetailPath
├── contexts/
│   ├── AuthContext.jsx              — user, loading, supabase session
│   └── ThemeContext.jsx             — dark/light mode
├── hooks/
│   ├── useDashboardData.js          — React Query: fetches owned + shared projects, calculates stats
│   ├── useDebouncedCallback.js      — debounce wrapper
│   ├── useUserRole.js               — thin wrapper returning just role string
│   └── useUserSettings.js          — React Query: GET /api/user/settings; useInvalidateUserSettings
├── layouts/
│   └── RootLayout.jsx               — nav bar with links; Settings link added
├── lib/
│   └── supabase.js                  — Supabase client (anon key)
├── pages/
│   ├── AcceptInvitation/
│   │   └── AcceptInvitationPage.jsx — invitation acceptance; auth redirect; success/error UI
│   ├── Auth/
│   │   ├── Auth.jsx                 — Google OAuth sign-in page
│   │   └── Callback.jsx            — handles OAuth callback; pending invitation redirect
│   ├── Dashboard/
│   │   └── Dashboard.jsx           — welcome, stats, project list, usage banner
│   ├── Home/
│   │   └── Home.jsx                — landing page
│   ├── NewProjectChat/
│   │   └── NewProjectChatPage.jsx  — chat UI, file upload, roadmap generation, OnboardingModal, BYOKModal
│   ├── Profile/
│   │   └── Profile.jsx
│   ├── ProjectDetail/
│   │   └── ProjectDetailPage.jsx   — full roadmap view, phase/milestone/task editing, invite modal
│   └── Settings/
│       └── SettingsPage.jsx        — Profile + API Key tabs
├── components/
│   ├── BYOK/
│   │   └── BYOKModal.jsx           — two-trigger BYOK prompt
│   ├── Button/
│   │   └── Button.jsx
│   ├── Chat/                        — chat input components
│   ├── Collaboration/
│   │   ├── InviteCollaboratorsModal.jsx — email + role form; sends invitation
│   │   └── TeamPanel.jsx           — collaborators list modal; remove member (admin only)
│   ├── Form/
│   ├── Layout/
│   ├── Loading/
│   │   └── LoadingSpinner.jsx
│   ├── Logo/
│   ├── MarkdownRenderer/
│   ├── Onboarding/
│   │   └── OnboardingModal.jsx     — role picker; first-project trigger
│   ├── ProjectCard/
│   │   └── ProjectCard.jsx         — project tile; isShared badge (Users icon + "Shared" label)
│   ├── Roadmap/
│   │   ├── PhaseCardNew.jsx        — phase display card; click to open PhaseModal
│   │   ├── PhaseModal.jsx          — milestone/task list; task status dropdown; edit icons
│   │   ├── EditPhaseModal.jsx      — edit phase title/timeline
│   │   ├── PhaseModal.jsx
│   │   ├── ProgressBar.jsx         — progress bar component
│   │   └── Summary.jsx             — project summary header
│   ├── Settings/
│   │   └── ApiKeyPanel.jsx         — key input, validation, masked display, delete
│   └── StatsCard/
├── services/
│   ├── projectService.js           — CRUD + permission checks + shared projects + collaborator management
│   └── aiCacheService.js           — sends /api/chat with Authorization header
└── utils/
    ├── confirmAction.js
    ├── dashboardUtils.js           — calculateProjectStats
    ├── formUtils.js                — getInputClasses, getButtonClasses
    ├── roadmapUtils.js             — calculateOverallProgress, phase/milestone/task helpers
    ├── textSummarizer.js (frontend copy if any)
    ├── toastUtils.js               — showErrorToast, showSuccessToast
    └── validationUtils.js          — validateEmailWithMessage, validateTextLength, isFormValid
```

### Backend

```
backend/
├── index.js                         — Express app; all route mounts; CORS
├── package.json
├── config/
├── constants/
├── middleware/
│   └── auth.js                      — extractUserId middleware (JWT decode, sets req.userId)
├── routes/
│   └── user.js                      — GET /settings, POST /role, POST /api-key, DELETE /api-key, POST /dismiss-byok-nudge
├── services/
│   ├── aiProviderService.js         — AIProviderService: routing, usage, BYOK
│   ├── encryptionService.js         — AES-256-GCM encrypt/decrypt
│   ├── fileProcessingService.js     — PDF/DOCX/TXT text extraction
│   ├── invitationService.js         — token generation, DB insert, email send
│   ├── prioritizationConfig.js      — scoring weights config
│   └── prioritizationService.js    — weighted scoring algorithm
├── tests/
│   ├── encryptionService.test.js
│   └── aiProviderService.test.js
└── utils/
    └── textSummarizer.js            — keyword extraction + sentence ranking
```

### Database Migrations (run in Supabase SQL Editor)

| File | Purpose |
|---|---|
| `database-migration.sql` | Core tables (roadmap, etc.) |
| `database-migration-collaboration.sql` | project_collaborators, project_invitations, project_activities + RLS + indexes |
| `database-migration-user-settings.sql` | user_settings table + RLS |
| `fix-existing-projects.sql` | One-time fix for existing project data |
| `fix-rls-circular-dependency.sql` | RLS policy fix |
| `fix-rls-policies.sql` | RLS policy fix |
| `fix-roadmap-collaboration-rls.sql` | RLS policy fix for roadmap + collaborators |

---

## 10. API Endpoints Reference

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/chat` | Bearer JWT | AI generation (BYOK or free tier) |
| POST | `/api/upload` | None | File upload → text extraction |
| POST | `/api/summarize` | None | Text summarization |
| POST | `/api/prioritize` | None | Roadmap phase/task reordering |
| POST | `/api/invite-collaborator` | None (validated by service) | Send email invitation |
| POST | `/api/accept-invitation` | Bearer JWT | Accept invitation token |
| GET | `/api/user/settings` | Bearer JWT | Get role, usage, provider, masked key |
| POST | `/api/user/role` | Bearer JWT | Set user role |
| POST | `/api/user/api-key` | Bearer JWT | Validate + store BYOK key |
| DELETE | `/api/user/api-key` | Bearer JWT | Remove BYOK key |
| POST | `/api/user/dismiss-byok-nudge` | Bearer JWT | Mark BYOK modal as dismissed |

**Frontend constants (API_ENDPOINTS):**
```js
CHAT, UPLOAD, SUMMARIZE (no constant — called directly),
INVITE_COLLABORATOR, ACCEPT_INVITATION,
USER_SETTINGS, USER_ROLE, USER_API_KEY, DISMISS_BYOK
```

---

## 11. Permission Model

### Roles
| Role | Set By | Notes |
|---|---|---|
| `admin` | Implicit (project owner) | Full control — edit, delete project, invite others |
| `editor` | Invitation | Can edit tasks, milestones, phases; cannot delete project or invite |
| `viewer` | Invitation | Read-only; can only view and track own progress |

### Permission Matrix
| Action | admin/owner | editor | viewer |
|---|---|---|---|
| View project | ✅ | ✅ | ✅ |
| Edit tasks/milestones/phases | ✅ | ✅ | ❌ |
| Delete project | ✅ | ❌ | ❌ |
| Invite collaborators | ✅ | ❌ | ❌ |
| Remove collaborators | ✅ | ❌ | ❌ |
| Update task status | ✅ | ✅ | ✅ (own tracking) |

### Frontend role check flow (`checkUserPermission`)
1. Call `supabase.from('project_collaborators').select('role, status').eq('project_id', …).eq('user_id', …).eq('status', 'accepted')`
2. If row found → map role to permissions via `getPermissionForRole(role, permission)`
3. If no row → check `roadmap.user_id === currentUser.id` → owner → all permissions

### User Role (separate concept — onboarding role)
The `role` field in `user_settings` (`developer`, `founder_pm`, `student`) is a **UX role** not a permission role. It controls which features are surfaced prominently:
- `founder_pm` → Invite button shown prominently in ProjectDetailPage
- `developer` → MCP Setup Card placeholder visible (future feature)
- `student` → Standard view

---

## 12. Constants & Messages Reference

### `MESSAGES.COLLABORATION`
```js
ROLES: { ADMIN: 'admin', EDITOR: 'editor', VIEWER: 'viewer' }
PERMISSIONS: { VIEW: 'view', EDIT: 'edit', DELETE: 'delete', INVITE: 'invite' }
ROLE_DESCRIPTIONS: { admin: '…', editor: '…', viewer: '…' }
```

### Key error messages
- `COLLABORATORS_LOAD_FAILED` — used in TeamPanel
- `INVITATION_FAILED` — used in InviteCollaboratorsModal
- `INVITATION_ACCEPT_FAILED` — used in AcceptInvitationPage
- `PERMISSION_DENIED` — used in removeCollaborator handler
- `USAGE_LIMIT_REACHED` — shown when free tier exhausted
- `API_KEY_INVALID` — shown when BYOK key fails validation

### `QUERY_KEYS`
```js
USER_PROJECTS: 'userProjects'
PROJECT_DETAILS: 'projectDetails'
```

### `CACHE_CONFIG`
Separate staleTime, gcTime, retry per resource. Configured in `constants/cache.js`.

---

## Next Steps (Recommended Order)

### Immediate — Before Phase 1 UI Work Starts
1. **Commit all unstaged collaboration work** — group into a single commit: "feat: collaboration dashboard, shared projects, team panel, accept invitation page"
2. **Wire TeamPanel into ProjectDetailPage** — add "Team" button in the header, import TeamPanel, pass `isAdmin={userRole === 'admin'}` and `currentUserId={user?.id}`
3. **Pass `isShared` from Dashboard to ProjectCard** — in Dashboard's project list render, check `project.isShared` and pass as prop
4. **Verify `get_project_collaborators` DB function** — run in Supabase SQL Editor to confirm it exists
5. **Role-aware edit UI** — after loading project, use `userRole` state to hide/disable edit controls for viewers
6. **Test full invitation flow end-to-end** — invite email → click link → auth → accept → redirect to project → collaborator appears in TeamPanel
7. **Push to origin/main** — currently 29 commits ahead and not pushed

### Phase 1 — UI Redesign (CURRENTLY BEING PLANNED)
- Finish design spec → write implementation plan → execute page by page
- See `CURRENT SESSION STATUS` section at top of this file for full Phase 1 scope
- New library to add: **Framer Motion** (spring physics, page transitions)
- Design spec will be saved to: `docs/superpowers/specs/YYYY-MM-DD-ui-redesign-design.md`
- Implementation plan will be saved to: `docs/superpowers/plans/YYYY-MM-DD-ui-redesign.md`

### Phase 2 — Role Functionalities (NOT STARTED — after Phase 1 ships)
- See `CURRENT SESSION STATUS` section for full role breakdown
- Requires backend changes for task assignment (new `task_assignments` column or table)

### Phase 3 — MCP Server (NOT STARTED — after Phase 2 ships)
- See `CURRENT SESSION STATUS` section for planned MCP tools
- Entirely new system; do not start until Phase 2 is complete
