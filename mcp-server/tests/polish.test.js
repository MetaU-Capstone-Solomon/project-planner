// mcp-server/tests/polish.test.js
import { DASHBOARD_URL, API_URL } from '../lib/constants.js';

describe('constants', () => {
  it('exports DASHBOARD_URL pointing to frontend', () => {
    expect(DASHBOARD_URL).toBe('https://project-planner-7zw4.onrender.com');
  });

  it('exports API_URL pointing to backend', () => {
    expect(API_URL).toBe('https://project-planner-backend-i4x4.onrender.com');
  });
});
