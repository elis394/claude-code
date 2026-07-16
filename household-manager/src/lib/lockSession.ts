const UNLOCKED_KEY = "household-manager-unlocked";
const HIDDEN_AT_KEY = "household-manager-hidden-at";

// Re-lock if the app was backgrounded for longer than this — long enough to
// survive a quick app switch, short enough that a handed-off phone re-prompts.
const RELOCK_AFTER_MS = 30_000;

export function isUnlocked(): boolean {
  return sessionStorage.getItem(UNLOCKED_KEY) === "1";
}

export function markUnlocked(): void {
  sessionStorage.setItem(UNLOCKED_KEY, "1");
}

export function markLocked(): void {
  sessionStorage.removeItem(UNLOCKED_KEY);
}

export function initAutoRelock(onRelock: () => void): () => void {
  function handleVisibility() {
    if (document.hidden) {
      sessionStorage.setItem(HIDDEN_AT_KEY, String(Date.now()));
      return;
    }
    const hiddenAt = Number(sessionStorage.getItem(HIDDEN_AT_KEY) ?? 0);
    if (hiddenAt && Date.now() - hiddenAt > RELOCK_AFTER_MS) {
      markLocked();
      onRelock();
    }
  }
  document.addEventListener("visibilitychange", handleVisibility);
  return () => document.removeEventListener("visibilitychange", handleVisibility);
}
