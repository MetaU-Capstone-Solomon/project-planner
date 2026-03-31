import { Zap, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '@/config/api';
import { supabase } from '@/lib/supabase';
import { useInvalidateUserSettings } from '@/hooks/useUserSettings';
import { ROUTES } from '@/constants/routes';

const ANTHROPIC_CONSOLE_URL = 'https://console.anthropic.com/settings/keys';
const GOOGLE_AI_STUDIO_URL = 'https://aistudio.google.com/app/apikey';

/**
 * BYOKModal — prompts user to add their API key.
 * @param {'first-generation'|'one-remaining'} trigger - which scenario triggered this
 * @param {function} onDismiss - called when user dismisses
 */
export default function BYOKModal({ trigger, onDismiss }) {
  const navigate = useNavigate();
  const invalidateSettings = useInvalidateUserSettings();

  async function handleDismiss() {
    if (trigger === 'first-generation') {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        await fetch(API_ENDPOINTS.DISMISS_BYOK, {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        await invalidateSettings();
      } catch {
        // Silent — dismissing is best-effort
      }
    }
    onDismiss();
  }

  function handleAddKey() {
    onDismiss();
    navigate(ROUTES.SETTINGS);
  }

  const isFirstGen = trigger === 'first-generation';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-sm border border-zinc-200 dark:border-zinc-700">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
              <Zap size={18} className="text-zinc-700 dark:text-zinc-300" />
            </div>
            <button onClick={handleDismiss} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
              <X size={18} />
            </button>
          </div>

          {isFirstGen ? (
            <>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                Your project is ready.
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed">
                For the best results, add a{' '}
                <a href={ANTHROPIC_CONSOLE_URL} target="_blank" rel="noreferrer" className="text-zinc-900 dark:text-zinc-100 underline underline-offset-2">
                  Claude API key
                </a>
                . Just testing? Get a free{' '}
                <a href={GOOGLE_AI_STUDIO_URL} target="_blank" rel="noreferrer" className="text-zinc-900 dark:text-zinc-100 underline underline-offset-2">
                  Gemini key
                </a>{' '}
                — takes 30 seconds.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                You have 1 free generation left this month.
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed">
                Add your own API key to keep going without interruption.
              </p>
            </>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleAddKey}
              className="flex-1 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors"
            >
              Add my key
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-600 dark:text-zinc-400 rounded-lg hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors"
            >
              {isFirstGen ? 'Not now' : 'Continue without'}
            </button>
          </div>

          {isFirstGen && (
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-3 text-center">
              You won't see this again.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
