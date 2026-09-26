import { useAuth } from '@/lib/auth-context';
import { useHousehold } from '@/lib/queries';

export type AppGateState =
  | { status: 'loading' }
  | { status: 'auth' }
  | { status: 'household-setup' }
  | { status: 'ready' };

/** Computes the app's one three-way gate (auth -> household setup -> app)
 * once, so the root layout's route guards and "/" 's redirect target read
 * from the same state instead of each re-deriving it independently. */
export function useAppGate(): AppGateState {
  const { session, initializing } = useAuth();
  const { data: household, isLoading: householdLoading } = useHousehold(session?.user.id);

  if (initializing) return { status: 'loading' };
  if (!session) return { status: 'auth' };
  if (householdLoading) return { status: 'loading' };
  if (!household) return { status: 'household-setup' };
  return { status: 'ready' };
}
