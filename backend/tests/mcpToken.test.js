// Tests the token generation format — pure function extracted from the route
const crypto = require('crypto');

function generateMcpToken() {
  return 'mcp_' + crypto.randomBytes(32).toString('hex');
}

describe('MCP token generation', () => {
  test('token starts with mcp_ prefix', () => {
    expect(generateMcpToken()).toMatch(/^mcp_/);
  });

  test('token is 68 characters (4 prefix + 64 hex)', () => {
    expect(generateMcpToken()).toHaveLength(68);
  });

  test('each call produces a unique token', () => {
    expect(generateMcpToken()).not.toBe(generateMcpToken());
  });
});
