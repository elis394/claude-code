import { Redirect } from 'expo-router';

import { useAppGate } from '@/lib/use-app-gate';

/**
 * "/" has no screen of its own — it only exists to redirect to whichever
 * branch _layout.tsx's Stack.Protected guards currently allow.
 */
export default function Index() {
  const gate = useAppGate();

  if (gate.status === 'loading') return null;
  if (gate.status === 'auth') return <Redirect href="/(auth)/login" />;
  if (gate.status === 'household-setup') return <Redirect href="/household-setup" />;
  return <Redirect href="/(tabs)/recipes" />;
}
