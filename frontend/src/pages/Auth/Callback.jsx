import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import Spinner from '@/components/ui/Spinner';
import { ROUTES } from '@/constants/routes';

export default function Callback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (data?.session) {
          navigate(ROUTES.DASHBOARD);
        } else {
          navigate(ROUTES.AUTH);
        }
      } catch (error) {
        console.error('Error handling auth callback:', error);
        navigate(ROUTES.AUTH);
      }
    };

    handleAuth();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-base)]">
      <Spinner size="lg" className="text-[var(--accent)]" />
    </div>
  );
}
