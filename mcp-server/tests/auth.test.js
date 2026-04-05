import { validatePat } from '../auth.js';

describe('validatePat', () => {
  test('returns userId when token exists in DB', async () => {
    const mockUserId = 'user-123';
    const mockSupabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: { user_id: mockUserId }, error: null })
          })
        })
      })
    };
    const result = await validatePat(mockSupabase, 'mcp_abc123');
    expect(result).toBe(mockUserId);
  });

  test('throws when token not found', async () => {
    const mockSupabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: { code: 'PGRST116' } })
          })
        })
      })
    };
    await expect(validatePat(mockSupabase, 'mcp_invalid')).rejects.toThrow('Invalid MCP_TOKEN');
  });
});
