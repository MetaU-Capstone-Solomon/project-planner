const { AIProviderService, UsageLimitError, ProviderError } = require('../services/aiProviderService');

beforeAll(() => {
  process.env.ENCRYPTION_KEY = 'a'.repeat(64);
  process.env.GEMINI_API_KEY = 'AIzaTestKey';
  process.env.SUPABASE_URL = 'https://test.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
});

describe('detectProvider', () => {
  const service = new AIProviderService();

  test('detects claude from sk-ant- prefix', () => {
    expect(service.detectProvider('sk-ant-api03-abc123')).toBe('claude');
  });

  test('detects gemini from AIza prefix', () => {
    expect(service.detectProvider('AIzaSyAbcDef123')).toBe('gemini');
  });

  test('returns null for unknown prefix', () => {
    expect(service.detectProvider('pk-unknown-123')).toBeNull();
  });

  test('returns null for empty string', () => {
    expect(service.detectProvider('')).toBeNull();
  });
});

describe('maskKey', () => {
  const service = new AIProviderService();

  test('returns first 8 chars followed by bullets', () => {
    expect(service.maskKey('sk-ant-api03-longkey')).toBe('sk-ant-a••••••••');
  });

  test('handles short keys without crashing', () => {
    const result = service.maskKey('AIza');
    expect(result).toBe('AIza••••••••');
  });
});

describe('UsageLimitError', () => {
  test('has correct name and statusCode', () => {
    const err = new UsageLimitError();
    expect(err.name).toBe('UsageLimitError');
    expect(err.statusCode).toBe(429);
    expect(err.message).toBe('Monthly generation limit reached');
  });
});

describe('ProviderError', () => {
  test('has correct name and statusCode', () => {
    const err = new ProviderError('bad key');
    expect(err.name).toBe('ProviderError');
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe('bad key');
  });
});
