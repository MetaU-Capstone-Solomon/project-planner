// Phase 8 Part 2 tests
// - scanRepo structural analysis via fileAnalyzer
// - get_tasks filter tool (status, phase_id, keyword)

import { describe, it, expect } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { SqliteAdapter } from '../adapters/SqliteAdapter.js';
import { createProject } from '../tools/createProject.js';
import { updateTaskStatus } from '../tools/updateTaskStatus.js';
import { getTasks } from '../tools/getTasks.js';
import { scanRepo } from '../tools/scanRepo.js';
import { analyzeFile, canAnalyze, getExtension } from '../lib/fileAnalyzer.js';

// ─── fileAnalyzer unit tests ──────────────────────────────────────────────────

describe('fileAnalyzer — getExtension', () => {
  it('returns lowercase extension', () => {
    expect(getExtension('foo.JS')).toBe('js');
    expect(getExtension('bar.tsx')).toBe('tsx');
  });

  it('returns null for no extension', () => {
    expect(getExtension('Makefile')).toBeNull();
  });
});

describe('fileAnalyzer — canAnalyze', () => {
  it('supports JS/TS variants', () => {
    for (const ext of ['js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs']) {
      expect(canAnalyze(`file.${ext}`)).toBe(true);
    }
  });

  it('supports Python, Go, Rust', () => {
    expect(canAnalyze('main.py')).toBe(true);
    expect(canAnalyze('main.go')).toBe(true);
    expect(canAnalyze('lib.rs')).toBe(true);
  });

  it('returns false for unsupported types', () => {
    expect(canAnalyze('style.css')).toBe(false);
    expect(canAnalyze('data.json')).toBe(false);
    expect(canAnalyze('README.md')).toBe(false);
  });
});

describe('fileAnalyzer — analyzeFile JS', () => {
  const jsSource = `
import { foo } from './foo.js';
import bar from 'bar';
const baz = require('baz');

export function greet(name) { return name; }
export class Greeter {}
export const helper = (x) => x;
function internal() {}
class Local {}
`;

  it('extracts functions', () => {
    const result = analyzeFile('index.js', jsSource);
    expect(result.functions).toContain('greet');
    expect(result.functions).toContain('internal');
    // 'helper' is an exported const arrow — tracked in exports, not functions (can't distinguish from objects)
  });

  it('extracts classes', () => {
    const result = analyzeFile('index.js', jsSource);
    expect(result.classes).toContain('Greeter');
    expect(result.classes).toContain('Local');
  });

  it('extracts imports', () => {
    const result = analyzeFile('index.js', jsSource);
    expect(result.imports).toContain('./foo.js');
    expect(result.imports).toContain('bar');
    expect(result.imports).toContain('baz');
  });

  it('extracts exports', () => {
    const result = analyzeFile('index.js', jsSource);
    expect(result.exports).toContain('greet');
    expect(result.exports).toContain('Greeter');
    expect(result.exports).toContain('helper');
  });

  it('sets language to javascript', () => {
    expect(analyzeFile('index.ts', jsSource).language).toBe('javascript');
  });

  it('includes path', () => {
    expect(analyzeFile('src/index.js', jsSource).path).toBe('src/index.js');
  });
});

describe('fileAnalyzer — analyzeFile Python', () => {
  const pySource = `
import os
import sys
from pathlib import Path
from typing import List

def main():
    pass

async def fetch(url):
    pass

class MyClass:
    pass
`;

  it('extracts functions', () => {
    const r = analyzeFile('app.py', pySource);
    expect(r.functions).toContain('main');
    expect(r.functions).toContain('fetch');
  });

  it('extracts classes', () => {
    expect(analyzeFile('app.py', pySource).classes).toContain('MyClass');
  });

  it('extracts imports', () => {
    const r = analyzeFile('app.py', pySource);
    expect(r.imports).toContain('os');
    expect(r.imports).toContain('sys');
    expect(r.imports).toContain('pathlib');
    expect(r.imports).toContain('typing');
  });

  it('sets language to python', () => {
    expect(analyzeFile('app.py', pySource).language).toBe('python');
  });
});

describe('fileAnalyzer — analyzeFile Go', () => {
  const goSource = `
package main

import (
  "fmt"
  "net/http"
)

func main() {}
func Handler(w http.ResponseWriter, r *http.Request) {}
func (s *Server) Start() {}
`;

  it('extracts functions', () => {
    const r = analyzeFile('main.go', goSource);
    expect(r.functions).toContain('main');
    expect(r.functions).toContain('Handler');
    expect(r.functions).toContain('Start');
  });

  it('extracts imports', () => {
    const r = analyzeFile('main.go', goSource);
    expect(r.imports).toContain('fmt');
    expect(r.imports).toContain('http');
  });

  it('sets language to go', () => {
    expect(analyzeFile('main.go', goSource).language).toBe('go');
  });
});

describe('fileAnalyzer — analyzeFile Rust', () => {
  const rsSource = `
use std::collections::HashMap;
use serde::Serialize;

pub struct Config { pub name: String }
struct Internal {}

pub fn run() {}
async fn helper() {}
pub async fn start() {}
`;

  it('extracts functions', () => {
    const r = analyzeFile('lib.rs', rsSource);
    expect(r.functions).toContain('run');
    expect(r.functions).toContain('helper');
    expect(r.functions).toContain('start');
  });

  it('extracts structs as classes', () => {
    const r = analyzeFile('lib.rs', rsSource);
    expect(r.classes).toContain('Config');
    expect(r.classes).toContain('Internal');
  });

  it('extracts imports', () => {
    const r = analyzeFile('lib.rs', rsSource);
    expect(r.imports).toContain('std');
    expect(r.imports).toContain('serde');
  });

  it('sets language to rust', () => {
    expect(analyzeFile('lib.rs', rsSource).language).toBe('rust');
  });
});

describe('fileAnalyzer — returns null for unsupported', () => {
  it('returns null for .css', () => {
    expect(analyzeFile('style.css', 'body {}')).toBeNull();
  });

  it('returns null for unknown extension', () => {
    expect(analyzeFile('Makefile', 'all:')).toBeNull();
  });
});

// ─── scanRepo structural analysis ────────────────────────────────────────────

describe('scanRepo — sourceAnalysis', () => {
  it('includes sourceAnalysis for a directory with JS files', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scan-test-'));
    try {
      fs.writeFileSync(path.join(tmpDir, 'app.js'), 'export function hello() {}\n');
      fs.writeFileSync(path.join(tmpDir, 'util.ts'), 'export const x = () => {};\n');
      fs.writeFileSync(path.join(tmpDir, 'README.md'), '# Hello\n');

      const result = scanRepo({ path: tmpDir });
      expect(result.sourceAnalysis).toBeDefined();
      expect(result.sourceAnalysis.length).toBeGreaterThanOrEqual(2);

      const paths = result.sourceAnalysis.map(f => f.path);
      expect(paths.some(p => p.endsWith('app.js'))).toBe(true);
      expect(paths.some(p => p.endsWith('util.ts'))).toBe(true);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('does not include markdown in sourceAnalysis', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scan-test-'));
    try {
      fs.writeFileSync(path.join(tmpDir, 'README.md'), '# Hello\n');
      fs.writeFileSync(path.join(tmpDir, 'app.js'), 'function foo() {}\n');

      const result = scanRepo({ path: tmpDir });
      if (result.sourceAnalysis) {
        const paths = result.sourceAnalysis.map(f => f.path);
        expect(paths.every(p => !p.endsWith('.md'))).toBe(true);
      }
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('each analysis entry has expected shape', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scan-test-'));
    try {
      fs.writeFileSync(path.join(tmpDir, 'mod.js'), 'export function greet() {}\n');

      const result = scanRepo({ path: tmpDir });
      const entry = result.sourceAnalysis?.[0];
      expect(entry).toBeDefined();
      expect(entry).toHaveProperty('path');
      expect(entry).toHaveProperty('language');
      expect(entry).toHaveProperty('functions');
      expect(entry).toHaveProperty('classes');
      expect(entry).toHaveProperty('imports');
      expect(entry).toHaveProperty('exports');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('omits sourceAnalysis when no analyzable files exist', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scan-test-'));
    try {
      fs.writeFileSync(path.join(tmpDir, 'README.md'), '# Only markdown\n');

      const result = scanRepo({ path: tmpDir });
      expect(result.sourceAnalysis).toBeUndefined();
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

// ─── getTasks filter tool ─────────────────────────────────────────────────────

describe('getTasks', () => {
  let tmpDir, adapter, projectId, phaseId, milestoneId, taskIds;

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-gettasks-'));
    adapter = new SqliteAdapter(path.join(tmpDir, 'db.sqlite'));

    const result = await createProject(adapter, {
      title: 'Filter Test',
      phases: [
        {
          title: 'Phase One',
          milestones: [{
            title: 'M1',
            tasks: [
              { title: 'Setup React', description: 'Init the project', technology: 'React' },
              { title: 'Write tests', description: 'Unit tests', technology: 'Jest' },
              { title: 'Deploy app', description: 'Deploy to Vercel', technology: 'Vercel' },
            ],
          }],
        },
        {
          title: 'Phase Two',
          milestones: [{
            title: 'M2',
            tasks: [
              { title: 'Add auth', description: 'OAuth setup', technology: 'Auth0' },
            ],
          }],
        },
      ],
    });

    projectId = result.projectId;
    const project = adapter.getProject(projectId);
    const roadmap = JSON.parse(project.content);
    phaseId = roadmap.phases[0].id;
    milestoneId = roadmap.phases[0].milestones[0].id;
    taskIds = roadmap.phases[0].milestones[0].tasks.map(t => t.id);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns all tasks when no filters applied', async () => {
    const result = await getTasks(adapter, { project_id: projectId });
    expect(result.total).toBe(4);
    expect(result.tasks).toHaveLength(4);
  });

  it('filters by status=pending (default)', async () => {
    const result = await getTasks(adapter, { project_id: projectId, status: 'pending' });
    expect(result.total).toBe(4);
    expect(result.tasks.every(t => t.status === 'pending')).toBe(true);
  });

  it('filters by status=in_progress', async () => {
    await updateTaskStatus(adapter, { project_id: projectId, task_id: taskIds[0], status: 'in_progress' });
    const result = await getTasks(adapter, { project_id: projectId, status: 'in_progress' });
    expect(result.total).toBe(1);
    expect(result.tasks[0].taskId).toBe(taskIds[0]);
  });

  it('filters by status=completed', async () => {
    await updateTaskStatus(adapter, { project_id: projectId, task_id: taskIds[1], status: 'completed' });
    const result = await getTasks(adapter, { project_id: projectId, status: 'completed' });
    expect(result.total).toBe(1);
    expect(result.tasks[0].title).toBe('Write tests');
  });

  it('filters by phase_id', async () => {
    const result = await getTasks(adapter, { project_id: projectId, phase_id: phaseId });
    expect(result.total).toBe(3);
    expect(result.tasks.every(t => t.phaseId === phaseId)).toBe(true);
  });

  it('filters by keyword in title', async () => {
    const result = await getTasks(adapter, { project_id: projectId, keyword: 'auth' });
    expect(result.total).toBe(1);
    expect(result.tasks[0].title).toBe('Add auth');
  });

  it('filters by keyword in description', async () => {
    const result = await getTasks(adapter, { project_id: projectId, keyword: 'Vercel' });
    expect(result.total).toBe(1);
    expect(result.tasks[0].title).toBe('Deploy app');
  });

  it('filters by keyword in technology', async () => {
    const result = await getTasks(adapter, { project_id: projectId, keyword: 'jest' });
    expect(result.total).toBe(1);
    expect(result.tasks[0].title).toBe('Write tests');
  });

  it('keyword search is case-insensitive', async () => {
    const r1 = await getTasks(adapter, { project_id: projectId, keyword: 'REACT' });
    const r2 = await getTasks(adapter, { project_id: projectId, keyword: 'react' });
    expect(r1.total).toBe(r2.total);
    expect(r1.total).toBeGreaterThan(0);
  });

  it('combines status + phase_id filters', async () => {
    await updateTaskStatus(adapter, { project_id: projectId, task_id: taskIds[0], status: 'completed' });
    const result = await getTasks(adapter, {
      project_id: projectId,
      status: 'completed',
      phase_id: phaseId,
    });
    expect(result.total).toBe(1);
    expect(result.tasks[0].phaseTitle).toBe('Phase One');
  });

  it('returns empty when no matches', async () => {
    const result = await getTasks(adapter, { project_id: projectId, keyword: 'nonexistent_xyz' });
    expect(result.total).toBe(0);
    expect(result.tasks).toHaveLength(0);
  });

  it('result includes expected task shape', async () => {
    const result = await getTasks(adapter, { project_id: projectId, keyword: 'React' });
    const task = result.tasks[0];
    expect(task).toHaveProperty('taskId');
    expect(task).toHaveProperty('title');
    expect(task).toHaveProperty('description');
    expect(task).toHaveProperty('status');
    expect(task).toHaveProperty('technology');
    expect(task).toHaveProperty('phaseId');
    expect(task).toHaveProperty('phaseTitle');
    expect(task).toHaveProperty('milestoneId');
    expect(task).toHaveProperty('milestoneTitle');
    expect(task).toHaveProperty('notes');
  });

  it('throws for missing project_id', async () => {
    await expect(getTasks(adapter, {})).rejects.toThrow('project_id is required');
  });

  it('throws for unknown project', async () => {
    await expect(getTasks(adapter, { project_id: 'does-not-exist' })).rejects.toThrow();
  });
});
