const HASH_KEY = "household-manager-pin-hash";

async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function hasPin(): boolean {
  return !!localStorage.getItem(HASH_KEY);
}

export async function setPin(pin: string): Promise<void> {
  localStorage.setItem(HASH_KEY, await sha256Hex(pin));
}

export async function verifyPin(pin: string): Promise<boolean> {
  const stored = localStorage.getItem(HASH_KEY);
  if (!stored) return true;
  return (await sha256Hex(pin)) === stored;
}

export function clearPin(): void {
  localStorage.removeItem(HASH_KEY);
}
