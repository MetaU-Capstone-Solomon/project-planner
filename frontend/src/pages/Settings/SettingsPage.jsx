import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { User, Key } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettings, useInvalidateUserSettings } from '@/hooks/useUserSettings';
import ApiKeyPanel from '@/components/Settings/ApiKeyPanel';
import { API_ENDPOINTS } from '@/config/api';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

const ROLE_OPTIONS = [
  { value: 'developer', label: 'Developer', desc: 'Code, agents, and integrations' },
  { value: 'founder_pm', label: 'Founder / PM', desc: 'Products, teams, and milestones' },
  { value: 'student', label: 'Student', desc: 'Learning and building projects' },
];

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'api-key', label: 'API Key', icon: Key },
];

export default function SettingsPage() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile');
  const { user } = useAuth();

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl) setActiveTab(tabFromUrl);
  }, [searchParams]);
  const { data: settings } = useUserSettings();
  const invalidate = useInvalidateUserSettings();
  const [savingRole, setSavingRole] = useState(false);

  async function handleRoleChange(role) {
    setSavingRole(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error('Session expired. Please refresh the page.'); setSavingRole(false); return; }
      const response = await fetch(API_ENDPOINTS.USER_ROLE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ role }),
      });
      if (!response.ok) throw new Error();
      await invalidate();
      toast.success('Preferences saved.');
    } catch {
      toast.error('Failed to save. Please try again.');
    } finally {
      setSavingRole(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50 mb-6">Settings</h1>

      {/* Tab nav */}
      <div role="tablist" className="flex gap-1 border-b border-zinc-200 dark:border-zinc-700 mb-8">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={activeTab === id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === id
                ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-50'
                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {activeTab === 'profile' && (
        <div role="tabpanel">
        <div className="space-y-6">
          <div>
            <label htmlFor="user-email" className="text-sm font-medium text-zinc-700 dark:text-zinc-300 block mb-1">Email</label>
            <input
              id="user-email"
              type="email"
              readOnly
              value={user?.email ?? ''}
              className="text-sm text-zinc-500 dark:text-zinc-400 px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 w-full focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 block mb-3">
              How are you using this?
            </label>
            <div className="flex flex-col gap-2">
              {ROLE_OPTIONS.map(({ value, label, desc }) => (
                <button
                  key={value}
                  onClick={() => handleRoleChange(value)}
                  disabled={savingRole}
                  className={`flex items-center justify-between p-3.5 rounded-lg border text-left transition-all disabled:opacity-60 ${
                    settings?.role === value
                      ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-800'
                      : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500'
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{label}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{desc}</p>
                  </div>
                  {settings?.role === value && (
                    <div className="w-2 h-2 rounded-full bg-zinc-900 dark:bg-zinc-100 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
            {savingRole && (
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">Saving…</p>
            )}
          </div>
        </div>
        </div>
      )}

      {/* API Key tab */}
      {activeTab === 'api-key' && (
        <div role="tabpanel">
          <ApiKeyPanel />
        </div>
      )}
    </div>
  );
}
