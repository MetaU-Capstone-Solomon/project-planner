// mcp-server/adapters/BackendApiAdapter.js
import { randomUUID } from 'crypto';

export class BackendApiAdapter {
  constructor(token, apiUrl) {
    this._token = token;
    this._apiUrl = apiUrl;
  }

  getUserId() {
    return 'cloud';
  }

  _headers() {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this._token}`,
    };
  }

  async _request(method, path, body) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30_000);

    try {
      const res = await fetch(`${this._apiUrl}${path}`, {
        method,
        headers: this._headers(),
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (!res.ok) {
        if (res.status === 404) return null;
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(err.error || `Request failed: ${res.status}`);
      }

      return res.json();
    } finally {
      clearTimeout(timer);
    }
  }

  async _requestWithRetry(method, path, body) {
    try {
      return await this._request(method, path, body);
    } catch (err) {
      // Retry once after 2s on network-level errors (not 4xx/5xx)
      if (err.message === 'fetch failed' || (err.message.includes('network') && err.name !== 'AbortError')) {
        await new Promise(r => setTimeout(r, 2000));
        return this._request(method, path, body);
      }
      throw err;
    }
  }

  async listProjects() {
    return (await this._requestWithRetry('GET', '/api/mcp/projects')) ?? [];
  }

  async getProject(projectId) {
    return this._requestWithRetry('GET', `/api/mcp/projects/${projectId}`);
  }

  async saveProject(projectId, title, content, _updatedAt) {
    await this._requestWithRetry('PUT', `/api/mcp/projects/${projectId}`, { title, content });
  }

  async insertProject(title, content) {
    const id = randomUUID();
    const result = await this._requestWithRetry('POST', '/api/mcp/projects', { id, title, content });
    // Use the id we sent so local and cloud UUIDs stay in sync
    return { id: result?.id ?? id };
  }

  async deleteProject(projectId) {
    await this._requestWithRetry('DELETE', `/api/mcp/projects/${projectId}`);
  }

  async renameProject(projectId, newTitle, _updatedAt) {
    await this._requestWithRetry('PUT', `/api/mcp/projects/${projectId}`, { title: newTitle });
  }

  // These are local-only operations — no-ops in cloud mode
  getProjectsSyncStatus() { return []; }
  markSynced(_projectId, _syncedAt) {}
}
