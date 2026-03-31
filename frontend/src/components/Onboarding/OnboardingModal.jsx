import { useState } from 'react';
import { Code2, Briefcase, GraduationCap, X } from 'lucide-react';
import { API_ENDPOINTS } from '@/config/api';
import { supabase } from '@/lib/supabase';
import { useInvalidateUserSettings } from '@/hooks/useUserSettings';
import toast from 'react-hot-toast';

const ROLES = [
  {
    id: 'developer',
    icon: Code2,
    label: 'Developer',
    description: 'I write code and want AI agent integration',
  },
  {
    id: 'founder_pm',
    icon: Briefcase,
    label: 'Founder / PM',
    description: 'I manage products and teams',
  },
  {
    id: 'student',
    icon: GraduationCap,
    label: 'Student',
    description: "I'm learning and building projects",
  },
];

/**
 * OnboardingModal — shown once when user creates their first project.
 * @param {function} onComplete - called when role is saved or skipped
 */
export default function OnboardingModal({ onComplete }) {
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const invalidateSettings = useInvalidateUserSettings();

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(API_ENDPOINTS.USER_ROLE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ role: selected }),
      });
      if (!response.ok) throw new Error('Failed to save role');
      await invalidateSettings();
      onComplete();
    } catch {
      toast.error('Failed to save preference. You can set it later in Settings.');
      onComplete(); // don't block the user
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-md border border-zinc-200 dark:border-zinc-700">
        <div className="p-6">
          <div className="flex items-start justify-between mb-1">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              How are you planning to use this?
            </h2>
            <button
              onClick={onComplete}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors ml-4 mt-0.5"
            >
              <X size={18} />
            </button>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-5">
            We'll show you the most relevant features. You can change this anytime in Settings.
          </p>

          <div className="flex flex-col gap-2 mb-6">
            {ROLES.map(({ id, icon: Icon, label, description }) => (
              <button
                key={id}
                onClick={() => setSelected(id)}
                className={`flex items-center gap-3 p-3.5 rounded-lg border text-left transition-all ${
                  selected === id
                    ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-800'
                    : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500'
                }`}
              >
                <div className={`p-1.5 rounded-md ${selected === id ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
                  <Icon
                    size={16}
                    className={selected === id ? 'text-white dark:text-zinc-900' : 'text-zinc-600 dark:text-zinc-400'}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{label}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={onComplete}
              className="text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            >
              Skip for now
            </button>
            <button
              onClick={handleSave}
              disabled={!selected || saving}
              className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium rounded-lg disabled:opacity-40 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors"
            >
              {saving ? 'Saving...' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
