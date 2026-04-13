import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/constants/routes';
import { stagger } from '@/constants/motion';

export default function Auth() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate(ROUTES.DASHBOARD, { replace: true });
  }, [user, navigate]);

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  return (
    <div className="flex min-h-screen bg-[var(--bg-base)]">
      {/* Left panel — dark, always */}
      <div className="relative hidden w-1/2 overflow-hidden bg-[#0a0a0a] lg:flex lg:flex-col lg:items-center lg:justify-center">
        <div className="relative z-10 max-w-sm px-12 text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white">
              <span className="text-xl font-bold text-[#0a0a0a]">PP</span>
            </div>
          </div>
          <p className="text-2xl font-bold leading-snug text-white">
            Your projects. Your pace.
          </p>
          <p className="mt-3 text-sm text-[#a3a3a3]">
            Generate roadmaps, track progress, and collaborate with your team — all in one place.
          </p>
        </div>
        {/* Floating dot pattern */}
        <div className="absolute inset-0 z-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }}
        />
      </div>

      {/* Right panel — sign in */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <motion.div
          variants={stagger.container}
          initial="initial"
          animate="animate"
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <motion.div variants={stagger.item} transition={{ duration: 0.3 }} className="mb-8 flex justify-center lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--text-primary)]">
              <span className="font-bold text-[var(--bg-base)]">PP</span>
            </div>
          </motion.div>

          <motion.h1
            variants={stagger.item}
            transition={{ duration: 0.3 }}
            className="mb-2 text-2xl font-bold text-[var(--text-primary)]"
          >
            Welcome back
          </motion.h1>
          <motion.p
            variants={stagger.item}
            transition={{ duration: 0.3 }}
            className="mb-8 text-sm text-[var(--text-secondary)]"
          >
            Sign in to continue to ProjectPlanner
          </motion.p>

          <motion.button
            variants={stagger.item}
            transition={{ duration: 0.3 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleSignIn}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3 text-sm font-medium text-[var(--text-primary)] shadow-sm transition-colors hover:bg-[var(--bg-elevated)]"
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z"/>
            </svg>
            Continue with Google
          </motion.button>

          <motion.p
            variants={stagger.item}
            transition={{ duration: 0.3 }}
            className="mt-6 text-center text-xs text-[var(--text-muted)]"
          >
            By signing in, you agree to our Terms of Service
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
