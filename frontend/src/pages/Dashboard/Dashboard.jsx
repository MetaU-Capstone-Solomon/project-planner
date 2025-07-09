/**
 * Dashboard Page
 * 
 * Displays user's project overview with welcome message, statistics, and project list.
 * 
 * Components:
 * - Welcome section with personalized greeting and create button
 * - Stats cards showing project metrics (Total, Completed, Progress, Milestones)
 * - Project list section (placeholder for next PR)
 * 
 * TODO (Next PRs):
 * - Backend integration: getUserProjects() service function
 * - ProjectCard component for individual project display
 * - stats calculation from project data
 * - Navigation to project detail pages
 */

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/Button/Button';
import StatsCard from '@/components/StatsCard';
import LoadingSpinner from '@/components/Loading/LoadingSpinner';
import useDashboardData from '@/hooks/useDashboardData';
import { STATS_CONFIG, DASHBOARD_MESSAGES } from '@/constants/dashboard';
import { ROUTES } from '@/constants/routes';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { projects, loading, stats } = useDashboardData();

  const handleNewProject = () => {
    navigate(ROUTES.NEW_PROJECT_CHAT);
  };

  const handleSignOut = () => {
    signOut();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-6">
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <div className="flex space-x-3">
            <Button onClick={handleNewProject} variant="primary" aria-label="Create new project">
              New Project
            </Button>
            <Button onClick={handleSignOut} variant="danger" aria-label="Sign out of application">
              Sign Out
            </Button>
          </div>
        </header>

        <main>
          {/* Welcome section */}
          <div className="text-center mb-8">
            <h2 className="mb-4 text-4xl font-bold text-gray-900">
              Welcome back, {user?.user_metadata?.full_name?.split(' ')[0] || 'Roadmapper'}!
            </h2>
            <p className="mb-6 text-gray-600">
              {DASHBOARD_MESSAGES.WELCOME}
            </p>
            <Button
              onClick={handleNewProject}
              variant="primary"
              aria-label="Create new roadmap"
            >
              Create New Roadmap
            </Button>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
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
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Roadmaps</h3>
            
            {loading ? (
              <LoadingSpinner size="lg" />
            ) : projects.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                {DASHBOARD_MESSAGES.NO_PROJECTS}
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {/* TODO: Add ProjectCard component and map through projects */}
                <div className="text-center text-gray-500 py-8">
                  {DASHBOARD_MESSAGES.PROJECT_CARDS_PLACEHOLDER}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
