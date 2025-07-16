import { useState, useEffect } from 'react';
import { calculateProjectStats } from '@/utils/dashboardUtils';
import { getUserProjects } from '@/services/projectService';
import { showErrorToast } from '@/utils/toastUtils';
import { MESSAGES } from '@/constants/messages';

/**
 * Custom hook for managing dashboard data
 *
 * Handles:
 * - Project data fetching from backend
 * - Loading states
 * - Error handling
 * - Stats calculations
 *
 * @returns {Object} Dashboard data and functions
 */
const useDashboardData = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch projects from backend
  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await getUserProjects();

        if (result.success) {
          setProjects(result.projects);
        } else {
          setError(result.error);
          showErrorToast(MESSAGES.ERROR.PROJECTS_LOAD_FAILED);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
        setError(error.message);
        showErrorToast(MESSAGES.ERROR.PROJECTS_LOAD_FAILED);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

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
