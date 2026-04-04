# Foundation Implementation Plan
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add user onboarding (role selection), role-based feature surfacing, BYOK API key management, and a unified AIProviderService that routes all AI calls through the user's own key or the app's free-tier Gemini key.

**Architecture:** A new `user_settings` table stores role, encrypted API key, and monthly usage. A backend `AIProviderService` replaces the raw HTTPS Gemini call in `/api/chat` — it reads the user's key, routes to the right SDK, and tracks usage. Four new frontend components (OnboardingModal, BYOKModal, ApiKeyPanel, SettingsPage) handle setup and key management.

**Tech Stack:** Node.js/Express, `@google/generative-ai` SDK, `@anthropic-ai/sdk`, AES-256-GCM encryption (Node `crypto`), Jest (backend tests), React 19, TanStack Query v5, Supabase JS v2, Tailwind CSS.

---

## File Map

### New Backend Files
| File | Responsibility |
|---|---|
| `backend/middleware/auth.js` | Reusable JWT extraction middleware — decodes Bearer token, sets `req.userId` |
| `backend/services/encryptionService.js` | AES-256-GCM encrypt/decrypt for API keys |
| `backend/services/aiProviderService.js` | Routes AI calls to Gemini or Claude, manages free-tier usage |
| `backend/routes/user.js` | GET/POST/DELETE user settings endpoints |
| `backend/tests/encryptionService.test.js` | Unit tests for encrypt/decrypt |
| `backend/tests/aiProviderService.test.js` | Unit tests for routing logic |

### Modified Backend Files
| File | What changes |
|---|---|
| `backend/index.js` | Add GET+DELETE to CORS, mount user router, replace raw Gemini call in `/api/chat` with AIProviderService |
| `backend/package.json` | Add `@anthropic-ai/sdk`, `jest` |
| `backend/.env` | Add `ENCRYPTION_KEY` |

### New SQL File
| File | Responsibility |
|---|---|
| `database-migration-user-settings.sql` | Creates `user_settings` table with RLS |

### New Frontend Files
| File | Responsibility |
|---|---|
| `frontend/src/hooks/useUserSettings.js` | React Query hook — fetches role, usage, provider, masked key |
| `frontend/src/hooks/useUserRole.js` | Thin wrapper returning just the role string |
| `frontend/src/components/Onboarding/OnboardingModal.jsx` | Role picker — fires once at first project creation |
| `frontend/src/components/BYOK/BYOKModal.jsx` | Two-trigger modal for adding API key |
| `frontend/src/components/Settings/ApiKeyPanel.jsx` | Key entry, validation states, masked display |
| `frontend/src/pages/Settings/SettingsPage.jsx` | `/settings` route — Profile + API Key tabs |

### Modified Frontend Files
| File | What changes |
|---|---|
| `frontend/src/config/api.js` | Add user settings endpoints |
| `frontend/src/constants/routes.js` | Add `SETTINGS: '/settings'` |
| `frontend/src/constants/messages.js` | Add BYOK and settings message constants |
| `frontend/src/services/aiCacheService.js` | Add Authorization header to `/api/chat` call |
| `frontend/src/App.jsx` | Add `/settings` protected route |
| `frontend/src/layouts/RootLayout.jsx` | Add Settings link in nav |
| `frontend/src/pages/NewProjectChat/NewProjectChatPage.jsx` | Add OnboardingModal + BYOKModal |
| `frontend/src/pages/Dashboard/Dashboard.jsx` | Add subtle usage indicator |
| `frontend/src/pages/ProjectDetail/ProjectDetailPage.jsx` | Role-based team panel prominence |

---

## Task 1: Database migration

**Files:**
- Create: `database-migration-user-settings.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- database-migration-user-settings.sql
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS user_settings (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  role                  text CHECK (role IN ('developer', 'founder_pm', 'student')) DEFAULT NULL,
  api_key_encrypted     text DEFAULT NULL,
  api_provider          text CHECK (api_provider IN ('gemini', 'claude')) DEFAULT NULL,
  monthly_usage         integer NOT NULL DEFAULT 0,
  usage_limit           integer NOT NULL DEFAULT 10,
  usage_reset_at        timestamptz NOT NULL DEFAULT (now() + interval '1 month'),
  byok_nudge_dismissed  boolean NOT NULL DEFAULT false,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- RLS: each user can only read and write their own row
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_settings_self" ON user_settings
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for fast lookups by user_id (UNIQUE already creates one, but be explicit)
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
```

- [ ] **Step 2: Run migration in Supabase**

Go to Supabase dashboard → SQL Editor → paste the file contents → Run.

Expected: "Success. No rows returned."

- [ ] **Step 3: Verify the table exists**

In Supabase SQL Editor:
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'user_settings'
ORDER BY ordinal_position;
```

Expected: 10 rows listing id, user_id, role, api_key_encrypted, api_provider, monthly_usage, usage_limit, usage_reset_at, byok_nudge_dismissed, created_at, updated_at.

- [ ] **Step 4: Commit**

```bash
cd /Users/kingsolomon/Desktop/Projects/ProjectPlanner/project-planner
git add database-migration-user-settings.sql
git commit -m "feat: add user_settings table migration"
```

---

## Task 2: Backend test setup

**Files:**
- Modify: `backend/package.json`
- Create: `backend/tests/` directory (via first test file)

- [ ] **Step 1: Install Jest**

```bash
cd /Users/kingsolomon/Desktop/Projects/ProjectPlanner/project-planner/backend
npm install --save-dev jest
```

Expected: jest added to devDependencies, 0 vulnerabilities.

- [ ] **Step 2: Update package.json test script**

In `backend/package.json`, replace the test script:
```json
"scripts": {
  "start": "node index.js",
  "dev": "nodemon index.js",
  "test": "jest --testPathPattern=tests/",
  "test:watch": "jest --testPathPattern=tests/ --watch"
}
```

Also add Jest config at the bottom of package.json (before closing brace):
```json
"jest": {
  "testEnvironment": "node",
  "testMatch": ["**/tests/**/*.test.js"]
}
```

- [ ] **Step 3: Verify Jest works**

```bash
cd /Users/kingsolomon/Desktop/Projects/ProjectPlanner/project-planner/backend
npm test
```

Expected: "Test Suites: 0 of 0 total" or "No tests found" — no errors.

- [ ] **Step 4: Commit**

```bash
git add backend/package.json backend/package-lock.json
git commit -m "chore: add Jest test framework to backend"
```

---

## Task 3: EncryptionService

**Files:**
- Create: `backend/services/encryptionService.js`
- Create: `backend/tests/encryptionService.test.js`

- [ ] **Step 1: Write the failing tests**

Create `backend/tests/encryptionService.test.js`:

```javascript
const { encrypt, decrypt } = require('../services/encryptionService');

// Set test encryption key before tests run
beforeAll(() => {
  process.env.ENCRYPTION_KEY = 'a'.repeat(64); // 32 bytes as hex
});

describe('encryptionService', () => {
  test('encrypt returns a string with three colon-separated hex segments', () => {
    const result = encrypt('sk-ant-test-key-12345');
    const parts = result.split(':');
    expect(parts).toHaveLength(3);
    // iv: 32 hex chars (16 bytes), authTag: 32 hex chars (16 bytes), data: variable
    expect(parts[0]).toHaveLength(32);
    expect(parts[1]).toHaveLength(32);
    expect(parts[2].length).toBeGreaterThan(0);
  });

  test('decrypt recovers the original plaintext', () => {
    const original = 'AIzaSyTestGeminiKey987';
    const encrypted = encrypt(original);
    expect(decrypt(encrypted)).toBe(original);
  });

  test('each encrypt call produces a different ciphertext', () => {
    const key = 'sk-ant-samekey';
    expect(encrypt(key)).not.toBe(encrypt(key));
  });

  test('decrypt throws on tampered ciphertext', () => {
    const encrypted = encrypt('sk-ant-test');
    const parts = encrypted.split(':');
    // Tamper with the auth tag
    const tampered = `${parts[0]}:${'f'.repeat(32)}:${parts[2]}`;
    expect(() => decrypt(tampered)).toThrow();
  });

  test('throws if ENCRYPTION_KEY is not set', () => {
    const savedKey = process.env.ENCRYPTION_KEY;
    delete process.env.ENCRYPTION_KEY;
    expect(() => encrypt('anything')).toThrow('ENCRYPTION_KEY environment variable not set');
    process.env.ENCRYPTION_KEY = savedKey;
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd /Users/kingsolomon/Desktop/Projects/ProjectPlanner/project-planner/backend
npm test
```

Expected: FAIL — "Cannot find module '../services/encryptionService'"

- [ ] **Step 3: Implement EncryptionService**

Create `backend/services/encryptionService.js`:

```javascript
const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

function getKey() {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex) throw new Error('ENCRYPTION_KEY environment variable not set');
  return Buffer.from(keyHex, 'hex'); // 64 hex chars = 32 bytes for AES-256
}

/**
 * Encrypts plaintext using AES-256-GCM.
 * Returns "ivHex:authTagHex:ciphertextHex"
 */
function encrypt(plaintext) {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypts a value produced by encrypt().
 * Throws if the ciphertext has been tampered with.
 */
function decrypt(ciphertext) {
  const key = getKey();
  const [ivHex, authTagHex, encryptedHex] = ciphertext.split(':');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, 'hex')),
    decipher.final(),
  ]).toString('utf8');
}

module.exports = { encrypt, decrypt };
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd /Users/kingsolomon/Desktop/Projects/ProjectPlanner/project-planner/backend
npm test
```

Expected: PASS — 5 tests passing in encryptionService.test.js

- [ ] **Step 5: Add ENCRYPTION_KEY to .env**

Run this to generate a secure key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output, then add to `backend/.env`:
```
ENCRYPTION_KEY=<paste 64-char hex string here>
```

- [ ] **Step 6: Commit**

```bash
git add backend/services/encryptionService.js backend/tests/encryptionService.test.js backend/.env
git commit -m "feat: add AES-256-GCM encryption service with tests"
```

---

## Task 4: AIProviderService

**Files:**
- Create: `backend/services/aiProviderService.js`
- Create: `backend/tests/aiProviderService.test.js`
- Modify: `backend/package.json` (add @anthropic-ai/sdk)

- [ ] **Step 1: Install Anthropic SDK**

```bash
cd /Users/kingsolomon/Desktop/Projects/ProjectPlanner/project-planner/backend
npm install @anthropic-ai/sdk
```

Expected: package added, 0 new vulnerabilities.

- [ ] **Step 2: Write failing tests**

Create `backend/tests/aiProviderService.test.js`:

```javascript
const { AIProviderService, UsageLimitError, ProviderError } = require('../services/aiProviderService');

beforeAll(() => {
  process.env.ENCRYPTION_KEY = 'a'.repeat(64);
  process.env.GEMINI_API_KEY = 'AIzaTestKey';
  process.env.SUPABASE_URL = 'https://test.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
});

describe('detectProvider', () => {
  const service = new AIProviderService();

  test('detects claude from sk-ant- prefix', () => {
    expect(service.detectProvider('sk-ant-api03-abc123')).toBe('claude');
  });

  test('detects gemini from AIza prefix', () => {
    expect(service.detectProvider('AIzaSyAbcDef123')).toBe('gemini');
  });

  test('returns null for unknown prefix', () => {
    expect(service.detectProvider('pk-unknown-123')).toBeNull();
  });

  test('returns null for empty string', () => {
    expect(service.detectProvider('')).toBeNull();
  });
});

describe('maskKey', () => {
  const service = new AIProviderService();

  test('returns first 8 chars followed by bullets', () => {
    expect(service.maskKey('sk-ant-api03-longkey')).toBe('sk-ant-a••••••••');
  });

  test('handles short keys without crashing', () => {
    const result = service.maskKey('AIza');
    expect(result).toBe('AIza••••••••');
  });
});

describe('UsageLimitError', () => {
  test('has correct name and statusCode', () => {
    const err = new UsageLimitError();
    expect(err.name).toBe('UsageLimitError');
    expect(err.statusCode).toBe(429);
    expect(err.message).toBe('Monthly generation limit reached');
  });
});

describe('ProviderError', () => {
  test('has correct name and statusCode', () => {
    const err = new ProviderError('bad key');
    expect(err.name).toBe('ProviderError');
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe('bad key');
  });
});
```

- [ ] **Step 3: Run tests to confirm they fail**

```bash
cd /Users/kingsolomon/Desktop/Projects/ProjectPlanner/project-planner/backend
npm test
```

Expected: FAIL — "Cannot find module '../services/aiProviderService'"

- [ ] **Step 4: Implement AIProviderService**

Create `backend/services/aiProviderService.js`:

```javascript
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Anthropic = require('@anthropic-ai/sdk');
const { createClient } = require('@supabase/supabase-js');
const { encrypt, decrypt } = require('./encryptionService');

class UsageLimitError extends Error {
  constructor() {
    super('Monthly generation limit reached');
    this.name = 'UsageLimitError';
    this.statusCode = 429;
  }
}

class ProviderError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ProviderError';
    this.statusCode = 400;
  }
}

class AIProviderService {
  constructor() {
    this._supabase = null;
  }

  get supabase() {
    if (!this._supabase) {
      this._supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
    }
    return this._supabase;
  }

  /** Detect provider from API key prefix */
  detectProvider(key) {
    if (!key) return null;
    if (key.startsWith('sk-ant-')) return 'claude';
    if (key.startsWith('AIza')) return 'gemini';
    return null;
  }

  /** Return first 8 chars + bullets for display */
  maskKey(key) {
    const prefix = key.substring(0, 8);
    return `${prefix}••••••••`;
  }

  /**
   * Generate text using the user's key (if set) or the app's free-tier Gemini key.
   * @param {string} userId - Supabase user UUID
   * @param {string} prompt - Full prompt text
   * @returns {Promise<{text: string, provider: string}>}
   * @throws {UsageLimitError} when free tier is exhausted
   * @throws {ProviderError} when user's key is invalid
   */
  async generate(userId, prompt) {
    let settings = await this._getOrCreateSettings(userId);
    settings = await this._checkAndResetUsage(settings);

    if (settings.api_key_encrypted) {
      const key = decrypt(settings.api_key_encrypted);
      return await this._generateWithUserKey(key, settings.api_provider, prompt);
    }

    // Free tier
    if (settings.monthly_usage >= settings.usage_limit) {
      throw new UsageLimitError();
    }

    const result = await this._generateWithAppKey(prompt);
    await this._incrementUsage(settings.user_id, settings.monthly_usage);
    return result;
  }

  /**
   * Validate a user-supplied key with a minimal test call.
   * Throws if the key is invalid or expired.
   */
  async validateKey(key, provider) {
    if (provider === 'gemini') {
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      await model.generateContent('Hi');
    } else if (provider === 'claude') {
      const client = new Anthropic({ apiKey: key });
      await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'Hi' }],
      });
    } else {
      throw new ProviderError(`Unsupported provider: ${provider}`);
    }
  }

  async _getOrCreateSettings(userId) {
    const { data, error } = await this.supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      const { data: created, error: createErr } = await this.supabase
        .from('user_settings')
        .insert({ user_id: userId })
        .select()
        .single();
      if (createErr) throw new Error(`Failed to create user settings: ${createErr.message}`);
      return created;
    }
    if (error) throw new Error(`Failed to load user settings: ${error.message}`);
    return data;
  }

  async _checkAndResetUsage(settings) {
    if (new Date() <= new Date(settings.usage_reset_at)) return settings;

    const nextReset = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await this.supabase
      .from('user_settings')
      .update({ monthly_usage: 0, usage_reset_at: nextReset })
      .eq('user_id', settings.user_id)
      .select()
      .single();
    if (error) throw new Error(`Failed to reset usage: ${error.message}`);
    return data;
  }

  async _incrementUsage(userId, currentUsage) {
    await this.supabase
      .from('user_settings')
      .update({ monthly_usage: currentUsage + 1, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
  }

  async _generateWithAppKey(prompt) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    return { text: result.response.text(), provider: 'gemini' };
  }

  async _generateWithUserKey(key, provider, prompt) {
    if (provider === 'gemini') return await this._generateWithGemini(key, prompt);
    if (provider === 'claude') return await this._generateWithClaude(key, prompt);
    throw new ProviderError(`Unsupported provider: ${provider}`);
  }

  async _generateWithGemini(key, prompt) {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    return { text: result.response.text(), provider: 'gemini' };
  }

  async _generateWithClaude(key, prompt) {
    const client = new Anthropic({ apiKey: key });
    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }],
    });
    return { text: message.content[0].text, provider: 'claude' };
  }
}

module.exports = { AIProviderService, UsageLimitError, ProviderError };
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
cd /Users/kingsolomon/Desktop/Projects/ProjectPlanner/project-planner/backend
npm test
```

Expected: PASS — all tests in both test files passing (9 tests total).

- [ ] **Step 6: Commit**

```bash
git add backend/services/aiProviderService.js backend/tests/aiProviderService.test.js backend/package.json backend/package-lock.json
git commit -m "feat: add AIProviderService with Gemini and Claude adapters"
```

---

## Task 5: Auth middleware

**Files:**
- Create: `backend/middleware/auth.js`

- [ ] **Step 1: Create the middleware**

Create `backend/middleware/auth.js`:

```javascript
/**
 * Auth middleware — extracts userId from Supabase JWT Bearer token.
 * Sets req.userId and req.userEmail on success.
 * Returns 401 if token is missing or malformed.
 */
function extractUserId(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const jwt = authHeader.split(' ')[1];
  try {
    const base64 = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
    if (!payload.sub) throw new Error('No sub in token');
    req.userId = payload.sub;
    req.userEmail = payload.email || null;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = { extractUserId };
```

- [ ] **Step 2: Verify the existing accept-invitation endpoint still works**

The existing accept-invitation route in `backend/index.js` (lines ~262-352) does its own manual JWT decode inline. Leave it as-is for now — it works. The new auth middleware is for new routes only.

- [ ] **Step 3: Commit**

```bash
git add backend/middleware/auth.js
git commit -m "feat: add reusable auth middleware for JWT extraction"
```

---

## Task 6: User settings routes

**Files:**
- Create: `backend/routes/user.js`
- Modify: `backend/index.js`

- [ ] **Step 1: Create the user routes file**

Create `backend/routes/user.js`:

```javascript
const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { extractUserId } = require('../middleware/auth');
const { AIProviderService, ProviderError } = require('../services/aiProviderService');
const { encrypt, decrypt } = require('../services/encryptionService');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const aiProvider = new AIProviderService();

// GET /api/user/settings
router.get('/settings', extractUserId, async (req, res) => {
  try {
    const { data: settings, error } = await supabase
      .from('user_settings')
      .select('role, api_provider, api_key_encrypted, monthly_usage, usage_limit, byok_nudge_dismissed')
      .eq('user_id', req.userId)
      .single();

    if (error && error.code === 'PGRST116') {
      return res.json({
        role: null,
        apiProvider: null,
        maskedKey: null,
        usage: { used: 0, limit: 10 },
        byokNudgeDismissed: false,
      });
    }
    if (error) throw error;

    res.json({
      role: settings.role,
      apiProvider: settings.api_provider,
      maskedKey: settings.api_key_encrypted
        ? aiProvider.maskKey(decrypt(settings.api_key_encrypted))
        : null,
      usage: { used: settings.monthly_usage, limit: settings.usage_limit },
      byokNudgeDismissed: settings.byok_nudge_dismissed,
    });
  } catch (err) {
    console.error('GET /api/user/settings error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/user/role
router.post('/role', extractUserId, async (req, res) => {
  const { role } = req.body;
  const validRoles = ['developer', 'founder_pm', 'student'];
  if (!role || !validRoles.includes(role)) {
    return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
  }

  try {
    const { error } = await supabase
      .from('user_settings')
      .upsert({ user_id: req.userId, role, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('POST /api/user/role error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/user/api-key
router.post('/api-key', extractUserId, async (req, res) => {
  const key = (req.body.key || '').trim();
  if (!key) {
    return res.status(400).json({ error: 'API key is required' });
  }

  const provider = aiProvider.detectProvider(key);
  if (!provider) {
    return res.status(400).json({
      error: 'Unrecognised key format. Supported: Claude (sk-ant-...) and Gemini (AIza...)',
    });
  }

  try {
    await aiProvider.validateKey(key, provider);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid or expired key. Please check it and try again.' });
  }

  try {
    const encrypted = encrypt(key);
    const { error } = await supabase
      .from('user_settings')
      .upsert(
        { user_id: req.userId, api_key_encrypted: encrypted, api_provider: provider, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );
    if (error) throw error;
    res.json({ success: true, provider, maskedKey: aiProvider.maskKey(key) });
  } catch (err) {
    console.error('POST /api/user/api-key error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/user/api-key
router.delete('/api-key', extractUserId, async (req, res) => {
  try {
    const { error } = await supabase
      .from('user_settings')
      .update({ api_key_encrypted: null, api_provider: null, updated_at: new Date().toISOString() })
      .eq('user_id', req.userId);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/user/api-key error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/user/dismiss-byok-nudge
router.post('/dismiss-byok-nudge', extractUserId, async (req, res) => {
  try {
    const { error } = await supabase
      .from('user_settings')
      .upsert(
        { user_id: req.userId, byok_nudge_dismissed: true, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('POST /api/user/dismiss-byok-nudge error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
```

- [ ] **Step 2: Mount the user router and fix CORS in index.js**

In `backend/index.js`:

**a) Add the user routes import** after the existing service imports (around line 9):
```javascript
const userRouter = require('./routes/user');
```

**b) Fix CORS** to allow GET and DELETE (line 40):
```javascript
// Replace:
res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
// With:
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
```

**c) Mount the user router** after the middleware block (after line 48, before the upload endpoint):
```javascript
// User settings routes
app.use('/api/user', userRouter);
```

- [ ] **Step 3: Restart backend and test manually**

```bash
cd /Users/kingsolomon/Desktop/Projects/ProjectPlanner/project-planner/backend
node index.js
```

In another terminal, test with a real JWT from the browser (open DevTools → Application → Local Storage → find Supabase session):
```bash
curl -H "Authorization: Bearer <paste_token>" http://localhost:3001/api/user/settings
```

Expected: `{"role":null,"apiProvider":null,"maskedKey":null,"usage":{"used":0,"limit":10},"byokNudgeDismissed":false}`

- [ ] **Step 4: Commit**

```bash
git add backend/routes/user.js backend/index.js
git commit -m "feat: add user settings API routes (role, api-key, usage)"
```

---

## Task 7: Update /api/chat to use AIProviderService

**Files:**
- Modify: `backend/index.js`

- [ ] **Step 1: Add AIProviderService import to index.js**

At the top of `backend/index.js`, after the existing service imports:
```javascript
const { AIProviderService, UsageLimitError } = require('./services/aiProviderService');
const { extractUserId } = require('./middleware/auth');
const aiProviderService = new AIProviderService();
```

- [ ] **Step 2: Replace the /api/chat handler**

Find the `/api/chat` handler (starting at line 87 with `app.post('/api/chat', async (req, res) => {`) and replace the entire function body through its closing `});` with:

```javascript
app.post('/api/chat', extractUserId, async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const { text } = await aiProviderService.generate(req.userId, prompt);
    res.json({ content: text });
  } catch (err) {
    if (err.name === 'UsageLimitError') {
      return res.status(429).json({ error: err.message, code: 'USAGE_LIMIT_REACHED' });
    }
    if (err.name === 'ProviderError') {
      return res.status(400).json({ error: err.message });
    }
    console.error('Chat endpoint error:', err);
    res.status(500).json({ error: 'AI generation failed. Please try again.' });
  }
});
```

- [ ] **Step 3: Restart and verify generation still works end-to-end**

```bash
cd /Users/kingsolomon/Desktop/Projects/ProjectPlanner/project-planner/backend
node index.js
```

Then open the app in browser, create a project, and confirm roadmap generation works. Check the backend console — you should see no errors.

- [ ] **Step 4: Run tests to confirm nothing broke**

```bash
cd /Users/kingsolomon/Desktop/Projects/ProjectPlanner/project-planner/backend
npm test
```

Expected: all tests still passing.

- [ ] **Step 5: Commit**

```bash
git add backend/index.js
git commit -m "feat: route /api/chat through AIProviderService with usage tracking"
```

---

## Task 8: Frontend API constants and aiCacheService auth

**Files:**
- Modify: `frontend/src/config/api.js`
- Modify: `frontend/src/constants/routes.js`
- Modify: `frontend/src/constants/messages.js`
- Modify: `frontend/src/services/aiCacheService.js`

- [ ] **Step 1: Add user endpoints to api.js**

Replace the contents of `frontend/src/config/api.js`:

```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export { API_BASE_URL };

export const API_ENDPOINTS = {
  CHAT: `${API_BASE_URL}/api/chat`,
  UPLOAD: `${API_BASE_URL}/api/upload`,
  SUMMARIZE: `${API_BASE_URL}/api/summarize`,
  INVITE_COLLABORATOR: `${API_BASE_URL}/api/invite-collaborator`,
  ACCEPT_INVITATION: `${API_BASE_URL}/api/accept-invitation`,
  USER_SETTINGS: `${API_BASE_URL}/api/user/settings`,
  USER_ROLE: `${API_BASE_URL}/api/user/role`,
  USER_API_KEY: `${API_BASE_URL}/api/user/api-key`,
  DISMISS_BYOK: `${API_BASE_URL}/api/user/dismiss-byok-nudge`,
};

export default API_ENDPOINTS;
```

- [ ] **Step 2: Add SETTINGS to routes.js**

Open `frontend/src/constants/routes.js` and add:
```javascript
SETTINGS: '/settings',
```
to the exported ROUTES object (alongside DASHBOARD, PROFILE, etc.).

- [ ] **Step 3: Add BYOK and settings messages to messages.js**

Open `frontend/src/constants/messages.js` and add these entries to the relevant objects (add to SUCCESS and ERROR objects where they exist):
```javascript
// In SUCCESS object:
ROLE_SAVED: 'Your preferences have been saved.',
API_KEY_SAVED: 'API key saved and verified.',
API_KEY_REMOVED: 'API key removed. You\'re back on the free tier.',

// In ERROR object:
API_KEY_INVALID: 'Invalid or expired key. Please check it and try again.',
API_KEY_SAVE_FAILED: 'Failed to save API key. Please try again.',
USAGE_LIMIT_REACHED: 'Monthly limit reached. Add your API key in Settings to continue.',
SETTINGS_LOAD_FAILED: 'Failed to load settings.',
```

- [ ] **Step 4: Add auth header to aiCacheService.js**

Replace the `callAI` function in `frontend/src/services/aiCacheService.js`:

```javascript
import { useQuery } from '@tanstack/react-query';
import { API_ENDPOINTS } from '@/config/api';
import { CACHE_CONFIG, QUERY_KEYS } from '@/constants/cache';
import { supabase } from '@/lib/supabase';

const callAI = async (prompt) => {
  const { data: { session } } = await supabase.auth.getSession();
  const headers = { 'Content-Type': 'application/json' };
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  const response = await fetch(API_ENDPOINTS.CHAT, {
    method: 'POST',
    headers,
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'AI service failed');
  }

  const data = await response.json();
  return data.content;
};

export const useAICache = (prompt) => {
  return useQuery({
    queryKey: [QUERY_KEYS.AI_RESPONSES, prompt],
    queryFn: () => callAI(prompt),
    enabled: !!prompt,
    staleTime: CACHE_CONFIG.AI_RESPONSES.staleTime,
    cacheTime: CACHE_CONFIG.AI_RESPONSES.cacheTime,
    retry: CACHE_CONFIG.AI_RESPONSES.retry,
  });
};
```

- [ ] **Step 5: Check supabase import path is correct**

Open `frontend/src/lib/supabase.js` and confirm the export is:
```javascript
export const supabase = createClient(...)
// or
export { supabase }
```

If it uses `export default`, change the import in aiCacheService.js to:
```javascript
import supabase from '@/lib/supabase';
```

- [ ] **Step 6: Test generation still works**

Start both servers, open the app, create a project, confirm roadmap generates. Check Network tab in DevTools — the POST to `/api/chat` should now include the `Authorization: Bearer ...` header.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/config/api.js frontend/src/constants/routes.js frontend/src/constants/messages.js frontend/src/services/aiCacheService.js
git commit -m "feat: add user API endpoints, auth header to AI calls"
```

---

## Task 9: useUserSettings and useUserRole hooks

**Files:**
- Create: `frontend/src/hooks/useUserSettings.js`
- Create: `frontend/src/hooks/useUserRole.js`
- Modify: `frontend/src/hooks/index.js`

- [ ] **Step 1: Create useUserSettings**

Create `frontend/src/hooks/useUserSettings.js`:

```javascript
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { API_ENDPOINTS } from '@/config/api';
import { supabase } from '@/lib/supabase';

const QUERY_KEY = 'userSettings';

async function fetchUserSettings() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const response = await fetch(API_ENDPOINTS.USER_SETTINGS, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (!response.ok) throw new Error('Failed to load settings');
  return response.json();
}

export function useUserSettings() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: fetchUserSettings,
    staleTime: 2 * 60 * 1000,   // 2 minutes
    retry: 1,
  });
}

/** Call this after any action that changes settings (role save, key save, generation) */
export function useInvalidateUserSettings() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
}
```

- [ ] **Step 2: Create useUserRole**

Create `frontend/src/hooks/useUserRole.js`:

```javascript
import { useUserSettings } from './useUserSettings';

/**
 * Returns the current user's role: 'developer' | 'founder_pm' | 'student' | null
 * null means role not set or settings not yet loaded.
 */
export function useUserRole() {
  const { data } = useUserSettings();
  return data?.role ?? null;
}
```

- [ ] **Step 3: Export from hooks/index.js**

Open `frontend/src/hooks/index.js` and add:
```javascript
export { useUserSettings, useInvalidateUserSettings } from './useUserSettings';
export { useUserRole } from './useUserRole';
```

- [ ] **Step 4: Verify the hooks load without errors**

Start the frontend dev server:
```bash
cd /Users/kingsolomon/Desktop/Projects/ProjectPlanner/project-planner/frontend
npm run dev
```

Open Dashboard in the browser. Open DevTools → Network → look for a GET to `/api/user/settings`. It should return 200 with the settings JSON.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/hooks/useUserSettings.js frontend/src/hooks/useUserRole.js frontend/src/hooks/index.js
git commit -m "feat: add useUserSettings and useUserRole hooks"
```

---

## Task 10: OnboardingModal

**Files:**
- Create: `frontend/src/components/Onboarding/OnboardingModal.jsx`

- [ ] **Step 1: Create the component**

Create `frontend/src/components/Onboarding/OnboardingModal.jsx`:

```jsx
import { useState } from 'react';
import { Code2, Briefcase, GraduationCap, X } from 'lucide-react';
import { API_ENDPOINTS } from '@/config/api';
import { supabase } from '@/lib/supabase';
import { useInvalidateUserSettings } from '@/hooks/useUserSettings';
import toast from 'react-hot-toast';

const ROLES = [
  {
    id: 'developer',
    icon: Code2,
    label: 'Developer',
    description: 'I write code and want AI agent integration',
  },
  {
    id: 'founder_pm',
    icon: Briefcase,
    label: 'Founder / PM',
    description: 'I manage products and teams',
  },
  {
    id: 'student',
    icon: GraduationCap,
    label: 'Student',
    description: "I'm learning and building projects",
  },
];

/**
 * OnboardingModal — shown once when user creates their first project.
 * @param {function} onComplete - called when role is saved or skipped
 */
export default function OnboardingModal({ onComplete }) {
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const invalidateSettings = useInvalidateUserSettings();

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(API_ENDPOINTS.USER_ROLE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ role: selected }),
      });
      if (!response.ok) throw new Error('Failed to save role');
      await invalidateSettings();
      onComplete();
    } catch {
      toast.error('Failed to save preference. You can set it later in Settings.');
      onComplete(); // don't block the user
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-md border border-zinc-200 dark:border-zinc-700">
        <div className="p-6">
          <div className="flex items-start justify-between mb-1">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              How are you planning to use this?
            </h2>
            <button
              onClick={onComplete}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors ml-4 mt-0.5"
            >
              <X size={18} />
            </button>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-5">
            We'll show you the most relevant features. You can change this anytime in Settings.
          </p>

          <div className="flex flex-col gap-2 mb-6">
            {ROLES.map(({ id, icon: Icon, label, description }) => (
              <button
                key={id}
                onClick={() => setSelected(id)}
                className={`flex items-center gap-3 p-3.5 rounded-lg border text-left transition-all ${
                  selected === id
                    ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-800'
                    : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500'
                }`}
              >
                <div className={`p-1.5 rounded-md ${selected === id ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
                  <Icon
                    size={16}
                    className={selected === id ? 'text-white dark:text-zinc-900' : 'text-zinc-600 dark:text-zinc-400'}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{label}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={onComplete}
              className="text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            >
              Skip for now
            </button>
            <button
              onClick={handleSave}
              disabled={!selected || saving}
              className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium rounded-lg disabled:opacity-40 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors"
            >
              {saving ? 'Saving...' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/Onboarding/OnboardingModal.jsx
git commit -m "feat: add OnboardingModal role picker component"
```

---

## Task 11: Wire OnboardingModal into project creation

**Files:**
- Modify: `frontend/src/pages/NewProjectChat/NewProjectChatPage.jsx`

- [ ] **Step 1: Add OnboardingModal to NewProjectChatPage**

At the top of `NewProjectChatPage.jsx`, add the imports:
```javascript
import OnboardingModal from '@/components/Onboarding/OnboardingModal';
import { useUserSettings } from '@/hooks/useUserSettings';
```

Inside the `NewProjectChatPage` component, add after the existing hooks:
```javascript
const { data: userSettings } = useUserSettings();
const [showOnboarding, setShowOnboarding] = React.useState(false);
const [onboardingDone, setOnboardingDone] = React.useState(false);

// Show onboarding once if role has not been set
React.useEffect(() => {
  if (userSettings !== undefined && userSettings?.role === null && !onboardingDone) {
    setShowOnboarding(true);
  }
}, [userSettings, onboardingDone]);
```

At the top of the JSX return (before the first element), add:
```jsx
{showOnboarding && (
  <OnboardingModal
    onComplete={() => {
      setShowOnboarding(false);
      setOnboardingDone(true);
    }}
  />
)}
```

- [ ] **Step 2: Test the flow**

1. If your account already has a role set, temporarily set it to null via Supabase SQL Editor: `UPDATE user_settings SET role = NULL WHERE user_id = '<your-id>';`
2. Navigate to `/new-project` in the app.
3. Confirm the OnboardingModal appears.
4. Select a role and click Continue — modal should close, role saved.
5. Refresh and navigate to `/new-project` again — modal should NOT appear (role is now set).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/NewProjectChat/NewProjectChatPage.jsx
git commit -m "feat: show OnboardingModal on first project creation"
```

---

## Task 12: BYOKModal

**Files:**
- Create: `frontend/src/components/BYOK/BYOKModal.jsx`

- [ ] **Step 1: Create the component**

Create `frontend/src/components/BYOK/BYOKModal.jsx`:

```jsx
import { Zap, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '@/config/api';
import { supabase } from '@/lib/supabase';
import { useInvalidateUserSettings } from '@/hooks/useUserSettings';
import { ROUTES } from '@/constants/routes';

const ANTHROPIC_CONSOLE_URL = 'https://console.anthropic.com/settings/keys';
const GOOGLE_AI_STUDIO_URL = 'https://aistudio.google.com/app/apikey';

/**
 * BYOKModal — prompts user to add their API key.
 * @param {'first-generation'|'one-remaining'} trigger - which scenario triggered this
 * @param {function} onDismiss - called when user dismisses
 */
export default function BYOKModal({ trigger, onDismiss }) {
  const navigate = useNavigate();
  const invalidateSettings = useInvalidateUserSettings();

  async function handleDismiss() {
    // Only mark as dismissed for trigger 1 (one-remaining trigger can show again)
    if (trigger === 'first-generation') {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        await fetch(API_ENDPOINTS.DISMISS_BYOK, {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        await invalidateSettings();
      } catch {
        // Silent — dismissing is best-effort
      }
    }
    onDismiss();
  }

  function handleAddKey() {
    onDismiss();
    navigate(ROUTES.SETTINGS);
  }

  const isFirstGen = trigger === 'first-generation';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-sm border border-zinc-200 dark:border-zinc-700">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
              <Zap size={18} className="text-zinc-700 dark:text-zinc-300" />
            </div>
            <button onClick={handleDismiss} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
              <X size={18} />
            </button>
          </div>

          {isFirstGen ? (
            <>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                Your project is ready.
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed">
                For the best results, add a{' '}
                <a href={ANTHROPIC_CONSOLE_URL} target="_blank" rel="noreferrer" className="text-zinc-900 dark:text-zinc-100 underline underline-offset-2">
                  Claude API key
                </a>
                . Just testing? Get a free{' '}
                <a href={GOOGLE_AI_STUDIO_URL} target="_blank" rel="noreferrer" className="text-zinc-900 dark:text-zinc-100 underline underline-offset-2">
                  Gemini key
                </a>{' '}
                — takes 30 seconds.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                You have 1 free generation left this month.
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed">
                Add your own API key to keep going without interruption.
              </p>
            </>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleAddKey}
              className="flex-1 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors"
            >
              Add my key
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-600 dark:text-zinc-400 rounded-lg hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors"
            >
              {isFirstGen ? 'Not now' : 'Continue without'}
            </button>
          </div>

          {isFirstGen && (
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-3 text-center">
              You won't see this again.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire BYOKModal triggers into NewProjectChatPage**

Open `frontend/src/pages/NewProjectChat/NewProjectChatPage.jsx`.

Add import at top:
```javascript
import BYOKModal from '@/components/BYOK/BYOKModal';
import { useInvalidateUserSettings } from '@/hooks/useUserSettings';
```

Add state and logic inside the component (after existing state):
```javascript
const invalidateSettings = useInvalidateUserSettings();
const [byokTrigger, setByokTrigger] = React.useState(null); // 'first-generation' | 'one-remaining' | null

// Check BYOK triggers whenever userSettings changes
React.useEffect(() => {
  if (!userSettings) return;
  if (userSettings.apiProvider) return; // user already has a key
  const { used, limit } = userSettings.usage;
  // Trigger 2: one remaining
  if (used === limit - 1 && byokTrigger === null) {
    setByokTrigger('one-remaining');
  }
}, [userSettings]);
```

Find the `useAICache` or generation completion logic in the page. Look for where roadmap generation succeeds (the `stage` changes to the final stage). Add this after a successful generation:

```javascript
// After successful generation, invalidate settings to pick up new usage count
// then check trigger 1 (first generation)
React.useEffect(() => {
  if (stage === CHAT_STAGES.ROADMAP_GENERATED) {
    invalidateSettings().then(() => {
      // Re-fetch will happen via query, useEffect above will catch one-remaining
      // Check for first-generation trigger
      if (userSettings && !userSettings.apiProvider && !userSettings.byokNudgeDismissed && userSettings.usage.used === 0) {
        setByokTrigger('first-generation');
      }
    });
  }
}, [stage]);
```

Add the modal to the JSX (alongside the OnboardingModal):
```jsx
{byokTrigger && (
  <BYOKModal
    trigger={byokTrigger}
    onDismiss={() => setByokTrigger(null)}
  />
)}
```

- [ ] **Step 3: Test trigger 1 (first generation)**

1. Set `byok_nudge_dismissed = false` and `monthly_usage = 0` for your user via Supabase if needed.
2. Generate a project.
3. After generation, the BYOKModal should appear with the "Your project is ready" message.
4. Dismiss it — should not reappear.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/BYOK/BYOKModal.jsx frontend/src/pages/NewProjectChat/NewProjectChatPage.jsx
git commit -m "feat: add BYOKModal with first-generation and one-remaining triggers"
```

---

## Task 13: ApiKeyPanel and SettingsPage

**Files:**
- Create: `frontend/src/components/Settings/ApiKeyPanel.jsx`
- Create: `frontend/src/pages/Settings/SettingsPage.jsx`

- [ ] **Step 1: Create ApiKeyPanel**

Create `frontend/src/components/Settings/ApiKeyPanel.jsx`:

```jsx
import { useState } from 'react';
import { Info, CheckCircle, XCircle, Loader2, Eye, EyeOff, Trash2 } from 'lucide-react';
import { API_ENDPOINTS } from '@/config/api';
import { supabase } from '@/lib/supabase';
import { useUserSettings, useInvalidateUserSettings } from '@/hooks/useUserSettings';
import toast from 'react-hot-toast';

const ANTHROPIC_URL = 'https://console.anthropic.com/settings/keys';
const GOOGLE_URL = 'https://aistudio.google.com/app/apikey';

const PROVIDER_LABELS = { claude: 'Claude', gemini: 'Gemini' };

export default function ApiKeyPanel() {
  const { data: settings } = useUserSettings();
  const invalidate = useInvalidateUserSettings();
  const [keyInput, setKeyInput] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [status, setStatus] = useState('idle'); // 'idle' | 'validating' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  const hasKey = !!settings?.apiProvider;
  const usagePercent = settings ? (settings.usage.used / settings.usage.limit) * 100 : 0;

  async function handleSave() {
    if (!keyInput.trim()) return;
    setStatus('validating');
    setErrorMsg('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(API_ENDPOINTS.USER_API_KEY, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ key: keyInput.trim() }),
      });
      const data = await response.json();
      if (!response.ok) {
        setStatus('error');
        setErrorMsg(data.error || 'Invalid key');
        return;
      }
      setStatus('success');
      setKeyInput('');
      setShowInput(false);
      await invalidate();
      toast.success('API key saved and verified.');
    } catch {
      setStatus('error');
      setErrorMsg('Something went wrong. Please try again.');
    }
  }

  async function handleRemove() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(API_ENDPOINTS.USER_API_KEY, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!response.ok) throw new Error('Failed to remove key');
      await invalidate();
      toast.success("API key removed. You're back on the free tier.");
    } catch {
      toast.error('Failed to remove key. Please try again.');
    }
  }

  return (
    <div className="space-y-6">
      {/* Usage meter (only shown when on free tier) */}
      {!hasKey && settings && (
        <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Monthly usage</span>
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {settings.usage.used} / {settings.usage.limit} free generations
            </span>
          </div>
          <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-zinc-900 dark:bg-zinc-100 rounded-full transition-all"
              style={{ width: `${Math.min(usagePercent, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Current key display */}
      {hasKey && !showInput ? (
        <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-0.5">
                {PROVIDER_LABELS[settings.apiProvider]} key active
              </p>
              <p className="text-sm font-mono text-zinc-400 dark:text-zinc-500">{settings.maskedKey}</p>
            </div>
            <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => { setShowInput(true); setStatus('idle'); }}
              className="text-xs px-3 py-1.5 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 transition-colors"
            >
              Replace
            </button>
            <button
              onClick={handleRemove}
              className="text-xs px-3 py-1.5 border border-red-200 dark:border-red-900 rounded-md text-red-500 hover:border-red-400 flex items-center gap-1 transition-colors"
            >
              <Trash2 size={12} /> Remove
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Your API key
              </label>
              <div className="group relative">
                <Info size={14} className="text-zinc-400 cursor-help" />
                <div className="absolute right-0 bottom-6 w-64 p-3 bg-zinc-900 dark:bg-zinc-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 leading-relaxed">
                  Your key is encrypted and stored securely. It's never shown again after saving — to update it, paste a new one.
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={keyInput}
                  onChange={(e) => { setKeyInput(e.target.value); setStatus('idle'); }}
                  placeholder="sk-ant-... or AIza..."
                  className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleSave}
                disabled={!keyInput.trim() || status === 'validating'}
                className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium rounded-lg disabled:opacity-40 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors flex items-center gap-1.5"
              >
                {status === 'validating' ? <Loader2 size={14} className="animate-spin" /> : null}
                {status === 'validating' ? 'Checking...' : 'Save'}
              </button>
            </div>

            {/* Status feedback */}
            {status === 'success' && (
              <p className="flex items-center gap-1.5 text-xs text-green-600 mt-1.5">
                <CheckCircle size={12} /> Key verified and saved.
              </p>
            )}
            {status === 'error' && (
              <p className="flex items-center gap-1.5 text-xs text-red-500 mt-1.5">
                <XCircle size={12} /> {errorMsg}
              </p>
            )}
          </div>

          <p className="text-xs text-zinc-400 dark:text-zinc-500 leading-relaxed">
            Supports{' '}
            <a href={ANTHROPIC_URL} target="_blank" rel="noreferrer" className="underline underline-offset-2 text-zinc-600 dark:text-zinc-300">
              Claude
            </a>{' '}
            (recommended for best results) and{' '}
            <a href={GOOGLE_URL} target="_blank" rel="noreferrer" className="underline underline-offset-2 text-zinc-600 dark:text-zinc-300">
              Gemini
            </a>{' '}
            (free tier available).
          </p>

          {showInput && (
            <button
              onClick={() => setShowInput(false)}
              className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create SettingsPage**

Create `frontend/src/pages/Settings/SettingsPage.jsx`:

```jsx
import { useState } from 'react';
import { User, Key } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettings, useInvalidateUserSettings } from '@/hooks/useUserSettings';
import ApiKeyPanel from '@/components/Settings/ApiKeyPanel';
import { API_ENDPOINTS } from '@/config/api';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

const ROLE_OPTIONS = [
  { value: 'developer', label: 'Developer', desc: 'Code, agents, and integrations' },
  { value: 'founder_pm', label: 'Founder / PM', desc: 'Products, teams, and milestones' },
  { value: 'student', label: 'Student', desc: 'Learning and building projects' },
];

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'api-key', label: 'API Key', icon: Key },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const { user } = useAuth();
  const { data: settings } = useUserSettings();
  const invalidate = useInvalidateUserSettings();
  const [savingRole, setSavingRole] = useState(false);

  async function handleRoleChange(role) {
    setSavingRole(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(API_ENDPOINTS.USER_ROLE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ role }),
      });
      if (!response.ok) throw new Error();
      await invalidate();
      toast.success('Preferences saved.');
    } catch {
      toast.error('Failed to save. Please try again.');
    } finally {
      setSavingRole(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50 mb-6">Settings</h1>

      {/* Tab nav */}
      <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-700 mb-8">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === id
                ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-50'
                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 block mb-1">Email</label>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800">
              {user?.email}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 block mb-3">
              How are you using this?
            </label>
            <div className="flex flex-col gap-2">
              {ROLE_OPTIONS.map(({ value, label, desc }) => (
                <button
                  key={value}
                  onClick={() => handleRoleChange(value)}
                  disabled={savingRole}
                  className={`flex items-center justify-between p-3.5 rounded-lg border text-left transition-all disabled:opacity-60 ${
                    settings?.role === value
                      ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-800'
                      : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500'
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{label}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{desc}</p>
                  </div>
                  {settings?.role === value && (
                    <div className="w-2 h-2 rounded-full bg-zinc-900 dark:bg-zinc-100 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* API Key tab */}
      {activeTab === 'api-key' && <ApiKeyPanel />}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/Settings/ApiKeyPanel.jsx frontend/src/pages/Settings/SettingsPage.jsx
git commit -m "feat: add ApiKeyPanel and SettingsPage components"
```

---

## Task 14: Add /settings route and nav link

**Files:**
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/layouts/RootLayout.jsx`

- [ ] **Step 1: Add the route in App.jsx**

In `frontend/src/App.jsx`, add the import:
```javascript
import SettingsPage from '@/pages/Settings/SettingsPage';
```

Inside the protected routes block (alongside DASHBOARD, PROFILE, etc.):
```jsx
<Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
```

- [ ] **Step 2: Add Settings link in RootLayout**

Open `frontend/src/layouts/RootLayout.jsx` and read its current content. Find where the nav links are rendered (Profile, Dashboard, etc.) and add a Settings link using the same pattern:

```jsx
import { Settings } from 'lucide-react';
import { ROUTES } from '@/constants/routes';

// In the nav links section, add alongside other nav items:
<Link to={ROUTES.SETTINGS} className="...same classes as other nav links...">
  <Settings size={16} />
  Settings
</Link>
```

Use the exact same className pattern as the existing Profile link so it looks consistent.

- [ ] **Step 3: Verify the route works**

Start the dev server and navigate to `/settings`. Confirm:
- Profile tab shows email and role selector
- API Key tab shows the key panel with usage meter
- Nav link in header takes you to `/settings`

- [ ] **Step 4: Commit**

```bash
git add frontend/src/App.jsx frontend/src/layouts/RootLayout.jsx
git commit -m "feat: add /settings route and nav link"
```

---

## Task 15: Dashboard usage indicator

**Files:**
- Modify: `frontend/src/pages/Dashboard/Dashboard.jsx`

- [ ] **Step 1: Read current Dashboard.jsx**

Read `frontend/src/pages/Dashboard/Dashboard.jsx` to find where the header/top section is rendered.

- [ ] **Step 2: Add usage indicator**

At the top of the Dashboard component, add:
```javascript
import { useUserSettings } from '@/hooks/useUserSettings';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';

// Inside Dashboard component:
const { data: settings } = useUserSettings();
const navigate = useNavigate();

const showUsageBanner = settings && !settings.apiProvider && settings.usage.used > 0;
```

Inside the JSX, add a subtle banner just below the page header (before the project grid):
```jsx
{showUsageBanner && (
  <div className="flex items-center justify-between px-4 py-2.5 mb-4 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm">
    <span className="text-zinc-500 dark:text-zinc-400">
      <span className="text-zinc-900 dark:text-zinc-100 font-medium">{settings.usage.used}</span> of{' '}
      <span className="text-zinc-900 dark:text-zinc-100 font-medium">{settings.usage.limit}</span> free generations used this month.
    </span>
    <button
      onClick={() => navigate(ROUTES.SETTINGS + '?tab=api-key')}
      className="text-xs font-medium text-zinc-700 dark:text-zinc-300 underline underline-offset-2 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
    >
      Add your key →
    </button>
  </div>
)}
```

- [ ] **Step 3: Also handle the tab query param in SettingsPage**

In `frontend/src/pages/Settings/SettingsPage.jsx`, update the initial tab state to read from the URL:

```javascript
import { useSearchParams } from 'react-router-dom';

// Replace:
const [activeTab, setActiveTab] = useState('profile');
// With:
const [searchParams] = useSearchParams();
const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile');
```

- [ ] **Step 4: Test the banner**

Ensure `monthly_usage > 0` and `api_key_encrypted IS NULL` for your user. Load Dashboard — banner should appear. Clicking "Add your key →" should go to Settings → API Key tab.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/Dashboard/Dashboard.jsx frontend/src/pages/Settings/SettingsPage.jsx
git commit -m "feat: add usage indicator on Dashboard and tab deep-link in Settings"
```

---

## Task 16: Role-based feature surfacing in ProjectDetailPage

**Files:**
- Modify: `frontend/src/pages/ProjectDetail/ProjectDetailPage.jsx`

- [ ] **Step 1: Add useUserRole to ProjectDetailPage**

Open `frontend/src/pages/ProjectDetail/ProjectDetailPage.jsx`.

Add import:
```javascript
import { useUserRole } from '@/hooks/useUserRole';
```

Inside the component, add after existing hooks:
```javascript
const role = useUserRole();
```

- [ ] **Step 2: Apply role-based prominence to the Team button**

Find the Team/Invite button in the ProjectDetailPage JSX. Wrap it to show differently based on role.

For `founder_pm`, make the team button more prominent (shown as a card in the action area rather than an icon button). For other roles, keep the existing button. Example pattern:

```jsx
{/* Team button — prominent for Founder/PM */}
{role === 'founder_pm' ? (
  <button
    onClick={() => setShowTeamPanel(true)}
    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors bg-white dark:bg-zinc-800"
  >
    <Users size={15} />
    Manage Team
  </button>
) : (
  // existing Team button — keep as-is
  <button onClick={() => setShowTeamPanel(true)} ...existing props...>
    ...existing content...
  </button>
)}
```

- [ ] **Step 3: Hide MCP setup card from student role (placeholder for sub-project 4)**

Add this comment where the MCP card will eventually go, so sub-project 4 knows where to render it:

```jsx
{/* MCP Setup Card — rendered here for 'developer' role in sub-project 4 */}
{role === 'developer' && null /* placeholder — implemented in Foundation sub-project 4 */}
```

- [ ] **Step 4: Test role surfacing**

1. Set your role to `founder_pm` via Settings → Profile.
2. Open a project — Team button should show as "Manage Team" card-style.
3. Set role to `developer` — Team button returns to icon button style.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/ProjectDetail/ProjectDetailPage.jsx
git commit -m "feat: role-based team panel prominence in ProjectDetailPage"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| user_settings table | Task 1 |
| EncryptionService AES-256-GCM | Task 3 |
| AIProviderService routing | Task 4 |
| Auth middleware | Task 5 |
| GET/POST/DELETE user routes | Task 6 |
| /api/chat updated to use AIProviderService | Task 7 |
| CORS updated (GET + DELETE) | Task 6 step 2 |
| useUserSettings + useUserRole | Task 9 |
| OnboardingModal (role picker) | Task 10 |
| OnboardingModal wired into creation | Task 11 |
| BYOKModal (two triggers) | Task 12 |
| First-generation trigger | Task 12 step 2 |
| One-remaining trigger | Task 12 step 2 |
| dismiss-byok-nudge endpoint | Task 6 |
| ApiKeyPanel (key entry, validation, masked display) | Task 13 |
| SettingsPage (Profile + API Key tabs) | Task 13 |
| /settings route | Task 14 |
| Nav link to settings | Task 14 |
| Dashboard usage indicator | Task 15 |
| Role-based feature surfacing | Task 16 |
| @anthropic-ai/sdk installed | Task 4 step 1 |
| ENCRYPTION_KEY env var | Task 3 step 5 |

All spec requirements covered. No gaps found.
