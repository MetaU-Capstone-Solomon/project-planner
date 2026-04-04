// mcp-server/tools/getProjectStatus.js

function countTasks(phases) {
  let total = 0, completed = 0;
  for (const phase of phases) {
    for (const milestone of (phase.milestones || [])) {
      for (const task of (milestone.tasks || [])) {
        total++;
        if (task.status === 'completed') completed++;
      }
    }
  }
  return { total, completed };
}

/**
 * @param {object} supabase
 * @param {string} userId
 * @param {{ project_id?: string }} args
 */
export async function getProjectStatus(supabase, userId, args) {
  if (args.project_id) {
    const { data, error } = await supabase
      .from('roadmap')
      .select('id, title, content')
      .eq('user_id', userId)
      .eq('id', args.project_id)
      .single();
    if (error || !data) throw new Error(`Project ${args.project_id} not found`);

    const roadmap = JSON.parse(data.content);
    const { total, completed } = countTasks(roadmap.phases || []);
    const currentPhase = (roadmap.phases || []).find(p =>
      (p.milestones || []).some(m => (m.tasks || []).some(t => t.status !== 'completed'))
    );

    return {
      id: data.id,
      title: data.title,
      totalPhases: (roadmap.phases || []).length,
      totalTasks: total,
      completedTasks: completed,
      completionPercent: total === 0 ? 0 : Math.round((completed / total) * 100),
      currentPhase: currentPhase?.title ?? null,
    };
  }

  // All projects
  const { data, error } = await supabase
    .from('roadmap')
    .select('id, title, content')
    .eq('user_id', userId);
  if (error) throw new Error(`Failed to fetch projects: ${error.message}`);

  return (data || []).map(row => {
    const roadmap = JSON.parse(row.content);
    const { total, completed } = countTasks(roadmap.phases || []);
    return {
      id: row.id,
      title: row.title,
      totalTasks: total,
      completedTasks: completed,
      completionPercent: total === 0 ? 0 : Math.round((completed / total) * 100),
    };
  });
}
