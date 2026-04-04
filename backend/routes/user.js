const express = require('express');
const router = express.Router();
const crypto = require('crypto');
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
    console.error(`Key validation failed for provider=${provider}:`, err.message);
    return res.status(400).json({ error: err.message || 'Invalid or expired key. Please check it and try again.' });
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

// DELETE /api/user/account
router.delete('/account', extractUserId, async (req, res) => {
  try {
    await supabase.from('user_settings').delete().eq('user_id', req.userId);
    const { error } = await supabase.auth.admin.deleteUser(req.userId);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/user/account error:', err);
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

// POST /api/user/mcp-token  — generate (or replace) a PAT
router.post('/mcp-token', extractUserId, async (req, res) => {
  const token = 'mcp_' + crypto.randomBytes(32).toString('hex');
  try {
    const { error } = await supabase
      .from('mcp_tokens')
      .upsert({ user_id: req.userId, token, created_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (error) throw error;
    res.json({ token });
  } catch (err) {
    console.error('POST /api/user/mcp-token error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/user/mcp-token  — revoke PAT
router.delete('/mcp-token', extractUserId, async (req, res) => {
  try {
    const { error } = await supabase
      .from('mcp_tokens')
      .delete()
      .eq('user_id', req.userId);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/user/mcp-token error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/user/mcp-token/status  — returns { exists: boolean }, never the token value
router.get('/mcp-token/status', extractUserId, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('mcp_tokens')
      .select('id')
      .eq('user_id', req.userId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    res.json({ exists: !!data });
  } catch (err) {
    console.error('GET /api/user/mcp-token/status error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
