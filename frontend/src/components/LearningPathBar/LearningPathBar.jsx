import { motion } from 'framer-motion';
import { GraduationCap } from 'lucide-react';

export default function LearningPathBar({ projects = [] }) {
  const allTasks = projects.flatMap(p => {
    try {
      const data = typeof p.content === 'string' ? JSON.parse(p.content) : p.content;
      return data?.phases?.flatMap(ph => ph.milestones?.flatMap(m => m.tasks || []) || []) || [];
    } catch {
      return [];
    }
  });

  const total = allTasks.length;
  const completed = allTasks.filter(t => t.status === 'completed').length;
  const pct = total ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-subtle)]">
          <GraduationCap size={16} style={{ color: 'var(--accent)' }} />
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">Learning Path</p>
          <p className="text-xs text-[var(--text-muted)]">{completed} of {total} tasks complete</p>
        </div>
        <span className="ml-auto text-lg font-bold text-[var(--accent)]">{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-elevated)]">
        <motion.div
          className="h-full rounded-full bg-[var(--accent)]"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 200, damping: 25, delay: 0.2 }}
        />
      </div>
    </div>
  );
}
