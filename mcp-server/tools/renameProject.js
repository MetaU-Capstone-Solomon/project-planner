// mcp-server/tools/renameProject.js

export async function renameProject(adapter, args) {
  if (!args.new_title || !args.new_title.trim()) {
    throw new Error('new_title is required and cannot be empty');
  }

  const data = await adapter.getProject(args.project_id);
  if (!data) throw new Error(`Project ${args.project_id} not found`);

  const oldTitle = data.title;
  const newTitle = args.new_title.trim();

  await adapter.renameProject(args.project_id, newTitle, new Date().toISOString());

  return { old_title: oldTitle, new_title: newTitle };
}
