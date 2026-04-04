# UI Redesign — Design Spec
**Phase 1 of 3 | Project Planner**
**Date:** 2026-03-31
**Status:** Approved — ready for implementation planning

---

## 1. Scope

Complete visual redesign of every frontend page and component. No backend changes in this phase. One new library added: **Framer Motion**.

**Pages covered:**
- Landing (`/`)
- Auth (`/auth`)
- Auth Callback (`/auth/callback`) — no UI redesign needed; it's a redirect-only handler; keep existing logic, just ensure it uses the new Spinner component during the redirect delay
- Dashboard (`/dashboard`)
- New Project Chat (`/new-project-chat`)
- Project Detail (`/project/:id`)
- Settings (`/settings`) — consolidated, no tabs
- Profile (`/profile`) — redirect to `/settings`
- Accept Invitation (`/accept-invitation`)

**Out of scope for this phase:**
- Role-specific functional features (Phase 2)
- MCP server (Phase 3)
- Any backend route changes
- Task assignment UI

---

## 2. Design System

### 2.1 Color Tokens

Defined as CSS custom properties on `:root` (light) and `[data-theme="dark"]`. Tailwind config extended to reference these vars.

```css
:root {
  --bg-base: #ffffff;
  --bg-surfa1ce: #f5f5f5;
  --bg-elevated: #ebebeb;
  --border: #e0e0e0;
  --text-primary: #0a0a0a;
  --text-secondary: #525252;
  --text-muted: #a3a3a3;
  --accent: #6366f1;
  --accent-hover: #4f46e5;
  --success: #10b981;
  --warning: #f59e0b;
  --destructive: #ef4444;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.08);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.10);
  --shadow-lg: 0 8px 32px rgba(0,0,0,0.12);
  --shadow-glow: 0 0 0 3px rgba(99,102,241,0.20);
}

[data-theme="dark"] {
  --bg-base: #0a0a0a;
  --bg-surface: #111111;
  --bg-elevated: #1a1a1a;
  --border: #262626;
  --text-primary: #fafafa;
  --text-secondary: #a3a3a3;
  --text-muted: #525252;
  --accent: #6366f1;
  --accent-hover: #818cf8;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.40);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.50);
  --shadow-lg: 0 8px 32px rgba(0,0,0,0.60);
  --shadow-glow: 0 0 0 3px rgba(99,102,241,0.30);
}
```

Theme is toggled by setting `data-theme` on `<html>`. Persisted in `localStorage`. Default: system preference via `prefers-color-scheme`.

### 2.2 Typography

- **Primary font:** `Inter` (Google Fonts, variable font)
- **Mono font:** `JetBrains Mono` (resource links, code snippets)
- **Scale:**

| Name | Size | Weight | Line Height | Use |
|---|---|---|---|---|
| `text-xs` | 12px | 400 | 1.5 | Captions, timestamps |
| `text-sm` | 14px | 400/500 | 1.5 | Labels, secondary text |
| `text-base` | 16px | 400 | 1.6 | Body copy |
| `text-lg` | 18px | 500 | 1.4 | Card titles |
| `text-xl` | 20px | 600 | 1.3 | Section headings |
| `text-2xl` | 24px | 700 | 1.2 | Page headings |
| `text-3xl` | 30px | 700 | 1.15 | Stat numbers |
| `text-4xl` | 36px | 700 | 1.1 | Hero subheading |
| `text-5xl` | 48px | 800 | 1.0 | Hero heading |

### 2.3 Motion Tokens (Framer Motion)

```js
// src/constants/motion.js
export const spring = {
  snappy: { type: 'spring', stiffness: 400, damping: 30 },
  smooth: { type: 'spring', stiffness: 300, damping: 28 },
  lazy:   { type: 'spring', stiffness: 200, damping: 25 },
};

export const fade = {
  in:  { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.25 } },
  out: { exit:    { opacity: 0, y: -8 }, transition: { duration: 0.15 } },
};

export const stagger = {
  container: { animate: { transition: { staggerChildren: 0.06 } } },
  item: { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } },
};

export const pageTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: spring.lazy },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.15 } },
};
```

### 2.4 Base Components

All base components live in `frontend/src/components/ui/`. Each is a standalone file. Existing components in subdirectories (`Button/`, `Loading/`, etc.) are replaced by these during the redesign.

| Component | File | Variants / Props |
|---|---|---|
| `Button` | `ui/Button.jsx` | variant: primary/secondary/ghost/destructive; size: sm/md/lg; loading state; spring press animation |
| `Card` | `ui/Card.jsx` | hover lift with shadow-md; spring.smooth; optional onClick |
| `Badge` | `ui/Badge.jsx` | variant: default/success/warning/destructive/accent; size: sm/md |
| `Input` | `ui/Input.jsx` | focus glow (shadow-glow); error state; optional left/right icon |
| `Textarea` | `ui/Textarea.jsx` | same focus treatment as Input; auto-resize option |
| `Modal` | `ui/Modal.jsx` | AnimatePresence; scales from 0.95 + fade on open; slides up on mobile; backdrop blur |
| `Sidebar` | `ui/Sidebar.jsx` | sticky; collapsible to icon-only at tablet; animated active indicator |
| `ProgressRing` | `ui/ProgressRing.jsx` | SVG circle; animated stroke-dashoffset on mount; drop-shadow; size prop |
| `Skeleton` | `ui/Skeleton.jsx` | shimmer animation; width/height props; rounded variant |
| `Avatar` | `ui/Avatar.jsx` | image with initials fallback; size: sm/md/lg; stacked group variant |
| `Tooltip` | `ui/Tooltip.jsx` | no library; CSS + JS show/hide; appears above by default |
| `Spinner` | `ui/Spinner.jsx` | replaces LoadingSpinner; size: sm/md/lg |

---

## 3. Page Designs

### 3.1 Landing Page (`/`)

**Layout:** Full viewport hero, dark by default, scroll to features below.

**Hero section:**
- Left 55%: badge chip ("AI-powered roadmaps") → `text-5xl` heading → `text-lg` subtext → two CTA buttons (primary: "Get Started", ghost: "See how it works" → smooth scroll). Heading text: "Turn your idea into a roadmap. Ship it."
- Right 45%: 3D floating card stack (see Section 4)
- Background: subtle dark mesh gradient with slow-rotating blurred orb (`filter: blur(120px)`, `opacity: 0.15`)

**Features section (below fold):**
Three columns with icon + heading + one-liner:
- "Generate in seconds" — AI builds your full roadmap from a description
- "Track everything" — phases, milestones, tasks, progress rings
- "Collaborate" — invite your team, assign work, ship together

**Footer:** Logo left, theme toggle right, minimal links (GitHub, About). One line.

**Animations:**
- Hero text: stagger fade-in on load (heading → subtext → buttons, 60ms apart)
- Card stack: mouse-move parallax (see Section 4)
- Features: fade-in on scroll (Intersection Observer)

---

### 3.2 Auth Page (`/auth`)

**Layout:** Split — desktop only. Mobile: stacked.

**Left panel (50%, dark always):**
- Animated mesh gradient orb background
- Logo top-left
- Centered: large quote or tagline ("Your projects. Your pace. Powered by AI.")
- Subtle animated floating dots pattern

**Right panel (50%, light/surface):**
- Centered vertically: App logo small → heading "Welcome back" → subtext "Sign in to continue" → "Continue with Google" button (large, full-width, with Google icon)
- Below button: "By signing in, you agree to our Terms" — text-xs, muted

**Animations:**
- Left panel orb: slow rotation CSS keyframes
- Right panel: fade-in slide-up on mount

---

### 3.3 Dashboard (`/dashboard`)

**Layout:** Single column, max-width 1200px, centered.

**Top bar:**
- Left: "Good morning, {name}" (`text-2xl`, `font-700`)
- Right: "New Project" button (primary)

**Usage banner** (conditional — no BYOK key + usage > 0):
- Thin bar, surface background, "X of 10 free generations used. Add your key →"

**Stats row:** 4 `Card` components in a responsive grid (4-col desktop, 2-col tablet, 2-col mobile):
- Total Projects (folder icon)
- Phases Complete (layers icon)
- Tasks Done (check-circle icon)
- Team Members (users icon)
Each card: large `text-3xl` number, label below, subtle icon top-right, trend up/down indicator.

**Project grid:**
- Heading: "Your Roadmaps" left, count badge right
- 2-col desktop, 1-col mobile
- Each `ProjectCard`:
  - Top-left: project title (`text-lg`, bold) + "Shared" badge if applicable
  - Top-right: role badge (admin/editor/viewer)
  - Middle: `ProgressRing` (48px) left-aligned + "X% complete" + phase count
  - Bottom: last updated date (text-xs, muted) + arrow icon (appears on hover)
  - Hover: card lifts (translateY -4px), shadow upgrades, arrow slides right 4px
  - Click: navigate to `/project/:id`

**Empty state:**
- Centered illustration (simple SVG, no stock art), heading "No projects yet", subtext, "Create your first roadmap" primary button.

**Animations:**
- Stats cards: stagger fade-in on mount
- Project cards: stagger fade-in (60ms between each)
- ProgressRing: animates from 0 to value on mount

---

### 3.4 New Project Chat (`/new-project-chat`)

**Layout:** Two-panel on desktop (40/60 split), stacked on mobile.

**Left panel — Input:**
- Back arrow top-left (→ dashboard)
- Heading: "Describe your project"
- `Input` for project title
- `Textarea` (large, ~8 rows) for description with placeholder text showing examples
- File upload zone: dashed border, `Upload.svg` icon, "Drop a PDF, DOCX, or TXT" text. On drag-over: border becomes solid accent, background tints accent at 5% opacity. On file attached: shows filename + remove button.
- Options row: experience level select, timeline select, scope select — inline, compact
- "Generate Roadmap" button (primary, full-width, loading state with spinner)

**Right panel — Output:**
- Default state: faint illustration with "Your roadmap will appear here"
- Generating state: skeleton shimmer blocks showing phase/milestone structure
- Generated state: roadmap preview rendered with phase accordion cards, fade-in staggered per section
- Bottom of right panel: "Save Project" button (primary) — only visible after generation

**Animations:**
- Roadmap sections: stagger fade-in as each section is revealed
- File upload zone: spring scale on drag-enter
- Generate button: loading spinner replaces text, spring press on click

---

### 3.5 Project Detail (`/project/:id`)

**Layout:** Three-zone desktop, condensed mobile.

**Left sidebar (220px, sticky, full height):**
- Project title (truncated if long, tooltip on hover)
- `ProgressRing` (64px) centered + "X% complete" text below
- Divider
- Phase nav list — each item: phase number + truncated title + small completion % badge
  - Active phase: accent left border, accent text, spring-animated indicator sliding to position
  - Click: smooth scroll + expand that phase in main content
- Divider
- MCP status indicator: dot (green = connected, gray = disconnected) + "MCP" label + small settings icon → opens MCP config panel (Phase 3, placeholder for now)

**Main content (flex-1):**
- Project header: large title + role badge + action buttons row (Invite, Team)
- Phase sections — one at a time expanded (accordion):
  - Phase header: phase title + timeline chip + completion ratio badge + expand chevron
  - Expanded: milestone list, each milestone row:
    - Milestone title + timeline chip
    - Tasks indented below: status dropdown + task title + resource badge(s) + assignee avatar (if assigned, Phase 2) + expand chevron
    - Expanded task: description text + technology tag + full resource list
  - Collapse: click phase header again

**Bottom bar (fixed, full width):**
- Thin (48px tall), surface + border-top
- Left: "X of Y tasks complete"
- Center: progress bar (accent fill, animated on status changes)
- Right: last saved indicator ("Saved just now")

**Mobile:**
- Sidebar becomes horizontal scrollable tab strip at top (phase names)
- Main content single column, full width
- Bottom bar stays fixed

**Animations:**
- Sidebar phase indicator: spring.snappy slide
- Phase accordion: spring.smooth expand/collapse
- Task row expand: spring.smooth
- Task status change: row briefly highlights (accent at 10% opacity) then fades out
- Bottom progress bar: spring-animated fill on change

---

### 3.6 Settings (`/settings`) — Consolidated

**Layout:** Single scrollable page. Max-width 680px, centered. No tabs.

**Three sections with dividers:**

**Section 1 — Profile**
- Avatar (large, 80px) with edit overlay on hover (camera icon)
- Display name (editable inline)
- Email (read-only, muted)
- Member since date

**Section 2 — Role**
- Heading: "How are you using this?"
- Three cards side-by-side (or stacked mobile):
  - Developer: terminal icon + "Developer" + "I build things with code"
  - Founder / PM: briefcase icon + "Founder / PM" + "I lead teams and ship products"
  - Student: graduation cap icon + "Student" + "I'm learning and building projects"
- Selected card: accent border + accent background at 5% + checkmark badge top-right
- "Save preference" button below (only enabled when changed)

**Section 3 — API Key**
- Current status: provider badge (Gemini / Claude / "Free tier") + masked key if set
- Usage meter: progress bar + "X of 10 free generations this month" + reset date
- If key set: masked display + "Change key" + "Remove key" (destructive)
- If no key: "Add your API key" form — provider select + key input + "Save & Verify" button
- Link: "Why add a key?" → tooltip or expandable explanation

**No `/profile` page** — `/profile` redirects to `/settings`.

**Animations:**
- Role cards: spring scale on hover, spring border transition on select
- API key form: spring slide-down on expand

---

### 3.7 Accept Invitation (`/accept-invitation`)

**Layout:** Full viewport. Dark gradient background (radial, accent color faint at edges). Centered card.

**Three states (animated transition between them):**

1. **Loading:** `Spinner` (lg) + "Accepting your invitation…" (text-lg, muted)
2. **Success:** animated checkmark (SVG stroke animation, draws itself in 0.5s) + "You're in!" (text-2xl, bold) + project name in accent color + "Redirecting you to the project…" (muted) — auto-redirect after 2s
3. **Error:** X icon (red) + "Invitation Error" + error message (muted) + "Go to Dashboard" button

Card: white/surface, rounded-xl, shadow-lg, 400px max-width, centered vertically and horizontally.

**Animations:**
- Card: fade-in + scale from 0.95 on mount
- State transitions: crossfade between loading/success/error

---

## 4. 3D Elements — Implementation Detail

### 4.1 Hero Card Stack (Landing)

Three overlapping cards rendered as `<div>` elements with CSS 3D transforms:

```css
.hero-card-stack {
  perspective: 1000px;
  transform-style: preserve-3d;
}

.card-back   { transform: rotateY(-8deg) rotateX(4deg) translateX(-20px) translateZ(-20px); }
.card-mid    { transform: rotateY(-4deg) rotateX(2deg) translateX(-8px)  translateZ(-10px); }
.card-front  { transform: rotateY(0deg)  rotateX(0deg); }
```

Mouse-move parallax: `mousemove` listener on the section → compute normalized offsets → update CSS custom properties `--rx` and `--ry` → cards respond at different depths (front: 1x, mid: 0.6x, back: 0.3x). Removed on mobile.

Cards contain fake roadmap data (hardcoded, not from DB).

### 4.2 ProgressRing

SVG implementation:

```jsx
// r = 40, circumference = 2π × 40 ≈ 251.2
// stroke-dasharray: 251.2
// stroke-dashoffset: 251.2 × (1 - progress)
// Animated with Framer Motion animate prop on mount
```

Drop-shadow via SVG `filter`:
```svg
<filter id="ring-shadow">
  <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="var(--accent)" flood-opacity="0.3"/>
</filter>
```

### 4.3 Animated Gradient Orb (Auth + Landing)

```css
.orb {
  position: absolute;
  width: 600px; height: 600px;
  background: radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%);
  filter: blur(80px);
  animation: orb-rotate 20s linear infinite;
  pointer-events: none;
}

@keyframes orb-rotate {
  0%   { transform: rotate(0deg)   translateX(60px); }
  100% { transform: rotate(360deg) translateX(60px); }
}
```

---

## 5. Theme Toggle

- `ThemeContext` extended to expose `theme` (`'light'|'dark'`) and `toggleTheme()`
- On mount: reads `localStorage.theme`, falls back to `window.matchMedia('prefers-color-scheme: dark')`
- Toggle sets `document.documentElement.setAttribute('data-theme', theme)` and saves to `localStorage`
- Toggle button: sun/moon icon (lucide), rotates 180° + scales on toggle (spring.snappy)
- Placed in: landing page footer, `RootLayout` nav (top-right)

---

## 6. Responsive Strategy

| Breakpoint | Tailwind | Key layout changes |
|---|---|---|
| Mobile | `< sm (640px)` | Single column, sidebar → tab strip, hero card stack hidden, split layouts stack |
| Tablet | `sm–lg (640–1024px)` | 2-col project grid, sidebar icon-only, split layouts 50/50 |
| Desktop | `> lg (1024px)` | Full 3-panel project detail, 4-col stats, full sidebar |

All layouts use CSS Grid and Flexbox. No fixed pixel widths except sidebar (220px) and settings max-width (680px).

---

## 7. File Structure Changes

### New files
```
frontend/src/
├── constants/motion.js              — spring, fade, stagger, pageTransition tokens
├── components/ui/
│   ├── Button.jsx
│   ├── Card.jsx
│   ├── Badge.jsx
│   ├── Input.jsx
│   ├── Textarea.jsx
│   ├── Modal.jsx
│   ├── Sidebar.jsx
│   ├── ProgressRing.jsx
│   ├── Skeleton.jsx
│   ├── Avatar.jsx
│   ├── Tooltip.jsx
│   └── Spinner.jsx
└── index.css                        — CSS custom properties (theme tokens)
```

### Modified files
```
frontend/src/
├── App.jsx                          — AnimatePresence wrapper, /profile → /settings redirect
├── index.css                        — add CSS custom properties, Inter + JetBrains Mono import
├── layouts/RootLayout.jsx           — new nav design + theme toggle
├── pages/Home/Home.jsx              — full rebuild
├── pages/Auth/Auth.jsx              — full rebuild
├── pages/Dashboard/Dashboard.jsx   — full rebuild
├── pages/NewProjectChat/NewProjectChatPage.jsx — full rebuild
├── pages/ProjectDetail/ProjectDetailPage.jsx   — full rebuild (3-panel)
├── pages/Settings/SettingsPage.jsx  — full rebuild (consolidated, no tabs)
├── pages/Profile/Profile.jsx        — redirect to /settings
└── pages/AcceptInvitation/AcceptInvitationPage.jsx — full rebuild
```

### Deleted / deprecated
```
frontend/src/components/Button/      — replaced by ui/Button.jsx
frontend/src/components/Loading/     — replaced by ui/Spinner.jsx + ui/Skeleton.jsx
frontend/src/components/StatsCard/   — rebuilt inline in Dashboard
```

---

## 8. Dependencies

One new package:

```bash
cd frontend && npm install framer-motion
```

No other new dependencies. All 3D is CSS. All icons stay as `lucide-react`.

---

## 9. Implementation Order

Build in this order to unblock subsequent pages:

1. Design tokens (`index.css` CSS vars + `constants/motion.js`)
2. Theme system (`ThemeContext` update + toggle component)
3. Base UI components (`components/ui/` — all 12)
4. `RootLayout` (nav uses base components)
5. `App.jsx` (AnimatePresence, profile redirect)
6. Landing page
7. Auth page
8. Dashboard
9. New Project Chat
10. Project Detail
11. Settings (consolidated)
12. Accept Invitation

Each step is independently reviewable before moving to the next.
