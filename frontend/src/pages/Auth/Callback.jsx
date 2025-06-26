import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export default function Callback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (data?.session) {
          navigate('/dashboard');
        } else {
          navigate('/auth');
        }
      } catch (error) {
        console.error('Error handling auth callback:', error);
        navigate('/auth');
      }
    };

    handleAuth();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
    </div>
  );
}
