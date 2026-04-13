#!/usr/bin/env node
// mcp-server/bin/init.js
//
// ProPlan MCP init — writes .mcp.json for Claude Code (and compatible editors)
// so developers don't have to hand-edit JSON.
//
// Usage:  node bin/init.js
// No dependencies beyond Node built-ins.

// ─── Node version guard ───────────────────────────────────────────────────────
const [major] = process.versions.node.split('.').map(Number);
if (major < 18) {
  process.stderr.write(
    `\n  ProPlan init requires Node.js 18 or later.\n` +
    `  You are running Node ${process.versions.node}.\n` +
    `  Please upgrade: https://nodejs.org\n\n`
  );
  process.exit(1);
}

import readline from 'readline';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { DASHBOARD_URL } from '../lib/constants.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const RESET  = '\x1b[0m';
const BOLD   = '\x1b[1m';
const GREEN  = '\x1b[32m';
const CYAN   = '\x1b[36m';
const YELLOW = '\x1b[33m';
const DIM    = '\x1b[2m';

function print(msg = '') { process.stdout.write(msg + '\n'); }
function bold(s)  { return BOLD + s + RESET; }
function green(s) { return GREEN + s + RESET; }
function cyan(s)  { return CYAN + s + RESET; }
function dim(s)   { return DIM + s + RESET; }

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(resolve => rl.question(q, resolve));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readMcpJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return { mcpServers: {} };
  }
}

function writeMcpJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function buildEntry() {
  return {
    command: 'npx',
    args: ['-y', '@proplandev/mcp'],
  };
}

function addToGitignore(projectDir, entries) {
  const gitignorePath = path.join(projectDir, '.gitignore');
  let content = '';
  try { content = fs.readFileSync(gitignorePath, 'utf8'); } catch { /* new file */ }
  const lines = content.split('\n');
  const toAdd = entries.filter(e => !lines.some(l => l.trim() === e));
  if (toAdd.length === 0) return false;
  const addition = (content.endsWith('\n') || content === '' ? '' : '\n') +
    '# ProPlan MCP\n' + toAdd.join('\n') + '\n';
  fs.writeFileSync(gitignorePath, content + addition, 'utf8');
  return true;
}

const CLAUDE_MD_BLOCK = `
## ProPlan MCP — Session Instructions

At the start of every session:
1. Call \`get_project_status\` — no args first to list all projects
2. If a project exists: call it again with \`include_handoff: true\` and resume — say "I see we were working on X..."
3. If no projects exist:
   a. Ask: "Do you have an existing project in the ProPlan dashboard to import, or should I scan this repo and build a fresh plan?"
   b. Import: call \`import_from_cloud\` with their token to list cloud projects, let them pick one
   c. Fresh: call \`scan_repo\`, then propose a project structure and call \`create_project\`
4. Never ask the user to re-explain context
5. At session end: always call \`add_session_summary\` — this auto-syncs to the dashboard if a token is cached
`;

function writeClaudeMd(projectDir) {
  const claudeMdPath = path.join(projectDir, 'CLAUDE.md');
  const marker = 'ProPlan MCP — Session Instructions';
  try {
    const existing = fs.readFileSync(claudeMdPath, 'utf8');
    if (existing.includes(marker)) return 'already';
    fs.writeFileSync(claudeMdPath, existing.trimEnd() + '\n' + CLAUDE_MD_BLOCK, 'utf8');
    return 'appended';
  } catch {
    fs.writeFileSync(claudeMdPath, CLAUDE_MD_BLOCK.trimStart(), 'utf8');
    return 'created';
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

print();
print(bold('  ProPlan MCP — Setup'));
print(dim('  Configures .mcp.json so Claude Code can find the server'));
print();

// 1. Location
print(cyan('  Where to write .mcp.json'));
const projectLocal = path.join(process.cwd(), '.mcp.json');
const userLevel    = path.join(os.homedir(), '.mcp.json');
print(`  1. Project-local  ${dim(projectLocal)}`);
print(`  2. User-level     ${dim(userLevel)}  ${dim('(applies to all your projects)')}`);
print();
const locChoice = (await ask('  Your choice [1/2, default 1]: ')).trim() || '1';
const mcpPath = locChoice === '2' ? userLevel : projectLocal;
const isProjectLocal = locChoice !== '2';
print();

// 2. Write .mcp.json
const existing = readMcpJson(mcpPath);
existing.mcpServers = existing.mcpServers || {};

const alreadyHas = existing.mcpServers['project-planner'];
if (alreadyHas) {
  const overwrite = (await ask(`  ${YELLOW}project-planner entry already exists. Overwrite? [y/N]: ${RESET}`)).trim().toLowerCase();
  if (overwrite !== 'y') {
    print();
    print('  Aborted — existing entry preserved.');
    rl.close();
    process.exit(0);
  }
  print();
}

existing.mcpServers['project-planner'] = buildEntry();
writeMcpJson(mcpPath, existing);
print(green('  ✓ .mcp.json written') + '  ' + dim(mcpPath));

// 4. CLAUDE.md — write or append session instructions
const claudeResult = writeClaudeMd(process.cwd());
if (claudeResult === 'created') {
  print(green('  ✓ CLAUDE.md created') + '  ' + dim(path.join(process.cwd(), 'CLAUDE.md')));
} else if (claudeResult === 'appended') {
  print(green('  ✓ CLAUDE.md updated') + '  ' + dim('ProPlan session instructions appended'));
} else {
  print(dim('  ✓ CLAUDE.md already has ProPlan instructions — skipped'));
}

// 5. .gitignore — add relevant entries
const gitignoreEntries = ['.project-planner/'];
const gitignoreUpdated = addToGitignore(process.cwd(), gitignoreEntries);
if (gitignoreUpdated) {
  print(green('  ✓ .gitignore updated') + '  ' + dim(gitignoreEntries.join(', ') + ' added'));
}

print();
print(bold('  Next steps'));
print(`  1. Restart Claude Code (or reload the MCP server)`);
print(`  2. Open your project directory in Claude Code`);
print(`  3. Type ${bold('start')} or ${bold('continue')} — Claude will scan your project and get to work`);
print();

print(dim('  Data stored locally in .project-planner/db.sqlite (gitignored).'));
print(dim(`  To sync with the dashboard, run export_to_cloud from Claude Code.`));
print(dim(`  Get a free token at ${DASHBOARD_URL} → Settings → Claude Code Integration.`));
print();

// 6. allowedTools — offer to auto-write
const ALLOWED_TOOLS = [
  'mcp__project-planner__get_project_status',
  'mcp__project-planner__get_next_tasks',
  'mcp__project-planner__get_project_roadmap',
  'mcp__project-planner__get_tasks',
  'mcp__project-planner__add_session_summary',
  'mcp__project-planner__update_task_status',
  'mcp__project-planner__add_note_to_task',
  'mcp__project-planner__create_project',
  'mcp__project-planner__scan_repo',
  'mcp__project-planner__set_project_goal',
  'mcp__project-planner__add_phase',
  'mcp__project-planner__add_milestone',
  'mcp__project-planner__add_task',
  'mcp__project-planner__edit_phase',
  'mcp__project-planner__edit_milestone',
  'mcp__project-planner__edit_task',
  'mcp__project-planner__delete_phase',
  'mcp__project-planner__delete_milestone',
  'mcp__project-planner__delete_task',
  'mcp__project-planner__delete_project',
  'mcp__project-planner__rename_project',
  'mcp__project-planner__export_to_cloud',
  'mcp__project-planner__import_from_cloud',
];

const claudeSettingsPath = path.join(os.homedir(), '.claude', 'settings.json');
print(bold('  Tip — skip approval prompts for all ProPlan tools'));
const autoWrite = (await ask('  Add these to your Claude settings automatically? [Y/n]: ')).trim().toLowerCase();
print();

if (autoWrite !== 'n') {
  try {
    let settings = {};
    try { settings = JSON.parse(fs.readFileSync(claudeSettingsPath, 'utf8')); } catch { /* new file */ }
    const existingTools = Array.isArray(settings.allowedTools) ? settings.allowedTools : [];
    const merged = [...new Set([...existingTools, ...ALLOWED_TOOLS])];
    settings.allowedTools = merged;
    fs.mkdirSync(path.dirname(claudeSettingsPath), { recursive: true });
    fs.writeFileSync(claudeSettingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf8');
    print(green('  ✓ Claude settings updated') + '  ' + dim(claudeSettingsPath));
  } catch (err) {
    print('  ' + YELLOW + '⚠  Could not write settings: ' + err.message + RESET);
    print(dim('  Add manually to ~/.claude/settings.json:'));
    print(dim('  "allowedTools": ' + JSON.stringify(ALLOWED_TOOLS, null, 4).replace(/\n/g, '\n  ')));
  }
} else {
  print(dim('  To add manually, paste into ~/.claude/settings.json:'));
  print(dim('  "allowedTools": ' + JSON.stringify(ALLOWED_TOOLS, null, 4).replace(/\n/g, '\n  ')));
}
print();

rl.close();
