// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export const API_ENDPOINTS = {
  CHAT: `${API_BASE_URL}/api/chat`,
  UPLOAD: `${API_BASE_URL}/api/upload`,
};

export default API_ENDPOINTS;
