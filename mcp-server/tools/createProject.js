// mcp-server/tools/createProject.js

export async function createProject(adapter, args) {
  if (!args.phases || args.phases.length === 0) {
    throw new Error('Project must have at least one phase');
  }

  const now = new Date().toISOString();

  let idCounter = 0;
  let phaseOrder = 0;
  let milestoneCount = 0;
  let taskCount = 0;

  const phases = args.phases.map(phaseInput => {
    phaseOrder += 1;
    let milestoneOrder = 0;

    const milestones = (phaseInput.milestones || []).map(msInput => {
      milestoneOrder += 1;
      milestoneCount += 1;
      let taskOrder = 0;

      const tasks = (msInput.tasks || []).map(taskInput => {
        taskOrder += 1;
        taskCount += 1;
        return {
          id: `task-${Date.now()}-${++idCounter}`,
          title: taskInput.title,
          status: 'pending',
          order: taskOrder,
          ...(taskInput.description && { description: taskInput.description }),
          ...(taskInput.technology && { technology: taskInput.technology }),
        };
      });

      return {
        id: `milestone-${Date.now()}-${++idCounter}`,
        title: msInput.title,
        order: milestoneOrder,
        tasks,
      };
    });

    return {
      id: `phase-${Date.now()}-${++idCounter}`,
      title: phaseInput.title,
      order: phaseOrder,
      milestones,
    };
  });

  const roadmap = {
    projectName: args.title,
    metadata: {
      ...(args.description && { description: args.description }),
      ...(args.timeline && { timeline: args.timeline }),
      ...(args.experienceLevel && { experienceLevel: args.experienceLevel }),
      ...(args.technologies && { technologies: args.technologies }),
    },
    phases,
  };

  const { id } = await adapter.insertProject(args.title, JSON.stringify(roadmap));

  return {
    projectId: id,
    title: args.title,
    phaseCount: phases.length,
    milestoneCount,
    taskCount,
  };
}
