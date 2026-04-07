// mcp-server/adapters/SqliteAdapter.js
import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
import { randomUUID } from 'crypto';

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'local',
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`;

export class SqliteAdapter {
  constructor(dbPath) {
    mkdirSync(dirname(dbPath), { recursive: true });
    this._db = new Database(dbPath);
    this._db.exec(SCHEMA);
  }

  getUserId() {
    return 'local';
  }

  listProjects() {
    return this._db.prepare('SELECT id, title, content FROM projects').all();
  }

  getProject(projectId) {
    return this._db
      .prepare('SELECT id, title, content FROM projects WHERE id = ?')
      .get(projectId) ?? null;
  }

  saveProject(projectId, title, content, updatedAt) {
    this._db
      .prepare('UPDATE projects SET title = ?, content = ?, updated_at = ? WHERE id = ?')
      .run(title, content, updatedAt, projectId);
  }

  insertProject(title, content) {
    const id = randomUUID();
    const now = new Date().toISOString();
    this._db
      .prepare('INSERT INTO projects (id, user_id, title, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, 'local', title, content, now, now);
    return { id };
  }

  deleteProject(projectId) {
    this._db.prepare('DELETE FROM projects WHERE id = ?').run(projectId);
  }

  renameProject(projectId, newTitle, updatedAt) {
    this._db
      .prepare('UPDATE projects SET title = ?, updated_at = ? WHERE id = ?')
      .run(newTitle, updatedAt, projectId);
  }
}
