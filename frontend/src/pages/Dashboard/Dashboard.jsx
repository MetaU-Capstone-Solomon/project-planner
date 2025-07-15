/**
 * Dashboard Page
 *
 * Displays user's project overview with welcome message, statistics, and project list.
 *
 * Components:
 * - Welcome section with personalized greeting and create button
 * - Stats cards showing project metrics (Total, Completed, Progress, Milestones)
 * - Project list section with ProjectCard components
 *
 * Features:
 * - Real-time project data from backend
 * - Progress tracking and statistics
 * - Navigation to project details
 * - Error handling and loading states
 */

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import StatsCard from '@/components/StatsCard';
import ProjectCard from '@/components/ProjectCard';
import LoadingSpinner from '@/components/Loading/LoadingSpinner';
import useDashboardData from '@/hooks/useDashboardData';
import { STATS_CONFIG, DASHBOARD_MESSAGES } from '@/constants/dashboard';
import { COLOR_CLASSES } from '@/constants/colors';

const Dashboard = () => {
  const { user } = useAuth();
  const { projects, loading, error, stats } = useDashboardData();

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-800">
      <div className="p-6">
        <main>
          {/* Welcome section */}
          <div className="mb-8 text-center">
            <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">
              Welcome back, {user?.user_metadata?.full_name?.split(' ')[0] || 'Roadmapper'}!
            </h1>
            <p className="mb-6 text-gray-600 dark:text-gray-300">{DASHBOARD_MESSAGES.WELCOME}</p>
          </div>

          {/* Statistics */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(STATS_CONFIG).map(([key, config]) => (
              <StatsCard
                key={key}
                title={config.title}
                value={stats[config.key]}
                icon={config.icon}
              />
            ))}
          </div>

          {/* Project list section */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Your Roadmaps
            </h3>

            {loading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : error ? (
              <div className="text-center text-red-600 dark:text-red-400 py-8">
                <p>Failed to load projects. Please try again.</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 rounded-lg bg-gray-200 dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                {DASHBOARD_MESSAGES.NO_PROJECTS}
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
