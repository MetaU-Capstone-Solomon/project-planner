import { useUserSettings } from './useUserSettings';

/**
 * Returns the current user's role: 'developer' | 'founder_pm' | 'student' | null
 * null means role not set or settings not yet loaded.
 */
export function useUserRole() {
  const { data } = useUserSettings();
  return data?.role ?? null;
}
