import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload as UploadIcon, Receipt, ListChecks, Hammer, Wallet, FolderClock } from "lucide-react";
import { saveAttachment, type AttachmentMeta } from "../lib/attachments";
import { Modal } from "./ui";

const CATEGORIES: { label: string; path: string; icon: typeof Receipt }[] = [
  { label: "Bill", path: "/bills", icon: Receipt },
  { label: "Chore", path: "/chores", icon: ListChecks },
  { label: "Renovation project", path: "/renovations", icon: Hammer },
  { label: "Transaction", path: "/financials", icon: Wallet },
  { label: "Admin item", path: "/admin", icon: FolderClock },
];

export default function UploadEntry({ onNavigate }: { onNavigate?: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) setPendingFile(file);
  }

  async function handleChoose(path: string) {
    if (!pendingFile) return;
    setSaving(true);
    const meta: AttachmentMeta = await saveAttachment(pendingFile);
    setSaving(false);
    setPendingFile(null);
    onNavigate?.();
    navigate(path, { state: { pendingAttachment: meta } });
  }

  return (
    <>
      <button
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <UploadIcon size={17} />
        Upload item
      </button>
      <input ref={inputRef} type="file" className="hidden" onChange={handleFileChange} />

      <Modal open={!!pendingFile} onClose={() => setPendingFile(null)} title="What would you like to do with this?">
        {pendingFile && (
          <>
            <p className="mb-3 truncate text-sm text-slate-500 dark:text-slate-400">{pendingFile.name}</p>
            <div className="grid grid-cols-1 gap-2">
              {CATEGORIES.map(({ label, path, icon: Icon }) => (
                <button
                  key={path}
                  type="button"
                  disabled={saving}
                  onClick={() => handleChoose(path)}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:border-teal-500 hover:bg-teal-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-teal-950"
                >
                  <Icon size={16} className="text-slate-400" />
                  Add as {label}
                </button>
              ))}
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
