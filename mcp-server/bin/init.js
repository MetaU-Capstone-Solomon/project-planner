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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_PATH = path.resolve(__dirname, '..', 'index.js');

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

function buildEntry(mode, supabaseUrl, supabaseKey, mcpToken) {
  const entry = {
    command: 'node',
    args: [SERVER_PATH],
  };
  if (mode === 'cloud') {
    entry.env = {
      SUPABASE_URL: supabaseUrl,
      SUPABASE_SERVICE_ROLE_KEY: supabaseKey,
      MCP_TOKEN: mcpToken,
    };
  }
  return entry;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

print();
print(bold('  ProPlan MCP — Setup'));
print(dim('  Configures .mcp.json so Claude Code can find the server'));
print();

// 1. Mode
print(cyan('  Storage mode'));
print('  1. Local  — SQLite file in your project (.project-planner/db.sqlite)');
print('  2. Cloud  — Supabase + MCP token (required for web dashboard sync)');
print();
const modeChoice = (await ask('  Your choice [1/2, default 1]: ')).trim() || '1';
const mode = modeChoice === '2' ? 'cloud' : 'local';
print();

let supabaseUrl = '', supabaseKey = '', mcpToken = '';
if (mode === 'cloud') {
  print(cyan('  Cloud credentials'));
  supabaseUrl = (await ask('  SUPABASE_URL: ')).trim();
  supabaseKey = (await ask('  SUPABASE_SERVICE_ROLE_KEY: ')).trim();
  mcpToken    = (await ask('  MCP_TOKEN: ')).trim();
  if (!supabaseUrl || !supabaseKey || !mcpToken) {
    print();
    print('  ' + YELLOW + '⚠  Missing credentials — switching to local mode.' + RESET);
    mode === 'cloud' && (supabaseUrl = supabaseKey = mcpToken = '');
  }
  print();
}

// 2. Location
print(cyan('  Where to write .mcp.json'));
const projectLocal = path.join(process.cwd(), '.mcp.json');
const userLevel    = path.join(os.homedir(), '.mcp.json');
print(`  1. Project-local  ${dim(projectLocal)}`);
print(`  2. User-level     ${dim(userLevel)}  ${dim('(applies to all your projects)')}`);
print();
const locChoice = (await ask('  Your choice [1/2, default 1]: ')).trim() || '1';
const mcpPath = locChoice === '2' ? userLevel : projectLocal;
print();

// 3. Write
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

existing.mcpServers['project-planner'] = buildEntry(mode, supabaseUrl, supabaseKey, mcpToken);
writeMcpJson(mcpPath, existing);

// 4. Success
print(green('  ✓ .mcp.json written') + '  ' + dim(mcpPath));
print();
print(bold('  Next steps'));
print(`  1. Restart Claude Code (or reload the MCP server)`);
print(`  2. Open a project directory and start a new session`);
print(`  3. Claude will call get_project_status automatically on session start`);
print();

if (mode === 'local') {
  print(dim('  Local mode: data stored in .project-planner/db.sqlite (auto-created on first use)'));
} else {
  print(dim('  Cloud mode: data synced to Supabase, visible in the ProPlan web dashboard'));
}
print();

// 5. allowedTools tip
print(bold('  Tip — skip approval prompts for read-only tools'));
print(dim('  Add this to ~/.claude/settings.json:'));
print();
print(dim('  {'));
print(dim('    "allowedTools": ['));
print(dim('      "mcp__project-planner__get_project_status",'));
print(dim('      "mcp__project-planner__get_next_tasks",'));
print(dim('      "mcp__project-planner__get_project_roadmap",'));
print(dim('      "mcp__project-planner__get_tasks",'));
print(dim('      "mcp__project-planner__add_session_summary",'));
print(dim('      "mcp__project-planner__update_task_status",'));
print(dim('      "mcp__project-planner__add_note_to_task"'));
print(dim('    ]'));
print(dim('  }'));
print();

rl.close();
