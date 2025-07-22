/**
 * AI Cache Service
 *
 * This hook wraps my AI API call with React Query caching and persistence.
 * - On first request for a prompt, it fetches from the backend and caches the result.
 * - Subsequent requests for the same prompt within the cache window return instantly from cache.
 * - If the cache is invalidated or expires, it fetches fresh data again.
 * - All cache timing and retry logic is located in the cache.js file.
 */
import { useQuery } from '@tanstack/react-query';
import { API_ENDPOINTS } from '@/config/api';
import { CACHE_CONFIG, QUERY_KEYS } from '@/constants/cache';

// existing AI call function
const callAI = async (prompt) => {
  const response = await fetch(API_ENDPOINTS.CHAT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'AI service failed');
  }

  const data = await response.json();
  return data.content;
};

//hook that caches AI responses
export const useAICache = (prompt) => {
  return useQuery({
    queryKey: [QUERY_KEYS.AI_RESPONSES, prompt],
    queryFn: () => callAI(prompt),
    enabled: !!prompt,
    staleTime: CACHE_CONFIG.AI_RESPONSES.staleTime,
    cacheTime: CACHE_CONFIG.AI_RESPONSES.cacheTime,
    retry: CACHE_CONFIG.AI_RESPONSES.retry,
  });
};
