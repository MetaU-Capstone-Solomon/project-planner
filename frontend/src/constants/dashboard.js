import {
  BarChart2,
  CheckCircle,
  TrendingUp,
  Clock,
} from 'lucide-react';

/**
 * Dashboard constants
 * 
 * Configuration for:
 * - Stats cards
 * - Icons and labels
 * - Default values
 */

export const STATS_CONFIG = {
  totalProjects: {
    title: "Total Projects",
    icon: BarChart2,
    key: "totalProjects"
  },
  completedProjects: {
    title: "Completed Projects", 
    icon: CheckCircle,
    key: "completedProjects"
  },
  overallProgress: {
    title: "Overall Progress",
    icon: TrendingUp,
    key: "overallProgress"
  },
  activeMilestones: {
    title: "Active Milestones",
    icon: Clock,
    key: "activeMilestones"
  }
};

export const DASHBOARD_MESSAGES = {
  WELCOME: "Track your learning journey and achieve your goals with personalized roadmaps",
  NO_PROJECTS: "No projects yet. Start by creating a new roadmap.",
  PROJECT_CARDS_PLACEHOLDER: "Project cards will be implemented in the next PR"
}; 