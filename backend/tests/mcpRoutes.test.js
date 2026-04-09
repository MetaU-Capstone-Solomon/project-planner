/**
 * Tests for backend/routes/mcp.js
 *
 * Strategy:
 *  - Mock @supabase/supabase-js — all chain calls return the same chain object
 *    so calls can be strung together. The terminal call for each route is
 *    configured per-test with mockResolvedValueOnce / mockResolvedValue.
 *  - Mock ../middleware/mcpAuth so extractMcpUserId just sets req.userId.
 *  - Use supertest to drive the Express router end-to-end.
 */

const request = require('supertest');
const express = require('express');

// ---------------------------------------------------------------------------
// 1. Mock mcpAuth BEFORE requiring the router
// ---------------------------------------------------------------------------
jest.mock('../middleware/mcpAuth', () => ({
  extractMcpUserId: (req, _res, next) => {
    req.userId = 'test-user';
    next();
  },
}));

// ---------------------------------------------------------------------------
// 2. Mock @supabase/supabase-js
//
// All mock fns are defined inside the factory and exposed via the module's
// exported object so tests can call mockResolvedValue on them.
//
// Chain shapes per route:
//   GET /projects        : from → select → eq(resolved)
//   GET /projects/:id    : from → select → eq → eq → single(resolved)
//   POST /projects       : from → insert → select → single(resolved)
//   PUT /projects/:id    : from → update → eq → eq(resolved)
//   DELETE /projects/:id : from → delete → eq → eq(resolved)
//   POST /sync           : from → upsert(resolved)
// ---------------------------------------------------------------------------
jest.mock('@supabase/supabase-js', () => {
  const mockSingle = jest.fn();
  const mockEq     = jest.fn();
  const mockSelect = jest.fn();
  const mockInsert = jest.fn();
  const mockUpdate = jest.fn();
  const mockDelete = jest.fn();
  const mockUpsert = jest.fn();
  const mockFrom   = jest.fn();

  const chain = {
    select: mockSelect,
    eq:     mockEq,
    single: mockSingle,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    upsert: mockUpsert,
  };

  // Default: every chain call returns chain (keeps chaining alive).
  // Individual tests override the terminal call with mockResolvedValue(Once).
  mockFrom.mockReturnValue(chain);
  mockSelect.mockReturnValue(chain);
  mockEq.mockReturnValue(chain);
  mockSingle.mockReturnValue(chain);
  mockInsert.mockReturnValue(chain);
  mockUpdate.mockReturnValue(chain);
  mockDelete.mockReturnValue(chain);
  mockUpsert.mockReturnValue(chain);

  return {
    createClient: jest.fn(() => ({ from: mockFrom })),
    // Expose mocks so tests can drive them
    _chain:       chain,
    _mockSingle:  mockSingle,
    _mockEq:      mockEq,
    _mockSelect:  mockSelect,
    _mockInsert:  mockInsert,
    _mockUpdate:  mockUpdate,
    _mockDelete:  mockDelete,
    _mockUpsert:  mockUpsert,
    _mockFrom:    mockFrom,
  };
});

// Pull exposed mocks for use in tests.
const {
  _chain,
  _mockSingle,
  _mockEq,
  _mockSelect,
  _mockInsert,
  _mockUpdate,
  _mockDelete,
  _mockUpsert,
  _mockFrom,
} = require('@supabase/supabase-js');

// ---------------------------------------------------------------------------
// 3. Build the test app
// ---------------------------------------------------------------------------
const mcpRouter = require('../routes/mcp');

const app = express();
app.use(express.json());
app.use('/api/mcp', mcpRouter);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function resetChain() {
  _mockFrom.mockReturnValue(_chain);
  _mockSelect.mockReturnValue(_chain);
  _mockEq.mockReturnValue(_chain);
  _mockSingle.mockReturnValue(_chain);
  _mockInsert.mockReturnValue(_chain);
  _mockUpdate.mockReturnValue(_chain);
  _mockDelete.mockReturnValue(_chain);
  _mockUpsert.mockReturnValue(_chain);
}

beforeEach(() => {
  jest.clearAllMocks();
  resetChain();
});

// ---------------------------------------------------------------------------
// GET /api/mcp/projects
// Terminal: .eq()  (route calls .select(…).eq('user_id', …))
// ---------------------------------------------------------------------------
describe('GET /api/mcp/projects', () => {
  test('returns array of projects on success', async () => {
    const projects = [
      { id: 'p1', title: 'Alpha', content: '{}', created_at: 'now', updated_at: 'now' },
    ];
    _mockEq.mockResolvedValue({ data: projects, error: null });

    const res = await request(app).get('/api/mcp/projects');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(projects);
  });

  test('returns empty array when no projects exist', async () => {
    _mockEq.mockResolvedValue({ data: null, error: null });

    const res = await request(app).get('/api/mcp/projects');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('returns 500 on supabase error', async () => {
    _mockEq.mockResolvedValue({ data: null, error: { message: 'DB down' } });

    const res = await request(app).get('/api/mcp/projects');

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error', 'DB down');
  });
});

// ---------------------------------------------------------------------------
// GET /api/mcp/projects/:id
// Terminal: .single()
// Chain: from → select → eq → eq → single
// ---------------------------------------------------------------------------
describe('GET /api/mcp/projects/:id', () => {
  test('returns a single project on success', async () => {
    const project = { id: 'p1', title: 'Alpha', content: '{}', created_at: 'now', updated_at: 'now' };
    _mockSingle.mockResolvedValue({ data: project, error: null });

    const res = await request(app).get('/api/mcp/projects/p1');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(project);
  });

  test('returns 404 when project not found (PGRST116)', async () => {
    _mockSingle.mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'not found' } });

    const res = await request(app).get('/api/mcp/projects/missing-id');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Project not found' });
  });

  test('returns 500 on unexpected supabase error', async () => {
    _mockSingle.mockResolvedValue({ data: null, error: { code: 'OTHER', message: 'unexpected error' } });

    const res = await request(app).get('/api/mcp/projects/p1');

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error', 'unexpected error');
  });
});

// ---------------------------------------------------------------------------
// POST /api/mcp/projects
// Terminal: .single()
// Chain: from → insert → select → single
// ---------------------------------------------------------------------------
describe('POST /api/mcp/projects', () => {
  test('creates a project and returns { id }', async () => {
    _mockSingle.mockResolvedValue({ data: { id: 'new-id' }, error: null });

    const res = await request(app)
      .post('/api/mcp/projects')
      .send({ title: 'My Project', content: '{"phases":[]}' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: 'new-id' });
  });

  test('accepts a caller-supplied id', async () => {
    _mockSingle.mockResolvedValue({ data: { id: 'supplied-id' }, error: null });

    const res = await request(app)
      .post('/api/mcp/projects')
      .send({ id: 'supplied-id', title: 'My Project', content: '{}' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: 'supplied-id' });
    expect(_mockInsert).toHaveBeenCalledWith(expect.objectContaining({ id: 'supplied-id' }));
  });

  test('returns 400 when title is missing', async () => {
    const res = await request(app)
      .post('/api/mcp/projects')
      .send({ content: '{}' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'title and content are required' });
  });

  test('returns 400 when content is missing', async () => {
    const res = await request(app)
      .post('/api/mcp/projects')
      .send({ title: 'My Project' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'title and content are required' });
  });

  test('returns 500 on supabase error', async () => {
    _mockSingle.mockResolvedValue({ data: null, error: { message: 'insert failed' } });

    const res = await request(app)
      .post('/api/mcp/projects')
      .send({ title: 'X', content: '{}' });

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error', 'insert failed');
  });
});

// ---------------------------------------------------------------------------
// PUT /api/mcp/projects/:id
// Terminal: second .eq()
// Chain: from → update → eq('user_id') → eq('id')
//
// mockReturnValueOnce lets the first .eq() keep chaining; the second is terminal.
// ---------------------------------------------------------------------------
describe('PUT /api/mcp/projects/:id', () => {
  test('updates a project and returns { success: true }', async () => {
    _mockEq
      .mockReturnValueOnce(_chain)
      .mockResolvedValueOnce({ error: null });

    const res = await request(app)
      .put('/api/mcp/projects/p1')
      .send({ title: 'New Title' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
  });

  test('returns 400 when neither title nor content is provided', async () => {
    const res = await request(app)
      .put('/api/mcp/projects/p1')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Nothing to update' });
  });

  test('returns 500 on supabase error', async () => {
    _mockEq
      .mockReturnValueOnce(_chain)
      .mockResolvedValueOnce({ error: { message: 'update failed' } });

    const res = await request(app)
      .put('/api/mcp/projects/p1')
      .send({ title: 'New Title' });

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error', 'update failed');
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/mcp/projects/:id
// Terminal: second .eq()
// Chain: from → delete → eq('user_id') → eq('id')
// ---------------------------------------------------------------------------
describe('DELETE /api/mcp/projects/:id', () => {
  test('deletes a project and returns { success: true }', async () => {
    _mockEq
      .mockReturnValueOnce(_chain)
      .mockResolvedValueOnce({ error: null });

    const res = await request(app).delete('/api/mcp/projects/p1');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
  });

  test('returns 500 on supabase error', async () => {
    _mockEq
      .mockReturnValueOnce(_chain)
      .mockResolvedValueOnce({ error: { message: 'delete failed' } });

    const res = await request(app).delete('/api/mcp/projects/p1');

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error', 'delete failed');
  });
});

// ---------------------------------------------------------------------------
// POST /api/mcp/sync
// Terminal: .upsert()
// Chain: from → upsert
// ---------------------------------------------------------------------------
describe('POST /api/mcp/sync', () => {
  test('syncs projects and returns summary', async () => {
    _mockUpsert.mockResolvedValue({ error: null });

    const projects = [
      { id: 'uuid-1', title: 'A', content: '{}' },
      { id: 'uuid-2', title: 'B', content: '{}', created_at: '2025-01-01T00:00:00.000Z' },
    ];

    const res = await request(app)
      .post('/api/mcp/sync')
      .send({ projects });

    expect(res.status).toBe(200);
    expect(res.body.synced).toBe(2);
    expect(res.body.projectIds).toEqual(['uuid-1', 'uuid-2']);
    expect(res.body.dashboardUrl).toBe('http://localhost:5173/dashboard');
    expect(res.body.message).toContain('2 project(s) synced');
  });

  test('returns 400 when projects array is empty', async () => {
    const res = await request(app)
      .post('/api/mcp/sync')
      .send({ projects: [] });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'projects array is required and must not be empty' });
  });

  test('returns 400 when projects key is missing', async () => {
    const res = await request(app)
      .post('/api/mcp/sync')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'projects array is required and must not be empty' });
  });

  test('returns 400 if a project is missing required fields', async () => {
    const res = await request(app)
      .post('/api/mcp/sync')
      .send({ projects: [{ id: 'some-id', title: 'No content' }] });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/missing required fields/);
  });

  test('returns 500 on supabase error', async () => {
    _mockUpsert.mockResolvedValue({ error: { message: 'upsert failed' } });

    const res = await request(app)
      .post('/api/mcp/sync')
      .send({ projects: [{ id: 'uuid-1', title: 'A', content: '{}' }] });

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error', 'upsert failed');
  });
});
