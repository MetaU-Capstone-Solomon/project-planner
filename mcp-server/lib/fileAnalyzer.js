// mcp-server/lib/fileAnalyzer.js
//
// Structural file analyzer — extracts function names, class names, and imports
// from source files instead of returning raw content.
//
// Inspired by the AST-based approach in tirth8205/code-review-graph (MIT License).
// Copyright (c) 2026 Tirth Kanani — https://github.com/tirth8205/code-review-graph
//
// This implementation uses regex-based extraction for zero additional dependencies.

const ANALYZERS = {
  // JavaScript / TypeScript
  js: analyzeJS,
  jsx: analyzeJS,
  ts: analyzeJS,
  tsx: analyzeJS,
  mjs: analyzeJS,
  cjs: analyzeJS,

  // Python
  py: analyzePython,

  // Go
  go: analyzeGo,

  // Rust
  rs: analyzeRust,
};

export function getExtension(filePath) {
  const parts = filePath.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : null;
}

export function canAnalyze(filePath) {
  return !!ANALYZERS[getExtension(filePath)];
}

/**
 * Analyze a source file and return its structural summary.
 * Returns null if the file type is not supported.
 *
 * @param {string} filePath - relative path (used for display)
 * @param {string} content  - file content
 * @returns {{ path, language, functions, classes, imports, exports } | null}
 */
export function analyzeFile(filePath, content) {
  const ext = getExtension(filePath);
  const analyzer = ANALYZERS[ext];
  if (!analyzer) return null;

  try {
    const result = analyzer(content);
    return { path: filePath, ...result };
  } catch {
    return null;
  }
}

// ─── JavaScript / TypeScript ──────────────────────────────────────────────────

function analyzeJS(content) {
  const functions = new Set();
  const classes = new Set();
  const imports = new Set();
  const exports = new Set();

  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    // imports: import X from 'y' / import { X } from 'y' / import 'y'
    const imp = trimmed.match(/^import\s+(?:.+?\s+from\s+)?['"]([^'"]+)['"]/);
    if (imp) { imports.add(imp[1]); continue; }

    // require: const x = require('y')
    const req = trimmed.match(/require\(['"]([^'"]+)['"]\)/);
    if (req) { imports.add(req[1]); }

    // export default function name / export function name / export async function name
    const expFn = trimmed.match(/^export\s+(?:default\s+)?(?:async\s+)?function\s+(\w+)/);
    if (expFn) { functions.add(expFn[1]); exports.add(expFn[1]); continue; }

    // export default class / export class
    const expClass = trimmed.match(/^export\s+(?:default\s+)?class\s+(\w+)/);
    if (expClass) { classes.add(expClass[1]); exports.add(expClass[1]); continue; }

    // export const/let/var name = ...
    const expConst = trimmed.match(/^export\s+(?:const|let|var)\s+(\w+)/);
    if (expConst) { exports.add(expConst[1]); }

    // export { name, name2 }
    const expNamed = trimmed.match(/^export\s+\{([^}]+)\}/);
    if (expNamed) {
      expNamed[1].split(',').forEach(e => exports.add(e.trim().split(/\s+as\s+/)[0].trim()));
    }

    // function declaration (not export)
    const fn = trimmed.match(/^(?:async\s+)?function\s+(\w+)/);
    if (fn) { functions.add(fn[1]); continue; }

    // arrow function assigned to const/let/var
    const arrow = trimmed.match(/^(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(/);
    if (arrow) { functions.add(arrow[1]); continue; }

    // class declaration
    const cls = trimmed.match(/^class\s+(\w+)/);
    if (cls) { classes.add(cls[1]); continue; }

    // class method shorthand: methodName(...) { or async methodName(...) {
    const method = trimmed.match(/^(?:async\s+)?(\w+)\s*\([^)]*\)\s*\{/);
    if (method && !['if', 'for', 'while', 'switch', 'catch'].includes(method[1])) {
      functions.add(method[1]);
    }
  }

  return {
    language: 'javascript',
    functions: [...functions],
    classes: [...classes],
    imports: [...imports],
    exports: [...exports],
  };
}

// ─── Python ───────────────────────────────────────────────────────────────────

function analyzePython(content) {
  const functions = new Set();
  const classes = new Set();
  const imports = new Set();

  for (const line of content.split('\n')) {
    const trimmed = line.trim();

    // import x / import x as y
    const imp = trimmed.match(/^import\s+(\S+)/);
    if (imp) { imports.add(imp[1].split('.')[0]); continue; }

    // from x import y
    const frm = trimmed.match(/^from\s+(\S+)\s+import/);
    if (frm) { imports.add(frm[1]); continue; }

    // def name(
    const fn = trimmed.match(/^(?:async\s+)?def\s+(\w+)\s*\(/);
    if (fn) { functions.add(fn[1]); continue; }

    // class name
    const cls = trimmed.match(/^class\s+(\w+)/);
    if (cls) { classes.add(cls[1]); }
  }

  return {
    language: 'python',
    functions: [...functions],
    classes: [...classes],
    imports: [...imports],
    exports: [],
  };
}

// ─── Go ───────────────────────────────────────────────────────────────────────

function analyzeGo(content) {
  const functions = new Set();
  const imports = new Set();

  for (const line of content.split('\n')) {
    const trimmed = line.trim();

    // import "pkg" or "pkg/sub"
    const imp = trimmed.match(/^"([^"]+)"/);
    if (imp) { imports.add(imp[1].split('/').pop()); continue; }

    // func Name( or func (receiver) Name(
    const fn = trimmed.match(/^func\s+(?:\([^)]+\)\s+)?(\w+)\s*\(/);
    if (fn && fn[1] !== 'init') { functions.add(fn[1]); }
  }

  return {
    language: 'go',
    functions: [...functions],
    classes: [],
    imports: [...imports],
    exports: [],
  };
}

// ─── Rust ─────────────────────────────────────────────────────────────────────

function analyzeRust(content) {
  const functions = new Set();
  const imports = new Set();
  const structs = new Set();

  for (const line of content.split('\n')) {
    const trimmed = line.trim();

    // use crate::module or use std::x
    const use_ = trimmed.match(/^use\s+([\w:]+)/);
    if (use_) { imports.add(use_[1].split('::')[0]); continue; }

    // pub fn name( / fn name(
    const fn_ = trimmed.match(/^(?:pub\s+)?(?:async\s+)?fn\s+(\w+)\s*[<(]/);
    if (fn_) { functions.add(fn_[1]); continue; }

    // pub struct Name / struct Name
    const struct_ = trimmed.match(/^(?:pub\s+)?struct\s+(\w+)/);
    if (struct_) { structs.add(struct_[1]); }
  }

  return {
    language: 'rust',
    functions: [...functions],
    classes: [...structs],
    imports: [...imports],
    exports: [],
  };
}
