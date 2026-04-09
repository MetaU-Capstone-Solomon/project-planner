import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { BackendApiAdapter } from '../adapters/BackendApiAdapter.js';

const API_URL = 'https://api.example.com';
const TOKEN = 'test-token-abc';

let adapter;
let fetchMock;

function makeFetchMock(status, body) {
  return jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(body),
  });
}

beforeEach(() => {
  adapter = new BackendApiAdapter(TOKEN, API_URL);
});

afterEach(() => {
  // Restore global fetch after each test
  if (global.fetch && global.fetch.mockRestore) {
    global.fetch.mockRestore();
  }
});

describe('BackendApiAdapter', () => {
  describe('getUserId', () => {
    it('returns "cloud"', () => {
      expect(adapter.getUserId()).toBe('cloud');
    });
  });

  describe('listProjects', () => {
    it('calls GET /api/mcp/projects with correct auth header and returns array', async () => {
      const projects = [{ id: '1', title: 'Project A', content: '{}' }];
      global.fetch = makeFetchMock(200, projects);

      const result = await adapter.listProjects();

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toBe(`${API_URL}/api/mcp/projects`);
      expect(options.method).toBe('GET');
      expect(options.headers['Authorization']).toBe(`Bearer ${TOKEN}`);
      expect(options.headers['Content-Type']).toBe('application/json');
      expect(result).toEqual(projects);
    });

    it('returns empty array when response is null', async () => {
      global.fetch = makeFetchMock(200, null);

      const result = await adapter.listProjects();

      expect(result).toEqual([]);
    });
  });

  describe('getProject', () => {
    it('calls GET /api/mcp/projects/:id with correct auth header and returns project', async () => {
      const project = { id: 'proj-123', title: 'Test', content: '{"phases":[]}' };
      global.fetch = makeFetchMock(200, project);

      const result = await adapter.getProject('proj-123');

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toBe(`${API_URL}/api/mcp/projects/proj-123`);
      expect(options.method).toBe('GET');
      expect(options.headers['Authorization']).toBe(`Bearer ${TOKEN}`);
      expect(result).toEqual(project);
    });

    it('returns null on 404', async () => {
      global.fetch = makeFetchMock(404, { error: 'Not found' });

      const result = await adapter.getProject('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('insertProject', () => {
    it('calls POST /api/mcp/projects with id/title/content and returns { id }', async () => {
      const serverResponse = { id: 'server-uuid', title: 'New Project', content: '{}' };
      global.fetch = makeFetchMock(201, serverResponse);

      const result = await adapter.insertProject('New Project', '{}');

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toBe(`${API_URL}/api/mcp/projects`);
      expect(options.method).toBe('POST');
      const sentBody = JSON.parse(options.body);
      expect(typeof sentBody.id).toBe('string');
      expect(sentBody.title).toBe('New Project');
      expect(sentBody.content).toBe('{}');
      expect(result).toEqual({ id: serverResponse.id });
    });

    it('falls back to local uuid if server response has no id', async () => {
      global.fetch = makeFetchMock(201, {});

      const result = await adapter.insertProject('My Project', '{}');

      expect(typeof result.id).toBe('string');
      expect(result.id.length).toBeGreaterThan(0);
    });
  });

  describe('saveProject', () => {
    it('calls PUT /api/mcp/projects/:id with title and content', async () => {
      global.fetch = makeFetchMock(200, {});

      await adapter.saveProject('proj-456', 'Updated Title', '{"phases":[]}', '2026-04-08T00:00:00Z');

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toBe(`${API_URL}/api/mcp/projects/proj-456`);
      expect(options.method).toBe('PUT');
      const sentBody = JSON.parse(options.body);
      expect(sentBody.title).toBe('Updated Title');
      expect(sentBody.content).toBe('{"phases":[]}');
    });
  });

  describe('deleteProject', () => {
    it('calls DELETE /api/mcp/projects/:id', async () => {
      global.fetch = makeFetchMock(200, {});

      await adapter.deleteProject('proj-789');

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toBe(`${API_URL}/api/mcp/projects/proj-789`);
      expect(options.method).toBe('DELETE');
      expect(options.headers['Authorization']).toBe(`Bearer ${TOKEN}`);
    });
  });

  describe('renameProject', () => {
    it('calls PUT /api/mcp/projects/:id with new title', async () => {
      global.fetch = makeFetchMock(200, {});

      await adapter.renameProject('proj-111', 'New Name', '2026-04-08T00:00:00Z');

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toBe(`${API_URL}/api/mcp/projects/proj-111`);
      expect(options.method).toBe('PUT');
      const sentBody = JSON.parse(options.body);
      expect(sentBody.title).toBe('New Name');
    });
  });

  describe('_request error handling', () => {
    it('throws on non-404 error responses with server error message', async () => {
      global.fetch = makeFetchMock(500, { error: 'Internal server error' });

      await expect(adapter.getProject('any')).rejects.toThrow('Internal server error');
    });

    it('throws with fallback message when error body cannot be parsed', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: jest.fn().mockRejectedValue(new Error('not json')),
      });

      await expect(adapter.listProjects()).rejects.toThrow('HTTP 503');
    });
  });

  describe('local-only no-ops', () => {
    it('getProjectsSyncStatus returns empty array', () => {
      expect(adapter.getProjectsSyncStatus()).toEqual([]);
    });

    it('markSynced does not throw', () => {
      expect(() => adapter.markSynced('proj-id', '2026-04-08T00:00:00Z')).not.toThrow();
    });
  });
});
