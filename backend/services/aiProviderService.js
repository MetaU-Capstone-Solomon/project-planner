const { GoogleGenerativeAI } = require('@google/generative-ai');
const Anthropic = require('@anthropic-ai/sdk');
const { createClient } = require('@supabase/supabase-js');
const { encrypt, decrypt } = require('./encryptionService');

class UsageLimitError extends Error {
  constructor() {
    super('Monthly generation limit reached');
    this.name = 'UsageLimitError';
    this.statusCode = 429;
  }
}

class ProviderError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ProviderError';
    this.statusCode = 400;
  }
}

class AIProviderService {
  constructor() {
    this._supabase = null;
  }

  get supabase() {
    if (!this._supabase) {
      this._supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
    }
    return this._supabase;
  }

  /** Detect provider from API key prefix */
  detectProvider(key) {
    if (!key) return null;
    if (key.startsWith('sk-ant-')) return 'claude';
    if (key.startsWith('AIza')) return 'gemini';
    return null;
  }

  /** Return first 8 chars + bullets for display */
  maskKey(key) {
    const prefix = key.substring(0, 8);
    return `${prefix}••••••••`;
  }

  /**
   * Generate text using the user's key (if set) or the app's free-tier Gemini key.
   * @param {string} userId - Supabase user UUID
   * @param {string} prompt - Full prompt text
   * @returns {Promise<{text: string, provider: string}>}
   * @throws {UsageLimitError} when free tier is exhausted
   * @throws {ProviderError} when user's key is invalid
   */
  async generate(userId, prompt) {
    let settings = await this._getOrCreateSettings(userId);
    settings = await this._checkAndResetUsage(settings);

    if (settings.api_key_encrypted) {
      const key = decrypt(settings.api_key_encrypted);
      return await this._generateWithUserKey(key, settings.api_provider, prompt);
    }

    // Free tier
    if (settings.monthly_usage >= settings.usage_limit) {
      throw new UsageLimitError();
    }

    const result = await this._generateWithAppKey(prompt);
    await this._incrementUsage(settings.user_id, settings.monthly_usage);
    return result;
  }

  /**
   * Validate a user-supplied key with a minimal test call.
   * Throws if the key is invalid or expired.
   */
  async validateKey(key, provider) {
    if (provider === 'gemini') {
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite-preview' });
      await model.generateContent('Hi');
    } else if (provider === 'claude') {
      const client = new Anthropic({ apiKey: key });
      await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'Hi' }],
      });
    } else {
      throw new ProviderError(`Unsupported provider: ${provider}`);
    }
  }

  async _getOrCreateSettings(userId) {
    const { data, error } = await this.supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      const { data: created, error: createErr } = await this.supabase
        .from('user_settings')
        .insert({ user_id: userId })
        .select()
        .single();
      if (createErr) throw new Error(`Failed to create user settings: ${createErr.message}`);
      return created;
    }
    if (error) throw new Error(`Failed to load user settings: ${error.message}`);
    return data;
  }

  async _checkAndResetUsage(settings) {
    if (new Date() <= new Date(settings.usage_reset_at)) return settings;

    const nextReset = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await this.supabase
      .from('user_settings')
      .update({ monthly_usage: 0, usage_reset_at: nextReset })
      .eq('user_id', settings.user_id)
      .select()
      .single();
    if (error) throw new Error(`Failed to reset usage: ${error.message}`);
    return data;
  }

  async _incrementUsage(userId, currentUsage) {
    const { error } = await this.supabase
      .from('user_settings')
      .update({ monthly_usage: currentUsage + 1, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
    if (error) {
      console.error('Failed to increment usage for user', userId, error.message);
    }
  }

  async _generateWithAppKey(prompt) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite-preview' });
    const result = await model.generateContent(prompt);
    return { text: result.response.text(), provider: 'gemini' };
  }

  async _generateWithUserKey(key, provider, prompt) {
    try {
      if (provider === 'gemini') return await this._generateWithGemini(key, prompt);
      if (provider === 'claude') return await this._generateWithClaude(key, prompt);
      throw new ProviderError(`Unsupported provider: ${provider}`);
    } catch (err) {
      if (err instanceof ProviderError) throw err;
      throw new ProviderError(err.message || 'AI provider request failed');
    }
  }

  async _generateWithGemini(key, prompt) {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite-preview' });
    const result = await model.generateContent(prompt);
    return { text: result.response.text(), provider: 'gemini' };
  }

  async _generateWithClaude(key, prompt) {
    const client = new Anthropic({ apiKey: key });
    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }],
    });
    if (!message.content || !message.content[0]) {
      throw new ProviderError('Claude returned empty response');
    }
    return { text: message.content[0].text, provider: 'claude' };
  }
}

module.exports = { AIProviderService, UsageLimitError, ProviderError };
