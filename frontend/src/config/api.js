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
  USER_ACCOUNT: `${API_BASE_URL}/api/user/account`,
  DISMISS_BYOK: `${API_BASE_URL}/api/user/dismiss-byok-nudge`,
  MCP_TOKEN: `${API_BASE_URL}/api/user/mcp-token`,
  MCP_TOKEN_STATUS: `${API_BASE_URL}/api/user/mcp-token/status`,
  MCP_IMPORT: `${API_BASE_URL}/api/mcp/sync`,
};

export default API_ENDPOINTS;
