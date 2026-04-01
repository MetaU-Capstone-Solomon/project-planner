import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { API_ENDPOINTS } from '@/config/api';
import { ROUTES, getProjectDetailPath } from '@/constants/routes';
import { MESSAGES } from '@/constants/messages';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { scaleIn } from '@/constants/motion';

function CheckIcon() {
  return (
    <svg viewBox="0 0 52 52" className="h-12 w-12">
      <motion.circle
        cx="26" cy="26" r="25" fill="none" stroke="#10b981" strokeWidth="2"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, ease: 'easeOut' }}
      />
      <motion.path
        d="M14 27l8 8 16-16" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 0.4, ease: 'easeOut' }}
      />
    </svg>
  );
}

function XIcon() {
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </div>
  );
}

export default function AcceptInvitationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const token   = searchParams.get('token');
  const project = searchParams.get('project');

  useEffect(() => {
    if (authLoading) return;
    if (!token || !project) {
      setStatus('error');
      setErrorMessage('Invalid invitation link. Please ask for a new invitation.');
      return;
    }
    if (!user) {
      localStorage.setItem('pendingInvitation', window.location.href);
      navigate(ROUTES.AUTH);
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        setStatus('loading');
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          localStorage.setItem('pendingInvitation', window.location.href);
          navigate(ROUTES.AUTH);
          return;
        }

        const response = await fetch(API_ENDPOINTS.ACCEPT_INVITATION, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ token, projectId: project }),
        });
        const result = await response.json();

        if (cancelled) return;

        if (response.ok && result.success) {
          setStatus('success');
          setTimeout(() => navigate(getProjectDetailPath(result.projectId)), 2000);
        } else {
          setStatus('error');
          setErrorMessage(result.error || MESSAGES.ERROR.INVITATION_ACCEPT_FAILED);
        }
      } catch {
        if (!cancelled) {
          setStatus('error');
          setErrorMessage(MESSAGES.ERROR.INVITATION_ACCEPT_FAILED);
        }
      }
    };

    run();
    return () => { cancelled = true; };
  }, [authLoading, token, project, user, navigate]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--bg-base)] p-4">
      <div className="orb" style={{ top: '-100px', right: '-100px' }} />

      <motion.div {...scaleIn} className="relative z-10 w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-8 text-center shadow-lg">
        <AnimatePresence mode="wait">
          {status === 'loading' && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4">
              <Spinner size="lg" className="text-[var(--accent)]" />
              <p className="text-[var(--text-secondary)]">Accepting your invitation…</p>
            </motion.div>
          )}

          {status === 'success' && (
            <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4">
              <CheckIcon />
              <div>
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">You're in!</h2>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">Redirecting you to the project…</p>
              </div>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4">
              <XIcon />
              <div>
                <h2 className="text-xl font-bold text-[var(--text-primary)]">Invitation Error</h2>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{errorMessage}</p>
              </div>
              <Button onClick={() => navigate(ROUTES.DASHBOARD)} className="w-full">
                Go to Dashboard
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
