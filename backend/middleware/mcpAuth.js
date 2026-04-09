/**
 * MCP auth middleware — validates MCP token Bearer header against mcp_tokens table.
 * Sets req.userId on success. Returns 401 for bad tokens, 500 for service errors.
 */
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function extractMcpUserId(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'MCP token required' });
  }

  try {
    const { data, error } = await supabase
      .from('mcp_tokens')
      .select('user_id')
      .eq('token', token)
      .single();

    if (error) {
      // PGRST116 = no rows found — that's a bad token, not a server error
      if (error.code === 'PGRST116') {
        return res.status(401).json({ error: 'Invalid MCP token' });
      }
      console.error('MCP token validation error:', error);
      return res.status(500).json({ error: 'Service error' });
    }

    if (!data) {
      return res.status(401).json({ error: 'Invalid MCP token' });
    }

    req.userId = data.user_id;
    next();
  } catch (err) {
    console.error('MCP token validation error:', err);
    return res.status(500).json({ error: 'Service error' });
  }
}

module.exports = { extractMcpUserId };
