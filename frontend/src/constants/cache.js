// Cache time constants
export const CACHE_TIMES = {
  ONE_MINUTE: 60 * 1000,
  TWO_MINUTES: 2 * 60 * 1000,
  FIVE_MINUTES: 5 * 60 * 1000,
  TEN_MINUTES: 10 * 60 * 1000,
  TWENTY_MINUTES: 20 * 60 * 1000,
  ONE_HOUR: 60 * 60 * 1000,
  ONE_DAY: 24 * 60 * 60 * 1000,
};

export const CACHE_CONFIG = {
  AI_RESPONSES: {
    staleTime: CACHE_TIMES.FIVE_MINUTES,
    cacheTime: CACHE_TIMES.TWENTY_MINUTES,
    retry: 1,
  },
  USER_PROJECTS: {
    staleTime: CACHE_TIMES.TWO_MINUTES,
    cacheTime: CACHE_TIMES.TWENTY_MINUTES,
    retry: 1,
  },
  PROJECT_DETAILS: {
    staleTime: CACHE_TIMES.TWO_MINUTES,
    cacheTime: CACHE_TIMES.TWENTY_MINUTES,
    retry: 1,
  },
  USER_PROFILE: {
    staleTime: CACHE_TIMES.TEN_MINUTES,
    cacheTime: CACHE_TIMES.ONE_HOUR,
    retry: 1,
  },
  STATIC_CONTENT: {
    staleTime: CACHE_TIMES.ONE_HOUR,
    cacheTime: CACHE_TIMES.ONE_DAY,
    retry: 1,
  },
};

// Constants for query keys
export const QUERY_KEYS = {
  AI_RESPONSES: 'ai-response',
  USER_PROJECTS: 'user-projects',
  PROJECT_DETAILS: 'project',
  USER_PROFILE: 'user-profile',
  STATIC_CONTENT: 'static-content',
};

// Constants for storage keys
export const STORAGE_KEYS = {
  ROADMAP_CACHE: 'roadmap-cache',
  CHAT_MESSAGES: 'chatMessages',
  CHAT_STAGE: 'chatStage',
  PROJECT_TITLE: 'projectTitle',
  PROJECT_FORM: 'projectForm',
};

// Constants for persistence config
export const PERSISTENCE_CONFIG = {
  maxAge: CACHE_TIMES.ONE_DAY,
};
