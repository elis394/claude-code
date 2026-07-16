import { useState } from "react";
import { Lock, LockOpen } from "lucide-react";
import { clearPin, hasPin, setPin, verifyPin } from "../lib/pin";
import { markUnlocked } from "../lib/lockSession";
import { Button, Field, Input, Modal } from "./ui";

export default function LockSettings() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"current" | "new">("new");
  const [current, setCurrent] = useState("");
  const [pin1, setPin1] = useState("");
  const [pin2, setPin2] = useState("");
  const [error, setError] = useState("");

  function openModal() {
    setStep(hasPin() ? "current" : "new");
    setCurrent("");
    setPin1("");
    setPin2("");
    setError("");
    setOpen(true);
  }

  async function handleVerifyCurrent(e: React.FormEvent) {
    e.preventDefault();
    if (!(await verifyPin(current))) {
      setError("Incorrect PIN");
      return;
    }
    setError("");
    setStep("new");
  }

  async function handleSaveNew(e: React.FormEvent) {
    e.preventDefault();
    if (pin1.length < 4) {
      setError("PIN must be at least 4 digits");
      return;
    }
    if (pin1 !== pin2) {
      setError("PINs don't match");
      return;
    }
    await setPin(pin1);
    markUnlocked();
    setOpen(false);
  }

  function handleTurnOff() {
    clearPin();
    setOpen(false);
  }

  const title = step === "current" ? "Confirm current PIN" : hasPin() ? "Change PIN" : "Set a PIN";

  return (
    <>
      <button
        onClick={openModal}
        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        {hasPin() ? <Lock size={17} /> : <LockOpen size={17} />}
        {hasPin() ? "App lock: on" : "Enable app lock"}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={title}>
        {step === "current" ? (
          <form onSubmit={handleVerifyCurrent} className="space-y-3">
            <Field label="Current PIN">
              <Input
                autoFocus
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                value={current}
                onChange={(e) => setCurrent(e.target.value.replace(/\D/g, ""))}
              />
            </Field>
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <div className="mt-5 flex justify-between">
              <Button type="button" variant="danger" onClick={handleTurnOff}>
                Turn off lock
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Continue</Button>
              </div>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSaveNew} className="space-y-3">
            <Field label="New PIN (4–8 digits)">
              <Input
                autoFocus
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                value={pin1}
                onChange={(e) => setPin1(e.target.value.replace(/\D/g, ""))}
              />
            </Field>
            <Field label="Confirm PIN">
              <Input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                value={pin2}
                onChange={(e) => setPin2(e.target.value.replace(/\D/g, ""))}
              />
            </Field>
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save PIN</Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
