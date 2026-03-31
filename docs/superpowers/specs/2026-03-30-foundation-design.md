# Foundation Design — Onboarding + BYOK

**Date:** 2026-03-30
**Sub-project:** 1 of 4
**Status:** Approved

## Overview

Foundation establishes two things: who the user is (onboarding + role) and how AI costs are managed (BYOK + free tier). Every subsequent sub-project builds on this. The goal is a lightweight, non-intrusive setup that feels like a natural part of using the product — not a wizard to get through.

**What ships in this sub-project:**
- Contextual role selection at first project creation
- Role-based feature surfacing across the app
- Free tier (rate-limited app Gemini key)
- BYOK: user adds their own Gemini or Claude API key
- `AIProviderService` — unified AI routing layer all future features use
- Minimal settings page (Profile + API Key tabs)

**What does NOT ship here:**
- OpenAI/GPT support (added later by request)
- Model picker (future power-user feature)
- MCP server (sub-project 4)

---

## Data Model

One new table: `user_settings`. One row per user.

```sql
CREATE TABLE user_settings (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  role             text CHECK (role IN ('developer', 'founder_pm', 'student')) DEFAULT NULL,
  api_key_encrypted text DEFAULT NULL,
  api_provider     text CHECK (api_provider IN ('gemini', 'claude')) DEFAULT NULL,
  monthly_usage    integer NOT NULL DEFAULT 0,
  usage_limit      integer NOT NULL DEFAULT 10,
  usage_reset_at        timestamptz NOT NULL DEFAULT (now() + interval '1 month'),
  byok_nudge_dismissed  boolean NOT NULL DEFAULT false,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- RLS: users access only their own row
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_settings_self" ON user_settings
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

**Notes:**
- `api_key_encrypted` never leaves the backend — the frontend never receives it after save
- `usage_limit` is a per-row value (not a hard-coded constant) so it can be adjusted per user if needed
- `usage_reset_at` is set to `now() + 1 month` on creation and rolled forward each reset cycle

---

## Onboarding Flow

Setup happens **at first project creation**, not at signup. User sees the dashboard first, understands what the product does, then sets up in context.

```
Sign up → Dashboard (empty state)
         ↓
    User clicks "Create Project" (first time only)
         ↓
    OnboardingModal — single question:
    ┌─────────────────────────────────────────┐
    │  How are you planning to use this?      │
    │                                         │
    │  [ Developer ]  [ Founder / PM ]        │
    │  [ Student ]                            │
    │                                         │
    │  You can change this anytime            │
    │  in Settings.          [Skip for now]   │
    └─────────────────────────────────────────┘
         ↓
    Role saved to user_settings
         ↓
    Normal project creation continues
         ↓
    First generation completes →
    BYOKModal fires (once)
```

**Rules:**
- Modal fires only if `user_settings` row does not exist (first visit) or `role` is not yet set
- Skip stores `role: null` — full feature access, no personalization
- Role changeable anytime from Settings → Profile tab
- The role question does NOT block or delay the project creation — it appears as a step before the creation form, not after

---

## Role-Based Feature Surfacing

Role controls what is **prominent and visible by default**, not what exists. All features remain accessible to all roles. No role is locked out of anything.

| Feature | Developer | Founder/PM | Student |
|---|---|---|---|
| MCP setup card | Prominent (project detail) | Hidden (accessible in settings) | Hidden |
| Prompt generator | Prominent | Available | Available |
| Team panel / invite | Available | Prominent | Available |
| Milestone overview | Standard | Prominent | Simplified (tasks only) |
| Learning tips layer | Off | Off | On |
| Tech stack badge | Prominent | Available | Available |
| Architecture decision log | Prominent | Available | Available |

**Key:** Prominent = shown by default in the main view. Available = accessible but not surfaced on the main view (reachable via menu/settings). Hidden = not shown in nav or main view (still accessible via direct URL or settings).

**Implementation:** A single `useUserRole()` hook returns the current role. Components read it and adjust rendering — no separate codepaths, no role-specific routes.

```javascript
// Example usage in ProjectDetailPage
const role = useUserRole(); // 'developer' | 'founder_pm' | 'student' | null
// role === null → show everything at default prominence
```

When `role` is null (skipped or not set), the app shows everything at default prominence — no personalization, but nothing breaks.

---

## BYOK and Free Tier

### Free Tier
- Default: 10 generations/month using the app's Gemini key
- Limit stored in `user_settings.usage_limit` — configurable per user, tuned post-launch based on real usage data (not hard-coded)
- Usage tracked server-side only; frontend receives `{ used, limit }` for display

### BYOK Modal — Trigger 1 (post first generation)
Fires once after the user's first successful generation. Never fires again if dismissed.

> **Your project is ready.**
> For the best results, add a Claude API key. Just testing? Get a free Gemini key — takes 30 seconds.
> `[Add my key →]` `[Not now]`

Includes links to:
- Anthropic Console (Claude key)
- Google AI Studio (Gemini free key)

Dismissing sets a `byok_nudge_dismissed` flag in `user_settings` — modal never reappears from trigger 1.

### BYOK Modal — Trigger 2 (1 generation remaining)
Fires when `monthly_usage === usage_limit - 1`. Simpler message:

> **You have 1 free generation left this month.**
> Add your own API key to keep going.
> `[Add my key →]` `[Continue without]`

### At Limit (0 remaining, no key)
Generation button is disabled. Tooltip on hover: *"Monthly limit reached. Add your API key in Settings to continue."*

### Key Entry Flow (Settings → API Key tab)

1. User pastes key into input field
2. Provider auto-detected from prefix:
   - `sk-ant-` → Claude (Anthropic)
   - `AIza` → Gemini (Google)
   - Unrecognised prefix → show error: "Unrecognised key format. Supported: Claude (sk-ant-...) and Gemini (AIza...)"
3. User clicks Save → backend validates with a minimal test call
4. UI states:
   - `Validating...`
   - `✓ Claude key active` (success)
   - `✗ Invalid or expired key` (failure — not saved)
5. On success: key encrypted (AES-256-GCM with server secret), stored, never returned to frontend
6. Displayed after save as: `sk-ant-••••••••` with `[Replace]` button
7. ℹ️ icon tooltip: *"Your key is encrypted and stored securely. It's never shown again — to update it, paste a new one."*

**Replace flow:** clicking `[Replace]` clears the masked display and shows the input again. Old key is overwritten on save of new key.

**Remove key:** a `[Remove]` option falls the user back to the app's free tier.

---

## AIProviderService

A single backend service that all AI routes go through. No route ever calls a Gemini or Anthropic SDK directly.

### Interface

```javascript
// AIProviderService.generate(userId, prompt, options)
// Returns: { text, provider, tokensUsed }
// Throws: ProviderError (invalid key), UsageLimitError (free tier exhausted)
```

### Routing Logic

```
generate(userId, prompt, options):
  1. Load user_settings for userId (create row if first call)
  2. Check if usage_reset_at has passed → reset monthly_usage to 0, roll forward reset date
  3. If api_key_encrypted exists:
       → decrypt key
       → route to user's provider SDK (Gemini or Claude)
       → do NOT check usage_limit (user's key, their cost)
  4. Else (app key):
       → check monthly_usage < usage_limit → throw UsageLimitError if exceeded
       → use app's GEMINI_API_KEY
       → increment monthly_usage
  5. Return { text, provider, tokensUsed }
```

### Extensibility

Adding a new provider (e.g., OpenAI when users request it):
1. Add `'openai'` to the `api_provider` enum
2. Add key prefix detection (`sk-` for OpenAI)
3. Implement one adapter: `OpenAIAdapter.generate(key, prompt, options)`
4. Register in the provider router

Nothing else changes. All existing routes continue working.

### Error Handling

| Error | User-facing message |
|---|---|
| Invalid/expired key | "Your API key returned an error. Please check it in Settings." |
| Usage limit reached | "Monthly limit reached. Add your API key in Settings." |
| Provider timeout | "Generation timed out. Please try again." |
| Network error | "Couldn't reach the AI provider. Please try again." |

---

## New API Endpoints

All routes require authentication (Bearer token).

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/user/settings` | Returns `{ role, apiProvider, maskedKey, usage: { used, limit } }` |
| `POST` | `/api/user/role` | Body: `{ role }` — saves role to user_settings |
| `POST` | `/api/user/api-key` | Body: `{ key }` — validates, encrypts, stores key |
| `DELETE` | `/api/user/api-key` | Removes key, falls back to app free tier |

---

## New Frontend Components

| Component | Location | Description |
|---|---|---|
| `OnboardingModal` | `components/Onboarding/` | Role picker, fires once at first project creation |
| `BYOKModal` | `components/BYOK/` | Reusable — two triggers, same component |
| `SettingsPage` | `pages/Settings/` | `/settings` route — Profile tab + API Key tab |
| `ApiKeyPanel` | `components/Settings/` | Key entry, validation states, masked display |
| `useUserRole()` | `hooks/` | Returns current role, consumed by any component that adapts |
| `useUserSettings()` | `hooks/` | Returns full settings including usage — used by BYOKModal trigger logic |

---

## What Existing Code Changes

- **All AI routes** (`/api/generate`, future routes): replace direct Gemini SDK calls with `AIProviderService.generate(userId, prompt, options)`
- **ProjectDetailPage**: reads `useUserRole()` to control feature prominence
- **Dashboard**: reads usage from `useUserSettings()` to show usage indicator (subtle, not intrusive)
- **ProjectCreationFlow**: checks if `OnboardingModal` should appear before proceeding

---

## Security Notes

- `api_key_encrypted` is encrypted with AES-256-GCM using a `ENCRYPTION_KEY` env variable (32-byte secret)
- Key is decrypted only server-side, only at generation time
- Frontend receives only: provider name, masked key prefix (`sk-ant-••••••••`), and usage counts
- RLS ensures users cannot read other users' settings rows
- `ENCRYPTION_KEY` must be rotated if compromised — existing keys would need re-entry (acceptable tradeoff for v1)

---

## Out of Scope (this sub-project)

- OpenAI/GPT support — add when users request it
- Model picker (claude-opus vs claude-sonnet etc.) — future feature
- Team-level API key (one key for whole org) — post-launch if requested
- MCP server — sub-project 4
- Usage analytics dashboard — post-launch
