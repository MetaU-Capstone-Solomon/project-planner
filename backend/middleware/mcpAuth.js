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

  const { data, error } = await supabase
    .from('mcp_tokens')
    .select('user_id')
    .eq('token', token)
    .single();

  if (error || !data) {
    return res.status(401).json({ error: 'Invalid MCP token' });
  }

  req.userId = data.user_id;
  next();
}

module.exports = { extractMcpUserId };
