import { useUserRole } from './useUserRole';
import { ROLE_CONFIG, DEFAULT_CONFIG } from '@/constants/roleConfig';

export function useRoleConfig() {
  const role = useUserRole();
  const config = role ? (ROLE_CONFIG[role] ?? DEFAULT_CONFIG) : DEFAULT_CONFIG;
  return { role, config };
}
