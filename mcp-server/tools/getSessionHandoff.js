// mcp-server/tools/getSessionHandoff.js

export async function getSessionHandoff(adapter, args) {
  const data = await adapter.getProject(args.project_id);
  if (!data) throw new Error(`Project ${args.project_id} not found`);

  const limit = args.last_n_tasks ?? 5;

  let roadmap;
  try {
    roadmap = JSON.parse(data.content);
  } catch {
    throw new Error(`Project ${data.id} has corrupted roadmap data`);
  }

  // Flatten all tasks with their phase/milestone context
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

  // Sort: in_progress first, then by most recent note descending
  allTasks.sort((a, b) => {
    if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
    if (b.status === 'in_progress' && a.status !== 'in_progress') return 1;
    return b._lastNoteTime - a._lastNoteTime;
  });

  const recentTasks = allTasks.slice(0, limit).map(({ _lastNoteTime, ...task }) => task);

  // Summarise overall progress
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = allTasks.filter(t => t.status === 'in_progress').length;

  // Last session summary (most recent only)
  const sessions = Array.isArray(roadmap.sessions) ? roadmap.sessions : [];
  const lastSession = sessions.length > 0 ? sessions[sessions.length - 1] : null;

  return {
    projectGoal: roadmap.projectGoal || null,
    project: {
      id: data.id,
      title: data.title,
      totalTasks,
      completedTasks,
      inProgressTasks,
      completionPercent: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    },
    lastSession,
    recentTasks,
  };
}
