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
