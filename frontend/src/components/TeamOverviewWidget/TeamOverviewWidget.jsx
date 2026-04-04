import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { getProjectCollaborators } from '@/services/projectService';
import { AvatarGroup } from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';

function ProjectTeamRow({ project }) {
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProjectCollaborators(project.id).then(result => {
      if (result.success) setCollaborators(result.collaborators);
      setLoading(false);
    });
  }, [project.id]);

  const avatarUsers = collaborators.map(c => ({
    id: c.user_id,
    name: c.full_name || c.email,
    avatar: c.avatar_url,
  }));

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-4 py-3">
      <p className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--text-primary)]">{project.title}</p>
      <div className="flex items-center gap-2 flex-shrink-0">
        {loading ? (
          <Skeleton className="h-7 w-20 rounded-full" />
        ) : collaborators.length > 0 ? (
          <>
            <AvatarGroup users={avatarUsers} max={4} />
            <Badge variant="secondary">{collaborators.length}</Badge>
          </>
        ) : (
          <span className="text-xs text-[var(--text-muted)]">Solo</span>
        )}
      </div>
    </div>
  );
}

export default function TeamOverviewWidget({ projects = [] }) {
  if (!projects.length) return null;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-subtle)]">
          <Users size={16} style={{ color: 'var(--accent)' }} />
        </div>
        <p className="text-sm font-semibold text-[var(--text-primary)]">Team Overview</p>
      </div>
      <div className="space-y-2">
        {projects.slice(0, 5).map(project => (
          <ProjectTeamRow key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}
