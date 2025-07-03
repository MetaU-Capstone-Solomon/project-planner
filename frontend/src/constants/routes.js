export const ROUTES = {
  HOME: '/',
  AUTH: '/auth',
  AUTH_CALLBACK: '/auth/callback',
  DASHBOARD: '/dashboard',
  NEW_PROJECT_CHAT: '/new-project-chat',
  PROFILE: '/profile',
  PROJECT_DETAIL: '/project/:projectId',
};

export const getProjectDetailPath = (projectId) => `/project/${projectId}`;
