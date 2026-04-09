import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Terminal, Briefcase, GraduationCap, Check, Copy } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettings, useInvalidateUserSettings } from '@/hooks/useUserSettings';
import { useProfile } from '@/hooks/useProfile';
import { Avatar } from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import { API_ENDPOINTS } from '@/config/api';
import { supabase } from '@/lib/supabase';
import { pageTransition, spring } from '@/constants/motion';
import toast from 'react-hot-toast';

const ROLES = [
  { value: 'developer',  label: 'Developer',   icon: Terminal,       desc: 'I build things with code' },
  { value: 'founder_pm', label: 'Founder / PM', icon: Briefcase,      desc: 'I lead teams and ship products' },
  { value: 'student',    label: 'Student',      icon: GraduationCap,  desc: "I'm learning and building projects" },
];

function SectionHeading({ title, description }) {
  return (
    <div className="mb-6">
      <h2 className="text-base font-semibold text-[var(--text-primary)]">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-[var(--text-secondary)]">{description}</p>}
    </div>
  );
}

function Divider() {
  return <div className="my-8 border-t border-[var(--border)]" />;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { data: settings, isLoading } = useUserSettings();
  const invalidate = useInvalidateUserSettings();

  const [selectedRole, setSelectedRole] = useState(null);
  const [savingRole, setSavingRole] = useState(false);
  const [mcpTokenExists, setMcpTokenExists] = useState(false);
  const [mcpTokenCreatedAt, setMcpTokenCreatedAt] = useState(null);
  const [mcpToken, setMcpToken] = useState(null);
  const [mcpTokenCopied, setMcpTokenCopied] = useState(false);
  const [mcpLoading, setMcpLoading] = useState(false);
  const [mcpStatusLoading, setMcpStatusLoading] = useState(true);

  const currentRole = settings?.role;
  const pendingRole = selectedRole ?? currentRole;
  const hasRoleChange = selectedRole && selectedRole !== currentRole;

  const {
    deleteLoading,
    handleDeleteAccount,
    handleSignOut,
  } = useProfile();

  useEffect(() => {
    async function checkMcpStatus() {
      try {
        const session = await getSession();
        if (!session) return;
        const res = await fetch(API_ENDPOINTS.MCP_TOKEN_STATUS, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) return;
        const { exists, createdAt } = await res.json();
        setMcpTokenExists(exists);
        setMcpTokenCreatedAt(createdAt);
      } catch {
        // silently fail
      } finally {
        setMcpStatusLoading(false);
      }
    }
    checkMcpStatus();
  }, []);

  async function getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }

  async function handleSaveRole() {
    if (!hasRoleChange) return;
    setSavingRole(true);
    try {
      const session = await getSession();
      const res = await fetch(API_ENDPOINTS.USER_ROLE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ role: selectedRole }),
      });
      if (!res.ok) throw new Error();
      await invalidate();
      setSelectedRole(null);
      toast.success('Preferences saved.');
    } catch {
      toast.error('Failed to save. Please try again.');
    } finally {
      setSavingRole(false);
    }
  }

  async function handleGenerateMcpToken() {
    setMcpLoading(true);
    try {
      const session = await getSession();
      const res = await fetch(API_ENDPOINTS.MCP_TOKEN, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMcpToken(data.token);
      setMcpTokenExists(true);
      toast.success("Token generated. Copy it now — it won't be shown again.");
    } catch (err) {
      toast.error(err.message || 'Failed to generate token.');
    } finally {
      setMcpLoading(false);
    }
  }

  async function handleRevokeMcpToken() {
    setMcpLoading(true);
    try {
      const session = await getSession();
      const res = await fetch(API_ENDPOINTS.MCP_TOKEN, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error();
      setMcpToken(null);
      setMcpTokenExists(false);
      toast.success('MCP token revoked.');
    } catch {
      toast.error('Failed to revoke token.');
    } finally {
      setMcpLoading(false);
    }
  }

  async function handleCopyMcpToken() {
    if (!mcpToken) return;
    try {
      await navigator.clipboard.writeText(mcpToken);
      setMcpTokenCopied(true);
      setTimeout(() => setMcpTokenCopied(false), 2000);
    } catch {
      toast.error('Failed to copy token. Please copy it manually.');
    }
  }

  return (
    <motion.div {...pageTransition} className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="mb-8 text-2xl font-bold text-[var(--text-primary)]">Settings</h1>

      {/* SECTION 1 — Profile */}
      <SectionHeading title="Profile" />
      <div className="flex items-center gap-5">
        <Avatar
          src={user?.user_metadata?.avatar_url}
          name={user?.user_metadata?.full_name || user?.email}
          size="lg"
        />
        <div>
          <p className="font-semibold text-[var(--text-primary)]">
            {user?.user_metadata?.full_name || '—'}
          </p>
          <p className="text-sm text-[var(--text-secondary)]">{user?.email}</p>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
          </p>
        </div>
      </div>

      <Divider />

      {/* SECTION 2 — Role */}
      <SectionHeading
        title="How are you using this?"
        description="This personalises your experience. You can change it anytime."
      />
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            {ROLES.map(({ value, label, icon: Icon, desc }) => {
              const active = pendingRole === value;
              return (
                <motion.button
                  key={value}
                  onClick={() => setSelectedRole(value)}
                  whileTap={{ scale: 0.98 }}
                  transition={spring.snappy}
                  className={`relative flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all ${
                    active
                      ? 'border-[var(--accent)] bg-[var(--accent-subtle)]'
                      : 'border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--accent)]'
                  }`}
                >
                  {active && (
                    <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)]">
                      <Check size={11} className="text-white" />
                    </span>
                  )}
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${active ? 'bg-[var(--accent)]' : 'bg-[var(--bg-elevated)]'}`}>
                    <Icon size={17} className={active ? 'text-white' : 'text-[var(--text-secondary)]'} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{label}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{desc}</p>
                  </div>
                </motion.button>
              );
            })}
          </div>
          {hasRoleChange && (
            <div className="mt-4 flex justify-end">
              <Button onClick={handleSaveRole} loading={savingRole} size="sm">
                Save preference
              </Button>
            </div>
          )}
        </>
      )}

      <Divider />

      {/* SECTION 4 — Claude Code Integration */}
      <SectionHeading
        title="Claude Code Integration"
        description="Connect Claude Code to your projects. Generate a token once and paste it into your .mcp.json."
      />
      {mcpStatusLoading ? (
        <Skeleton className="h-24 rounded-xl" />
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
          {!mcpTokenExists && !mcpToken && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">No token active</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">Generate a token to connect Claude Code to this account.</p>
              </div>
              <Button onClick={handleGenerateMcpToken} loading={mcpLoading} size="sm">
                Generate token
              </Button>
            </div>
          )}

          {mcpToken && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                Copy this token now — it won't be shown again.
              </p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={mcpToken}
                  className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 font-mono text-xs text-[var(--text-primary)]"
                />
                <Button variant="secondary" size="sm" onClick={handleCopyMcpToken}>
                  {mcpTokenCopied ? <Check size={14} /> : <Copy size={14} />}
                </Button>
              </div>
              <Button variant="destructive" size="sm" onClick={handleRevokeMcpToken} loading={mcpLoading}>
                Revoke
              </Button>
            </div>
          )}

          {mcpTokenExists && !mcpToken && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">Token active</p>
                  {mcpTokenCreatedAt && (
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      Generated {new Date(mcpTokenCreatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>
              <Button variant="destructive" size="sm" onClick={handleRevokeMcpToken} loading={mcpLoading}>
                Revoke
              </Button>
            </div>
          )}

          <details className="mt-4">
            <summary className="cursor-pointer text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
              Setup instructions
            </summary>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-[var(--bg-elevated)] p-3 text-xs text-[var(--text-primary)]">{`// Option 1 — Run the setup wizard (recommended):
npx @proplan/mcp@latest init

// Option 2 — Add manually to your .mcp.json:
{
  "mcpServers": {
    "project-planner": {
      "command": "npx",
      "args": ["-y", "@proplan/mcp@latest"],
      "env": {
        "MCP_TOKEN": "<paste your token here>"
      }
    }
  }
}`}</pre>
          </details>
        </div>
      )}

      <Divider />

      <SectionHeading
        title="Account actions"
        description="Keep your session secure or remove your account permanently."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Button variant="secondary" onClick={handleSignOut}>
          Sign out
        </Button>
        <Button
          variant="destructive"
          loading={deleteLoading}
          onClick={() => {
            if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
              handleDeleteAccount();
            }
          }}
        >
          Delete account
        </Button>
      </div>
    </motion.div>
  );
}
