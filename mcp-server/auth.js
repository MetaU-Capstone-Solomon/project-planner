// mcp-server/auth.js

/**
 * Validates a Personal Access Token against the mcp_tokens table.
 * @param {object} supabase - Supabase client
 * @param {string} token - The MCP_TOKEN value from env
 * @returns {Promise<string>} userId
 * @throws if token not found
 */
export async function validatePat(supabase, token) {
  const { data, error } = await supabase
    .from('mcp_tokens')
    .select('user_id')
    .eq('token', token)
    .single();

  if (error || !data) {
    throw new Error('Invalid MCP_TOKEN. Generate a new one in Project Planner Settings.');
  }

  return data.user_id;
}
