import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FolderOpen, CheckCircle, ListTodo, Users, Plus, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettings } from '@/hooks/useUserSettings';
import useDashboardData from '@/hooks/useDashboardData';
import { ROUTES, getProjectDetailPath } from '@/constants/routes';
import { stagger, pageTransition } from '@/constants/motion';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import ProgressRing from '@/components/ui/ProgressRing';

const STAT_CONFIG = [
  { key: 'total',      label: 'Total Projects', icon: FolderOpen  },
  { key: 'completed',  label: 'Completed',       icon: CheckCircle },
  { key: 'tasks',      label: 'Tasks Done',       icon: ListTodo   },
  { key: 'members',    label: 'Team Members',     icon: Users      },
];

function StatCard({ label, value, icon: Icon, index }) {
  return (
    <motion.div
      variants={stagger.item}
      transition={{ duration: 0.3, delay: index * 0.06 }}
    >
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

function ProjectCardItem({ project }) {
  const navigate = useNavigate();
  let progress = 0;
  try {
    const data = typeof project.content === 'string' ? JSON.parse(project.content) : project.content;
    if (data?.phases) {
      const tasks = data.phases.flatMap(p => p.milestones?.flatMap(m => m.tasks || []) || []);
      if (tasks.length) progress = Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100);
    }
  } catch {}

  return (
    <Card onClick={() => navigate(getProjectDetailPath(project.id))} className="p-5">
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

export default function Dashboard() {
  const { user } = useAuth();
  const { projects, loading, stats } = useDashboardData();
  const { data: settings } = useUserSettings();
  const navigate = useNavigate();

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'there';
  const showUsageBanner = settings && !settings.apiProvider && settings.usage?.used > 0;

  const statValues = {
    total:     projects?.length ?? 0,
    completed: stats?.completed ?? 0,
    tasks:     stats?.completedTasks ?? 0,
    members:   stats?.teamMembers ?? 0,
  };

  return (
    <motion.div {...pageTransition} className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Good to see you, {firstName}!</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Here's an overview of your roadmaps</p>
        </div>
        <Button onClick={() => navigate(ROUTES.NEW_PROJECT_CHAT)}>
          <Plus size={15} /> New Project
        </Button>
      </div>

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
        className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        {STAT_CONFIG.map(({ key, label, icon }, i) => (
          <StatCard key={key} label={label} value={statValues[key]} icon={icon} index={i} />
        ))}
      </motion.div>

      {/* Projects */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Your Roadmaps</h2>
          {projects?.length > 0 && (
            <span className="text-sm text-[var(--text-muted)]">{projects.length} project{projects.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => <ProjectSkeleton key={i} />)}
          </div>
        ) : !projects?.length ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] py-20 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--bg-elevated)]">
              <FolderOpen size={24} className="text-[var(--text-muted)]" />
            </div>
            <h3 className="mb-2 font-semibold text-[var(--text-primary)]">No projects yet</h3>
            <p className="mb-6 max-w-xs text-sm text-[var(--text-secondary)]">Create your first roadmap and start turning your ideas into actionable plans.</p>
            <Button onClick={() => navigate(ROUTES.NEW_PROJECT_CHAT)}>
              <Plus size={15} /> Create your first roadmap
            </Button>
          </div>
        ) : (
          <motion.div
            variants={stagger.container}
            initial="initial"
            animate="animate"
            className="grid gap-4 sm:grid-cols-2"
          >
            {projects.map((project, i) => (
              <motion.div key={project.id} variants={stagger.item} transition={{ duration: 0.3, delay: i * 0.06 }}>
                <ProjectCardItem project={project} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
