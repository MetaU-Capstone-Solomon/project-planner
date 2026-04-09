const { extractMcpUserId } = require('../middleware/mcpAuth');

// Mock the supabase client module
jest.mock('@supabase/supabase-js', () => {
  const mockSingle = jest.fn();
  const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
  const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
  const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });
  return {
    createClient: jest.fn().mockReturnValue({ from: mockFrom }),
    _mockSingle: mockSingle,
    _mockEq: mockEq,
  };
});

const { createClient, _mockSingle } = require('@supabase/supabase-js');

describe('extractMcpUserId', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  test('returns 401 when no authorization header', async () => {
    await extractMcpUserId(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'MCP token required' });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when authorization header is not Bearer', async () => {
    req.headers.authorization = 'Basic sometoken';
    await extractMcpUserId(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'MCP token required' });
  });

  test('returns 401 for invalid token', async () => {
    req.headers.authorization = 'Bearer mcp_bad_token';
    _mockSingle.mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'not found' } });
    await extractMcpUserId(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid MCP token' });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 500 when Supabase has a connection error', async () => {
    req.headers.authorization = 'Bearer mcp_any_token';
    _mockSingle.mockResolvedValue({ data: null, error: { code: 'PGSQL_ERROR', message: 'connection timeout' } });
    await extractMcpUserId(req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Service error' });
    expect(next).not.toHaveBeenCalled();
  });

  test('sets req.userId and calls next for valid token', async () => {
    req.headers.authorization = 'Bearer mcp_valid_token';
    _mockSingle.mockResolvedValue({ data: { user_id: 'user-123' }, error: null });
    await extractMcpUserId(req, res, next);
    expect(req.userId).toBe('user-123');
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
