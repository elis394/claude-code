import { useState } from "react";
import { Lock } from "lucide-react";
import { verifyPin } from "../lib/pin";
import { markUnlocked } from "../lib/lockSession";
import { Button, Input } from "./ui";

export default function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setChecking(true);
    const ok = await verifyPin(pin);
    setChecking(false);
    if (ok) {
      markUnlocked();
      onUnlock();
    } else {
      setError("Incorrect PIN");
      setPin("");
    }
  }

  function handleReset() {
    const ok = window.confirm(
      "This erases everything stored in this browser — chores, bills, renovations, transactions, admin items, and the PIN itself. This can't be undone. Continue?",
    );
    if (!ok) return;
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-slate-50 p-6 dark:bg-slate-950">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-600 text-white">
        <Lock size={26} />
      </div>
      <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Enter PIN</h1>
      <form onSubmit={handleSubmit} className="flex w-full max-w-xs flex-col items-center gap-3">
        <Input
          autoFocus
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={8}
          value={pin}
          onChange={(e) => {
            setPin(e.target.value.replace(/\D/g, ""));
            setError("");
          }}
          className="text-center text-2xl tracking-[0.5em]"
          placeholder="••••"
        />
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <Button type="submit" className="w-full justify-center" disabled={pin.length < 4 || checking}>
          Unlock
        </Button>
      </form>
      <button
        onClick={handleReset}
        className="mt-2 text-xs text-slate-400 underline hover:text-slate-600 dark:hover:text-slate-300"
      >
        Forgot PIN? Reset all data
      </button>
    </div>
  );
}
