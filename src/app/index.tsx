import { Redirect } from 'expo-router';

import { useAuth } from '@/lib/auth-context';
import { useHousehold } from '@/lib/queries';

/**
 * "/" has no screen of its own — it only exists to redirect to whichever
 * branch _layout.tsx's Stack.Protected guards currently allow.
 */
export default function Index() {
  const { session } = useAuth();
  const { data: household, isLoading } = useHousehold(session?.user.id);

  if (!session) return <Redirect href="/(auth)/login" />;
  if (isLoading) return null;
  if (!household) return <Redirect href="/household-setup" />;
  return <Redirect href="/(tabs)/recipes" />;
}
