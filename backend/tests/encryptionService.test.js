const { encrypt, decrypt } = require('../services/encryptionService');

// Set test encryption key before tests run
beforeAll(() => {
  process.env.ENCRYPTION_KEY = 'a'.repeat(64); // 32 bytes as hex
});

describe('encryptionService', () => {
  test('encrypt returns a string with three colon-separated hex segments', () => {
    const result = encrypt('sk-ant-test-key-12345');
    const parts = result.split(':');
    expect(parts).toHaveLength(3);
    // iv: 32 hex chars (16 bytes), authTag: 32 hex chars (16 bytes), data: variable
    expect(parts[0]).toHaveLength(32);
    expect(parts[1]).toHaveLength(32);
    expect(parts[2].length).toBeGreaterThan(0);
  });

  test('decrypt recovers the original plaintext', () => {
    const original = 'AIzaSyTestGeminiKey987';
    const encrypted = encrypt(original);
    expect(decrypt(encrypted)).toBe(original);
  });

  test('each encrypt call produces a different ciphertext', () => {
    const key = 'sk-ant-samekey';
    expect(encrypt(key)).not.toBe(encrypt(key));
  });

  test('decrypt throws on tampered ciphertext', () => {
    const encrypted = encrypt('sk-ant-test');
    const parts = encrypted.split(':');
    // Tamper with the auth tag
    const tampered = `${parts[0]}:${'f'.repeat(32)}:${parts[2]}`;
    expect(() => decrypt(tampered)).toThrow();
  });

  test('throws if ENCRYPTION_KEY is not set', () => {
    const savedKey = process.env.ENCRYPTION_KEY;
    delete process.env.ENCRYPTION_KEY;
    expect(() => encrypt('anything')).toThrow('ENCRYPTION_KEY environment variable not set');
    process.env.ENCRYPTION_KEY = savedKey;
  });
});
