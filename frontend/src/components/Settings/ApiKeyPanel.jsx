import { useState } from 'react';
import { Info, CheckCircle, XCircle, Loader2, Trash2 } from 'lucide-react';
import { API_ENDPOINTS } from '@/config/api';
import { supabase } from '@/lib/supabase';
import { useUserSettings, useInvalidateUserSettings } from '@/hooks/useUserSettings';
import toast from 'react-hot-toast';

const ANTHROPIC_URL = 'https://console.anthropic.com/settings/keys';
const GOOGLE_URL = 'https://aistudio.google.com/app/apikey';

const PROVIDER_LABELS = { claude: 'Claude', gemini: 'Gemini' };

export default function ApiKeyPanel() {
  const { data: settings } = useUserSettings();
  const invalidate = useInvalidateUserSettings();
  const [keyInput, setKeyInput] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [status, setStatus] = useState('idle'); // 'idle' | 'validating' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  const hasKey = !!settings?.apiProvider;
  const usagePercent = settings ? (settings.usage.used / settings.usage.limit) * 100 : 0;

  async function handleSave() {
    if (!keyInput.trim()) return;
    setStatus('validating');
    setErrorMsg('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(API_ENDPOINTS.USER_API_KEY, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ key: keyInput.trim() }),
      });
      const data = await response.json();
      if (!response.ok) {
        setStatus('error');
        setErrorMsg(data.error || 'Invalid key');
        return;
      }
      setStatus('success');
      setKeyInput('');
      setShowInput(false);
      await invalidate();
      toast.success('API key saved and verified.');
    } catch {
      setStatus('error');
      setErrorMsg('Something went wrong. Please try again.');
    }
  }

  async function handleRemove() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(API_ENDPOINTS.USER_API_KEY, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!response.ok) throw new Error('Failed to remove key');
      await invalidate();
      toast.success("API key removed. You're back on the free tier.");
    } catch {
      toast.error('Failed to remove key. Please try again.');
    }
  }

  return (
    <div className="space-y-6">
      {/* Usage meter (only shown when on free tier) */}
      {!hasKey && settings && (
        <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Monthly usage</span>
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {settings.usage.used} / {settings.usage.limit} free generations
            </span>
          </div>
          <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-zinc-900 dark:bg-zinc-100 rounded-full transition-all"
              style={{ width: `${Math.min(usagePercent, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Current key display */}
      {hasKey && !showInput ? (
        <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-0.5">
                {PROVIDER_LABELS[settings.apiProvider]} key active
              </p>
              <p className="text-sm font-mono text-zinc-400 dark:text-zinc-500">{settings.maskedKey}</p>
            </div>
            <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => { setShowInput(true); setStatus('idle'); }}
              className="text-xs px-3 py-1.5 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 transition-colors"
            >
              Replace
            </button>
            <button
              onClick={handleRemove}
              className="text-xs px-3 py-1.5 border border-red-200 dark:border-red-900 rounded-md text-red-500 hover:border-red-400 flex items-center gap-1 transition-colors"
            >
              <Trash2 size={12} /> Remove
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Your API key
              </label>
              <div className="group relative">
                <Info size={14} className="text-zinc-400 cursor-help" />
                <div className="absolute right-0 bottom-6 w-64 p-3 bg-zinc-900 dark:bg-zinc-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 leading-relaxed">
                  Your key is encrypted and stored securely. It's never shown again after saving — to update it, paste a new one.
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={keyInput}
                  onChange={(e) => { setKeyInput(e.target.value); setStatus('idle'); }}
                  placeholder="sk-ant-... or AIza..."
                  className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleSave}
                disabled={!keyInput.trim() || status === 'validating'}
                className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium rounded-lg disabled:opacity-40 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors flex items-center gap-1.5"
              >
                {status === 'validating' ? <Loader2 size={14} className="animate-spin" /> : null}
                {status === 'validating' ? 'Checking...' : 'Save'}
              </button>
            </div>

            {/* Status feedback */}
            {status === 'success' && (
              <p className="flex items-center gap-1.5 text-xs text-green-600 mt-1.5">
                <CheckCircle size={12} /> Key verified and saved.
              </p>
            )}
            {status === 'error' && (
              <p className="flex items-center gap-1.5 text-xs text-red-500 mt-1.5">
                <XCircle size={12} /> {errorMsg}
              </p>
            )}
          </div>

          <p className="text-xs text-zinc-400 dark:text-zinc-500 leading-relaxed">
            Supports{' '}
            <a href={ANTHROPIC_URL} target="_blank" rel="noreferrer" className="underline underline-offset-2 text-zinc-600 dark:text-zinc-300">
              Claude
            </a>{' '}
            (recommended for best results) and{' '}
            <a href={GOOGLE_URL} target="_blank" rel="noreferrer" className="underline underline-offset-2 text-zinc-600 dark:text-zinc-300">
              Gemini
            </a>{' '}
            (free tier available).
          </p>

          {showInput && (
            <button
              onClick={() => setShowInput(false)}
              className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}
