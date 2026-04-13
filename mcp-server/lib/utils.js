// mcp-server/lib/utils.js

/**
 * Polls /health until the server responds or the timeout expires.
 * Used before cloud operations on Render free tier (spins down after inactivity).
 */
export async function waitForServer(apiUrl, timeoutMs = 40000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(`${apiUrl}/health`, { method: 'GET' });
      if (r.ok) return;
    } catch {
      // still booting
    }
    await new Promise(r => setTimeout(r, 3000));
  }
  throw new Error('ProPlan server did not respond within 40 seconds. Please try again.');
}
