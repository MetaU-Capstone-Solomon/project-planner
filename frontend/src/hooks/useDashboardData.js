
import { useQuery } from '@tanstack/react-query';
import { calculateProjectStats } from '@/utils/dashboardUtils';
import { getUserProjects } from '@/services/projectService';
import { showErrorToast } from '@/utils/toastUtils';
import { MESSAGES } from '@/constants/messages';
import { CACHE_CONFIG, QUERY_KEYS } from '@/constants/cache';

/**
 * hook for managing dashboard data with caching
 *
 * Handles:
 * - Project data fetching from backend with caching
 * - Loading states
 * - Error handling
 * - Stats calculations
 * 
 * HOW IT WORKS:
 * 
 * - Loads the user's project list using React Query.
 * - Checks cache first for instant loading.
 * - If cache is stale or missing, fetches from backend and updates cache.
 * - Cache is invalidated after any project update to ensure freshness.
 * - Cache timing and keys are managed in the config files.
 * 
 * 
 * @returns {Object} Dashboard data and functions
 */
const useDashboardData = () => {
  const {
    data: projects = [],
    loading,
    error,
  } = useQuery({
    queryKey: [QUERY_KEYS.USER_PROJECTS],
    queryFn: async () => {
      const result = await getUserProjects();
      if (result.success) {
        return result.projects;
      } else {
        throw new Error(result.error);
      }
    },
    staleTime: CACHE_CONFIG.USER_PROJECTS.staleTime,
    cacheTime: CACHE_CONFIG.USER_PROJECTS.cacheTime,
    retry: CACHE_CONFIG.USER_PROJECTS.retry,
    onError: (error) => {
      showErrorToast(MESSAGES.ERROR.PROJECTS_LOAD_FAILED);
    },
  });

  // Calculate stats from project data
  const stats = calculateProjectStats(projects);

  return {
    projects,
    loading,
    error,
    stats,
  };
};

export default useDashboardData;
