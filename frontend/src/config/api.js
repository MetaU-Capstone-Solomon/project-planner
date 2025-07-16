// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export { API_BASE_URL };

export const API_ENDPOINTS = {
  CHAT: `${API_BASE_URL}/api/chat`,
  UPLOAD: `${API_BASE_URL}/api/upload`,
  SUMMARIZE: `${API_BASE_URL}/api/summarize`,
};

export default API_ENDPOINTS;
