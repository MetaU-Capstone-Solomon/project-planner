/**
 * AI Cache Service
 *
 * This hook wraps the AI API call with React Query caching.
 * Sends the Supabase session token so the backend can identify the user
 * for usage tracking and BYOK routing.
 */
import { useQuery } from '@tanstack/react-query';
import { API_ENDPOINTS } from '@/config/api';
import { CACHE_CONFIG, QUERY_KEYS } from '@/constants/cache';
import { supabase } from '@/lib/supabase';

const callAI = async (prompt) => {
  const { data: { session } } = await supabase.auth.getSession();
  const headers = { 'Content-Type': 'application/json' };
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  const response = await fetch(API_ENDPOINTS.CHAT, {
    method: 'POST',
    headers,
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'AI service failed');
  }

  const data = await response.json();
  return data.content;
};

export const useAICache = (prompt) => {
  return useQuery({
    queryKey: [QUERY_KEYS.AI_RESPONSES, prompt],
    queryFn: () => callAI(prompt),
    enabled: !!prompt,
    staleTime: CACHE_CONFIG.AI_RESPONSES.staleTime,
    gcTime: CACHE_CONFIG.AI_RESPONSES.gcTime,
    retry: CACHE_CONFIG.AI_RESPONSES.retry,
  });
};
