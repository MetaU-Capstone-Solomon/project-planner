import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FolderOpen, CheckCircle, ListTodo, Users, Plus, ArrowRight, UserPlus, Flag } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/cache';
import { supabase } from '@/lib/supabase';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useRoleConfig } from '@/hooks/useRoleConfig';
import useDashboardData from '@/hooks/useDashboardData';
import { ROUTES, getProjectDetailPath } from '@/constants/routes';
import { stagger, pageTransition } from '@/constants/motion';
import { getParsedRoadmap } from '@/utils/roadmapValidation';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import ProgressRing from '@/components/ui/ProgressRing';
import McpStatusBadge from '@/components/McpStatusBadge/McpStatusBadge';
import TeamOverviewWidget from '@/components/TeamOverviewWidget/TeamOverviewWidget';
import LearningPathBar from '@/components/LearningPathBar/LearningPathBar';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function parseProjectData(project) {
  try {
    return getParsedRoadmap(project.content);
  } catch {
    return null;
  }
}

function getProjectTechs(project) {
  const data = parseProjectData(project);
  const raw = data?.metadata?.technologies || data?.metadata?.techStack || '';
  if (!raw) return [];
  return typeof raw === 'string'
    ? raw.split(',').map(t => t.trim()).filter(Boolean)
    : raw;
}

function getProjectTasks(project) {
  const data = parseProjectData(project);
  return data?.phases?.flatMap(p => p.milestones?.flatMap(m => m.tasks || []) || []) || [];
}

function getProjectEstimatedHours(project) {
  const data = parseProjectData(project);
  return data?.metadata?.estimatedHours || data?.metadata?.estimated_hours || null;
}

// ---------------------------------------------------------------------------
// StatCard
// ---------------------------------------------------------------------------
function StatCard({ label, value, icon: Icon, index }) {
  return (
    <motion.div variants={stagger.item} transition={{ duration: 0.3, delay: index * 0.06 }}>
      <Card className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-[var(--text-secondary)]">{label}</p>
            <p className="mt-1 text-3xl font-bold text-[var(--text-primary)]">{value ?? 0}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-subtle)]">
            <Icon size={18} style={{ color: 'var(--accent)' }} />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// ProjectCardItem
// ---------------------------------------------------------------------------
function ProjectCardItem({ project, showEstimatedHours }) {
  const navigate = useNavigate();
  const tasks = getProjectTasks(project);
  const completed = tasks.filter(t => t.status === 'completed').length;
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  const hours = showEstimatedHours ? getProjectEstimatedHours(project) : null;

  return (
    <Card onClick={() => navigate(getProjectDetailPath(project.id))} className="group p-5">
      <div className="flex items-start gap-4">
        <ProgressRing progress={progress} size={52} strokeWidth={4} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate font-semibold text-[var(--text-primary)]">{project.title}</h3>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {project.isShared && (
                  <Badge variant="accent">
                    <Users size={10} /> Shared
                  </Badge>
                )}
                {hours && (
                  <Badge variant="secondary">{hours}h est.</Badge>
                )}
              </div>
            </div>
            <ArrowRight size={16} className="mt-0.5 flex-shrink-0 text-[var(--text-muted)] transition-transform group-hover:translate-x-1" />
          </div>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Updated {new Date(project.updated_at).toLocaleDateString()}
          </p>
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// ProjectSkeleton
// ---------------------------------------------------------------------------
function ProjectSkeleton() {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
      <div className="flex items-center gap-4">
        <Skeleton className="h-13 w-13 flex-shrink-0" rounded />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
export default function Dashboard() {
  const { user } = useAuth();
  const { projects, loading, stats } = useDashboardData();
  const { data: settings } = useUserSettings();
  const { config } = useRoleConfig();
  const navigate = useNavigate();
  const [activeTech, setActiveTech] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel('dashboard-new-projects')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'roadmap',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_PROJECTS] });
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user?.id, queryClient]);

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'there';
  const showUsageBanner = settings && !settings.apiProvider && settings.usage?.used > 0;

  // Compute completed tasks directly from projects
  const completedTasksCount = useMemo(() => {
    return (projects || []).reduce((acc, p) => {
      const tasks = getProjectTasks(p);
      return acc + tasks.filter(t => t.status === 'completed').length;
    }, 0);
  }, [projects]);

  // Parse milestones from stats activeMilestones ("3/12")
  const [completedMilestones, totalMilestones] = useMemo(() => {
    const raw = stats?.activeMilestones ?? '0/0';
    const parts = raw.split('/').map(Number);
    return [parts[0] || 0, parts[1] || 0];
  }, [stats]);

  // Stat config — Founder/PM gets milestone-oriented labels
  const statValues = config.showMilestoneStats
    ? {
        total:     projects?.length ?? 0,
        completed: completedMilestones,
        tasks:     totalMilestones,
        members:   stats?.completedProjects ?? 0,
      }
    : {
        total:     projects?.length ?? 0,
        completed: stats?.completedProjects ?? 0,
        tasks:     completedTasksCount,
        members:   0,
      };

  const STAT_CONFIG = config.showMilestoneStats
    ? [
        { key: 'total',     label: 'Total Projects',       icon: FolderOpen  },
        { key: 'completed', label: 'Milestones Done',       icon: Flag        },
        { key: 'tasks',     label: 'Total Milestones',      icon: ListTodo    },
        { key: 'members',   label: 'Projects Completed',    icon: CheckCircle },
      ]
    : [
        { key: 'total',     label: 'Total Projects',  icon: FolderOpen  },
        { key: 'completed', label: 'Completed',        icon: CheckCircle },
        { key: 'tasks',     label: 'Tasks Done',       icon: ListTodo    },
        { key: 'members',   label: 'Team Members',     icon: Users       },
      ];

  // Tech filter chips (Developer only)
  const allTechs = useMemo(() => {
    if (!config.showTechFilter) return [];
    const set = new Set();
    (projects || []).forEach(p => getProjectTechs(p).forEach(t => set.add(t)));
    return [...set].slice(0, 10);
  }, [projects, config.showTechFilter]);

  const filteredProjects = useMemo(() => {
    if (!activeTech || !config.showTechFilter) return projects || [];
    return (projects || []).filter(p => getProjectTechs(p).includes(activeTech));
  }, [projects, activeTech, config.showTechFilter]);

  // Student encouragement: show when any project just hit a nice milestone
  const encouragementMsg = useMemo(() => {
    if (!config.showEncouragement || !projects?.length) return null;
    const totalTasks = (projects || []).reduce((a, p) => a + getProjectTasks(p).length, 0);
    const pct = totalTasks ? Math.round((completedTasksCount / totalTasks) * 100) : 0;
    if (pct >= 75) return "You're on fire! Over 75% of your tasks are done. Keep it up!";
    if (pct >= 50) return 'Halfway there! Great progress across your projects.';
    if (completedTasksCount > 0) return `Nice work! You've completed ${completedTasksCount} task${completedTasksCount !== 1 ? 's' : ''} so far.`;
    return null;
  }, [projects, completedTasksCount, config.showEncouragement]);

  return (
    <motion.div {...pageTransition} className="mx-auto max-w-7xl px-4 py-8 sm:px-6">

      {/* Header */}
      <div className="mb-8 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Good to see you, {firstName}!</h1>
          <div className="mt-1.5 flex items-center gap-3">
            <p className="text-sm text-[var(--text-secondary)]">Here's an overview of your roadmaps</p>
            <McpStatusBadge />
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          {config.alwaysShowInvite && (
            <Button variant="secondary" size="sm" onClick={() => navigate(ROUTES.PROJECT_DETAIL)}>
              <UserPlus size={15} /> Invite
            </Button>
          )}
          <Button onClick={() => navigate(ROUTES.NEW_PROJECT_CHAT)}>
            <Plus size={15} /> New Project
          </Button>
        </div>
      </div>

      {/* Student encouragement banner */}
      {encouragementMsg && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--accent-subtle)] px-4 py-3"
        >
          <p className="text-sm font-medium text-[var(--accent)]">🎉 {encouragementMsg}</p>
        </motion.div>
      )}

      {/* Usage banner */}
      {showUsageBanner && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3">
          <p className="text-sm text-[var(--text-secondary)]">
            <span className="font-medium text-[var(--text-primary)]">{settings.usage.used}</span> of{' '}
            <span className="font-medium text-[var(--text-primary)]">{settings.usage.limit}</span> free generations used this month
          </p>
          <button
            onClick={() => navigate(ROUTES.SETTINGS + '?section=api-key')}
            className="text-xs font-medium text-[var(--accent)] hover:underline"
          >
            Add your key →
          </button>
        </div>
      )}

      {/* Stats */}
      <motion.div
        variants={stagger.container}
        initial="initial"
        animate="animate"
        className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        {STAT_CONFIG.map(({ key, label, icon }, i) => (
          <StatCard key={key} label={label} value={statValues[key]} icon={icon} index={i} />
        ))}
      </motion.div>

      {/* Role-specific widgets below stats */}
      {config.showTeamWidget && !loading && projects?.length > 0 && (
        <div className="mb-6">
          <TeamOverviewWidget projects={projects} />
        </div>
      )}
      {config.showLearningPath && !loading && (
        <div className="mb-6">
          <LearningPathBar projects={projects || []} />
        </div>
      )}

      {/* Tech filter chips (Developer) */}
      {config.showTechFilter && allTechs.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTech(null)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              activeTech === null
                ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]'
            }`}
          >
            All
          </button>
          {allTechs.map(tech => (
            <button
              key={tech}
              onClick={() => setActiveTech(activeTech === tech ? null : tech)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                activeTech === tech
                  ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]'
              }`}
            >
              {tech}
            </button>
          ))}
        </div>
      )}

      {/* Projects */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Your Roadmaps</h2>
          {filteredProjects.length > 0 && (
            <span className="text-sm text-[var(--text-muted)]">
              {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => <ProjectSkeleton key={i} />)}
          </div>
        ) : !filteredProjects.length ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] py-20 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--bg-elevated)]">
              <FolderOpen size={24} className="text-[var(--text-muted)]" />
            </div>
            <h3 className="mb-2 font-semibold text-[var(--text-primary)]">
              {activeTech ? `No projects with ${activeTech}` : 'No projects yet'}
            </h3>
            <p className="mb-6 max-w-xs text-sm text-[var(--text-secondary)]">
              {activeTech
                ? 'Try selecting a different tech or clear the filter.'
                : 'Create your first roadmap and start turning your ideas into actionable plans.'}
            </p>
            {!activeTech && (
              <Button onClick={() => navigate(ROUTES.NEW_PROJECT_CHAT)}>
                <Plus size={15} /> Create your first roadmap
              </Button>
            )}
          </div>
        ) : (
          <motion.div
            variants={stagger.container}
            initial="initial"
            animate="animate"
            className="grid gap-4 sm:grid-cols-2"
          >
            {filteredProjects.map((project, i) => (
              <motion.div key={project.id} variants={stagger.item} transition={{ duration: 0.3, delay: i * 0.06 }}>
                <ProjectCardItem project={project} showEstimatedHours={config.showEstimatedHours} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
