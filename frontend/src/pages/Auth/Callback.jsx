import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import LoadingSpinner from '@/components/Loading/LoadingSpinner';
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
    <div className="min-h-screen">
      <LoadingSpinner size="lg" className="min-h-screen" />
    </div>
  );
}
