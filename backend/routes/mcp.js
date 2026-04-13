const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { extractMcpUserId } = require('../middleware/mcpAuth');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DASHBOARD_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const { track } = require('../services/analyticsService');

router.use(extractMcpUserId);

// GET /api/mcp/projects — list all projects for this user
router.get('/projects', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('roadmap')
      .select('id, title, content, created_at, updated_at')
      .eq('user_id', req.userId);
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('GET /api/mcp/projects error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/mcp/projects/:id
router.get('/projects/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('roadmap')
      .select('id, title, content, created_at, updated_at')
      .eq('user_id', req.userId)
      .eq('id', req.params.id)
      .single();
    if (error && error.code === 'PGRST116') return res.status(404).json({ error: 'Project not found' });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('GET /api/mcp/projects/:id error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/mcp/projects — insert (optionally with caller-supplied id)
router.post('/projects', async (req, res) => {
  try {
    const { id, title, content } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'title and content are required' });
    const now = new Date().toISOString();
    const row = { user_id: req.userId, title, content, created_at: now, updated_at: now };
    if (id) row.id = id;
    const { data, error } = await supabase.from('roadmap').insert(row).select('id').single();
    if (error) throw error;
    res.status(201).json({ id: data.id });
  } catch (err) {
    console.error('POST /api/mcp/projects error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/mcp/projects/:id — update title and/or content
router.put('/projects/:id', async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title && !content) return res.status(400).json({ error: 'Nothing to update' });
    const updates = { updated_at: new Date().toISOString() };
    if (title) updates.title = title;
    if (content) updates.content = content;
    const { error } = await supabase
      .from('roadmap').update(updates).eq('user_id', req.userId).eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('PUT /api/mcp/projects/:id error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/mcp/projects/:id
router.delete('/projects/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('roadmap').delete().eq('user_id', req.userId).eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/mcp/projects/:id error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/mcp/sync — bulk upsert using local project UUIDs as cloud UUIDs
router.post('/sync', async (req, res) => {
  try {
    const { projects } = req.body;
    if (!Array.isArray(projects) || projects.length === 0) {
      return res.status(400).json({ error: 'projects array is required and must not be empty' });
    }
    // Validate every project has required fields
    const invalid = projects.filter(p => !p.id || !p.title || !p.content);
    if (invalid.length > 0) {
      return res.status(400).json({
        error: `${invalid.length} project(s) missing required fields (id, title, content)`,
      });
    }
    const now = new Date().toISOString();
    const rows = projects.map(p => ({
      id: p.id,
      user_id: req.userId,
      title: p.title,
      content: p.content,
      created_at: p.created_at || now,
      updated_at: now,
    }));
    const { error } = await supabase.from('roadmap').upsert(rows, { onConflict: 'id' });
    if (error) throw error;
    res.json({
      synced: rows.length,
      projectIds: rows.map(r => r.id),
      dashboardUrl: `${DASHBOARD_URL}/dashboard`,
      message: `${rows.length} project(s) synced. View at ${DASHBOARD_URL}/dashboard`,
    });
    track('mcp_sync', req.userId, { project_count: rows.length });
  } catch (err) {
    console.error('POST /api/mcp/sync error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
