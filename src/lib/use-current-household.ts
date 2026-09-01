import { useAuth } from '@/lib/auth-context';
import { useHousehold } from '@/lib/queries';

/**
 * Convenience hook for screens under (tabs): by the time they're reachable,
 * the root layout has already guaranteed a session + household exist.
 */
export function useCurrentHousehold() {
  const { session } = useAuth();
  const householdQuery = useHousehold(session?.user.id);
  return {
    userId: session?.user.id as string,
    household: householdQuery.data ?? null,
    householdId: householdQuery.data?.id,
    isLoading: householdQuery.isLoading,
  };
}
