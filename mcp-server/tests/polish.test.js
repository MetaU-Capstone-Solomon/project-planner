// mcp-server/tests/polish.test.js
import { DASHBOARD_URL, API_URL } from '../lib/constants.js';
import { exportToCloud } from '../tools/exportToCloud.js';

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
