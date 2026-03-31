import { useQuery, useQueryClient } from '@tanstack/react-query';
import { API_ENDPOINTS } from '@/config/api';
import { supabase } from '@/lib/supabase';

const QUERY_KEY = 'userSettings';

async function fetchUserSettings() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const response = await fetch(API_ENDPOINTS.USER_SETTINGS, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (!response.ok) throw new Error('Failed to load settings');
  return response.json();
}

export function useUserSettings() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: fetchUserSettings,
    staleTime: 2 * 60 * 1000,   // 2 minutes
    retry: 1,
  });
}

/** Call this after any action that changes settings (role save, key save, generation) */
export function useInvalidateUserSettings() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
}
