// mcp-server/tools/getProjectStatus.js

function countTasks(phases) {
  let total = 0, completed = 0, inProgress = 0;
  for (const phase of phases) {
    for (const milestone of (phase.milestones || [])) {
      for (const task of (milestone.tasks || [])) {
        total++;
        if (task.status === 'completed') completed++;
        else if (task.status === 'in_progress') inProgress++;
      }
    }
  }
  return { total, completed, inProgress };
}

function buildHandoff(data, roadmap, limit = 5) {
  const allTasks = [];
  for (const phase of (roadmap.phases || [])) {
    for (const milestone of (phase.milestones || [])) {
      for (const task of (milestone.tasks || [])) {
        const notes = Array.isArray(task.notes) ? task.notes : [];
        const lastNote = notes.length > 0 ? notes[notes.length - 1] : null;
        allTasks.push({
          id: task.id,
          title: task.title,
          status: task.status || 'pending',
          phase: phase.title,
          milestone: milestone.title,
          lastNote: lastNote ? { text: lastNote.text, createdAt: lastNote.createdAt } : null,
          _lastNoteTime: lastNote ? new Date(lastNote.createdAt).getTime() : 0,
        });
      }
    }
  }

  allTasks.sort((a, b) => {
    if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
    if (b.status === 'in_progress' && a.status !== 'in_progress') return 1;
    return b._lastNoteTime - a._lastNoteTime;
  });

  const sessions = Array.isArray(roadmap.sessions) ? roadmap.sessions : [];
  return {
    projectGoal: roadmap.projectGoal || null,
    lastSession: sessions.length > 0 ? sessions[sessions.length - 1] : null,
    recentTasks: allTasks.slice(0, limit).map(({ _lastNoteTime, ...t }) => t),
  };
}

export async function getProjectStatus(adapter, args) {
  if (args.project_id) {
    const data = await adapter.getProject(args.project_id);
    if (!data) throw new Error(`Project ${args.project_id} not found`);

    let roadmap;
    try { roadmap = JSON.parse(data.content); }
    catch { throw new Error(`Project ${data.id} has corrupted roadmap data`); }

    const { total, completed, inProgress } = countTasks(roadmap.phases || []);
    const currentPhase = (roadmap.phases || []).find(p =>
      (p.milestones || []).some(m => (m.tasks || []).some(t => t.status !== 'completed'))
    );

    const status = {
      id: data.id,
      title: data.title,
      totalPhases: (roadmap.phases || []).length,
      totalTasks: total,
      completedTasks: completed,
      inProgressTasks: inProgress,
      completionPercent: total === 0 ? 0 : Math.round((completed / total) * 100),
      currentPhase: currentPhase?.title ?? null,
      tech_metadata: roadmap.tech_metadata ?? null,
    };

    if (args.include_handoff) {
      const handoff = buildHandoff(data, roadmap, args.last_n_tasks ?? 5);
      status.projectGoal = handoff.projectGoal;
      status.lastSession = handoff.lastSession;
      status.recentTasks = handoff.recentTasks;
    }

    return status;
  }

  const rows = await adapter.listProjects();
  return rows.map(row => {
    let roadmap;
    try { roadmap = JSON.parse(row.content); }
    catch { return { id: row.id, title: row.title, totalTasks: 0, completedTasks: 0, completionPercent: 0, error: 'corrupted roadmap data' }; }
    const { total, completed } = countTasks(roadmap.phases || []);
    return {
      id: row.id,
      title: row.title,
      totalTasks: total,
      completedTasks: completed,
      completionPercent: total === 0 ? 0 : Math.round((completed / total) * 100),
      tech_metadata: roadmap.tech_metadata ?? null,
    };
  });
}
