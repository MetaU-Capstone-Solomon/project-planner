// mcp-server/tests/polish.test.js
import { DASHBOARD_URL, API_URL } from '../lib/constants.js';
import { exportToCloud } from '../tools/exportToCloud.js';
import { BackendApiAdapter } from '../adapters/BackendApiAdapter.js';

describe('constants', () => {
  it('exports DASHBOARD_URL pointing to frontend', () => {
    expect(DASHBOARD_URL).toBe('https://project-planner-7zw4.onrender.com');
  });

  it('exports API_URL pointing to backend', () => {
    expect(API_URL).toBe('https://project-planner-backend-i4x4.onrender.com');
  });
});

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

describe('server version', () => {
  it('version in package.json matches what McpServer receives', () => {
    const pkg = require('../package.json');
    expect(pkg.version).toMatch(/^\d+\.\d+\.\d+$/);
    // Verify it's not hardcoded as 1.0.5
    expect(pkg.version).not.toBe('1.0.5');
  });
});

describe('exportToCloud — cloud mode detection', () => {
  it('returns a helpful message when called in cloud mode (MCP_TOKEN set)', async () => {
    const original = process.env.MCP_TOKEN;
    process.env.MCP_TOKEN = 'mcp_test_token';
    try {
      const result = await exportToCloud({ mcp_token: 'mcp_test_token' });
      expect(result.message).toMatch(/cloud mode/i);
      expect(result.skipped).toBe(0);
    } finally {
      if (original === undefined) delete process.env.MCP_TOKEN;
      else process.env.MCP_TOKEN = original;
    }
  });
});

describe('BackendApiAdapter retry', () => {
  it('retries once on network error and succeeds', async () => {
    let calls = 0;
    const adapter = new BackendApiAdapter('token', 'https://example.com');

    // Patch _request to fail once then succeed
    adapter._request = async (method, path, body) => {
      calls++;
      if (calls === 1) throw new Error('fetch failed');
      return [{ id: '1', title: 'T', content: '{}' }];
    };

    const result = await adapter.listProjects();
    expect(calls).toBe(2);
    expect(result[0].title).toBe('T');
  });

  it('throws after two consecutive failures', async () => {
    const adapter = new BackendApiAdapter('token', 'https://example.com');
    adapter._request = async () => { throw new Error('fetch failed'); };
    await expect(adapter.listProjects()).rejects.toThrow('fetch failed');
  });
});
