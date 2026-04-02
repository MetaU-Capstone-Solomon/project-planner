# Phase 2 — Role Functionalities Design

**Date:** 2026-04-01  
**Status:** Approved  
**Scope:** Frontend-only. No new DB columns, no new API routes.

---

## Overview

Implement role-specific UI for Developer, Founder/PM, and Student roles in one pass. All role logic is driven by a central config object to keep feature flags auditable and pages clean.

---

## 1. Role Config System

### New file: `frontend/src/constants/roleConfig.js`

Defines feature flags per role:

```js
export const ROLE_CONFIG = {
  developer: {
    showTechFilter: true,
    showEstimatedHours: true,
    showResourceBadges: true,
    settingsDefaultApiKey: true,
  },
  founder_pm: {
    showTaskAssignment: true,
    showTeamWidget: true,
    showMilestoneStats: true,
    alwaysShowInvite: true,
  },
  student: {
    showExplainThis: true,
    showBreakdown: true,
    showLearningPath: true,
    showEncouragement: true,
    hideApiKeyNudge: true,
  },
};

export const DEFAULT_CONFIG = {
  showTechFilter: false,
  showEstimatedHours: false,
  showResourceBadges: false,
  settingsDefaultApiKey: false,
  showTaskAssignment: false,
  showTeamWidget: false,
  showMilestoneStats: false,
  alwaysShowInvite: false,
  showExplainThis: false,
  showBreakdown: false,
  showLearningPath: false,
  showEncouragement: false,
  hideApiKeyNudge: false,
};
```

All flags default to `false` — safe during loading state or when role is `null`.

### New hook: `frontend/src/hooks/useRoleConfig.js`

```js
import { useUserRole } from './useUserRole';
import { ROLE_CONFIG, DEFAULT_CONFIG } from '@/constants/roleConfig';

export function useRoleConfig() {
  const role = useUserRole();
  const config = role ? ROLE_CONFIG[role] ?? DEFAULT_CONFIG : DEFAULT_CONFIG;
  return { role, config };
}
```

No changes to existing `useUserRole` or `useUserSettings`.

---

## 2. New Components

### `McpStatusBadge` — `frontend/src/components/McpStatusBadge/McpStatusBadge.jsx`
- Always renders "Disconnected" (grey dot) — placeholder for Phase 3
- On click/hover shows tooltip: "MCP connection coming in Phase 3"
- Used in: Dashboard header, ProjectDetail sidebar

### `TaskExplainer` — `frontend/src/components/TaskExplainer/TaskExplainer.jsx`
- Student-only wrapper rendered around each task item
- Two buttons: "Explain this" and "Break this down"
- Each triggers an AI call to `POST /api/chat` (existing endpoint, `API_ENDPOINTS.CHAT`) with a role-specific prompt
- Response displayed inline in a collapsible panel below the task
- State is ephemeral (not saved to DB)

**Prompts:**
- Explain: `"Explain this task in simple terms for a beginner: [task title + description]"`
- Breakdown: `"Break this task into 3-5 smaller sub-steps a beginner can follow: [task title + description]"`

### `TeamOverviewWidget` — `frontend/src/components/TeamOverviewWidget/TeamOverviewWidget.jsx`
- Founder/PM dashboard widget
- Shows each project with its collaborator avatars and roles
- Reads from existing `projectService` — no new API calls
- Rendered below stats cards on Dashboard

### `LearningPathBar` — `frontend/src/components/LearningPathBar/LearningPathBar.jsx`
- Student dashboard component
- Shows total tasks completed / total tasks across all projects as a `ProgressRing` or bar
- Uses data already fetched by `useDashboardData`

---

## 3. Page Changes

### Dashboard (`frontend/src/pages/Dashboard/Dashboard.jsx`)

| Flag | Change |
|---|---|
| All roles | `McpStatusBadge` in page header |
| `showTechFilter` | Tech stack filter chip bar above project grid |
| `showEstimatedHours` | Estimated hours shown on project cards |
| `showTeamWidget` | `TeamOverviewWidget` below stats cards |
| `showMilestoneStats` | Stats cards relabelled toward milestones completed |
| `alwaysShowInvite` | Invite button always visible in header (not just inside a project) |
| `showLearningPath` | `LearningPathBar` below stats cards |
| `showEncouragement` | Encouragement copy shown when milestone is completed |

### Project Detail (`frontend/src/pages/ProjectDetail/ProjectDetailPage.jsx`)

| Flag | Change |
|---|---|
| All roles | `McpStatusBadge` in left sidebar (replaces existing placeholder) |
| `showResourceBadges` | Resource links rendered as clickable `Badge` components |
| `showEstimatedHours` | Estimated hours shown on each task item |
| `showTaskAssignment` | Assignee avatar picker on each task (team members list from existing collaborators data) |
| `alwaysShowInvite` | Invite button prominent in project header |
| `showExplainThis` / `showBreakdown` | `TaskExplainer` wrapper on each task |
| `showEncouragement` | Toast/banner on phase completion |

### Settings (`frontend/src/pages/Settings/SettingsPage.jsx`)

| Flag | Change |
|---|---|
| `settingsDefaultApiKey` | API key section scrolled into view / opened on mount |
| `hideApiKeyNudge` | API key section hidden entirely |

---

## 4. Task Assignment (Founder/PM)

Assignee is stored in the roadmap JSON blob alongside other task metadata — no new DB columns. The assignee picker reads the project's collaborators list (already fetched in `useProjectDetail`). On assign, the task object is updated in local state and saved via the existing `useProjectSave` hook.

---

## 5. What Is Not In Scope

- Real MCP connectivity — Phase 3
- New backend routes
- New DB columns or schema changes
- Backend role enforcement (role is a UI hint only at this stage)

---

## 6. File Additions Summary

```
frontend/src/constants/roleConfig.js           (new)
frontend/src/hooks/useRoleConfig.js             (new)
frontend/src/components/McpStatusBadge/        (new)
frontend/src/components/TaskExplainer/         (new)
frontend/src/components/TeamOverviewWidget/    (new)
frontend/src/components/LearningPathBar/       (new)
```

Modified:
```
frontend/src/pages/Dashboard/Dashboard.jsx
frontend/src/pages/ProjectDetail/ProjectDetailPage.jsx
frontend/src/pages/Settings/SettingsPage.jsx
```
