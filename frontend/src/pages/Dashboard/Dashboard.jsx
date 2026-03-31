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
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import StatsCard from '@/components/StatsCard';
import ProjectCard from '@/components/ProjectCard';
import LoadingSpinner from '@/components/Loading/LoadingSpinner';
import useDashboardData from '@/hooks/useDashboardData';
import { useUserSettings } from '@/hooks/useUserSettings';
import { STATS_CONFIG, DASHBOARD_MESSAGES } from '@/constants/dashboard';
import { COLOR_CLASSES, COLOR_PATTERNS } from '@/constants/colors';
import { ROUTES } from '@/constants/routes';

const Dashboard = () => {
  const { user } = useAuth();
  const { projects, loading, error, stats } = useDashboardData();
  const navigate = useNavigate();
  const { data: settings } = useUserSettings();
  const showUsageBanner = settings && !settings.apiProvider && settings.usage?.used > 0;

  return (
    <div className={`${COLOR_PATTERNS.components.page}`}>
      <div className="p-6">
        <main>
          {/* Welcome section */}
          <div className="mb-8 text-center">
            <h1 className={`mb-4 text-4xl font-bold ${COLOR_CLASSES.text.heading}`}>
              Welcome back, {user?.user_metadata?.full_name?.split(' ')[0] || 'Roadmapper'}!
            </h1>
            <p className={`mb-6 ${COLOR_CLASSES.text.body}`}>{DASHBOARD_MESSAGES.WELCOME}</p>
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

          {/* Usage indicator banner */}
          {showUsageBanner && (
            <div className="flex items-center justify-between px-4 py-2.5 mb-4 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm">
              <span className="text-zinc-500 dark:text-zinc-400">
                <span className="text-zinc-900 dark:text-zinc-100 font-medium">{settings.usage.used}</span> of{' '}
                <span className="text-zinc-900 dark:text-zinc-100 font-medium">{settings.usage.limit}</span> free generations used this month.
              </span>
              <button
                onClick={() => navigate(ROUTES.SETTINGS + '?tab=api-key')}
                className="text-xs font-medium text-zinc-700 dark:text-zinc-300 underline underline-offset-2 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                Add your key →
              </button>
            </div>
          )}

          {/* Project list section */}
          <div>
            <h3 className={`text-xl font-semibold ${COLOR_CLASSES.text.heading} mb-4`}>
              Your Roadmaps
            </h3>

            {loading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : error ? (
              <div className={`py-8 text-center text-red-600 dark:text-red-400`}>
                <p>Failed to load projects. Please try again.</p>
                <button
                  onClick={() => window.location.reload()}
                  className={`mt-4 rounded-lg bg-gray-200 px-4 py-2 dark:bg-gray-700 ${COLOR_CLASSES.text.heading} transition-colors hover:bg-gray-300 dark:hover:bg-gray-600`}
                >
                  Retry
                </button>
              </div>
            ) : projects.length === 0 ? (
              <div className={`py-8 text-center text-gray-500 dark:text-gray-400`}>
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
