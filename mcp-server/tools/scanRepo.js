// mcp-server/tools/scanRepo.js
import { readdirSync, statSync, readFileSync, existsSync } from 'fs';
import { join, relative, extname, basename } from 'path';

const EXCLUDED_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', 'coverage',
  '__pycache__', '.cache', '.turbo', 'out', '.vercel',
]);

const KEY_FILE_NAMES = ['package.json', 'README.md', 'readme.md', 'README.txt'];

function buildTree(dir, rootDir, lines = [], depth = 0) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return lines;
  }

  for (const entry of entries) {
    if (EXCLUDED_DIRS.has(entry.name)) continue;
    if (entry.name.startsWith('.') && entry.name !== '.env.example') continue;

    const indent = '  '.repeat(depth);
    lines.push(`${indent}${entry.isDirectory() ? entry.name + '/' : entry.name}`);

    if (entry.isDirectory()) {
      buildTree(join(dir, entry.name), rootDir, lines, depth + 1);
    }
  }
  return lines;
}

function findMarkdownFiles(dir, found = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return found;
  }

  for (const entry of entries) {
    if (EXCLUDED_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;
    if (entry.isDirectory()) {
      findMarkdownFiles(join(dir, entry.name), found);
    } else if (extname(entry.name).toLowerCase() === '.md') {
      found.push(join(dir, entry.name));
    }
  }
  return found;
}

function readFileSafe(filePath) {
  try {
    return readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

export function scanRepo(args) {
  const scanPath = args?.path || process.cwd();

  // If a specific file path is provided (not a directory), read just that file
  let isSingleFile = false;
  try {
    const stat = statSync(scanPath);
    isSingleFile = stat.isFile();
  } catch {
    // path doesn't exist — fall through to treat as directory
  }

  if (isSingleFile) {
    const content = readFileSafe(scanPath);
    return {
      tree: basename(scanPath),
      keyFiles: content ? [{ path: basename(scanPath), content }] : [],
    };
  }

  // Full directory scan
  const treeLines = buildTree(scanPath, scanPath);
  const tree = treeLines.join('\n');

  const keyFiles = [];
  const seen = new Set();

  // Always include root-level key files first
  for (const name of KEY_FILE_NAMES) {
    const filePath = join(scanPath, name);
    if (existsSync(filePath)) {
      const rel = relative(scanPath, filePath);
      if (!seen.has(rel)) {
        const content = readFileSafe(filePath);
        if (content) { keyFiles.push({ path: rel, content }); seen.add(rel); }
      }
    }
  }

  // All markdown files recursively (plan docs, specs, READMEs in subdirs)
  const mdFiles = findMarkdownFiles(scanPath);
  for (const filePath of mdFiles) {
    const rel = relative(scanPath, filePath);
    if (!seen.has(rel)) {
      const content = readFileSafe(filePath);
      if (content) { keyFiles.push({ path: rel, content }); seen.add(rel); }
    }
  }

  // Size guard: truncate file contents if total payload exceeds 200KB
  const SIZE_LIMIT = 200 * 1024;
  let totalSize = Buffer.byteLength(tree, 'utf8');
  let truncated = false;
  const guardedFiles = [];

  for (const file of keyFiles) {
    const fileSize = Buffer.byteLength(file.content, 'utf8');
    if (totalSize + fileSize > SIZE_LIMIT) {
      truncated = true;
      break;
    }
    guardedFiles.push(file);
    totalSize += fileSize;
  }

  const result = { tree, keyFiles: guardedFiles };
  if (truncated) result.truncated = true;
  return result;
}
