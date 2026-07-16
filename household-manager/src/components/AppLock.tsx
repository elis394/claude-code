import { useEffect, useState, type ReactNode } from "react";
import LockScreen from "./LockScreen";
import { hasPin } from "../lib/pin";
import { initAutoRelock, isUnlocked } from "../lib/lockSession";

export default function AppLock({ children }: { children: ReactNode }) {
  const [locked, setLocked] = useState(() => hasPin() && !isUnlocked());

  useEffect(() => initAutoRelock(() => setLocked(true)), []);

  if (locked) {
    return <LockScreen onUnlock={() => setLocked(false)} />;
  }
  return <>{children}</>;
}
