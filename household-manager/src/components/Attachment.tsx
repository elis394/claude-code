import { useState } from "react";
import { Paperclip, X } from "lucide-react";
import type { Attachment } from "../types";
import { getAttachmentBlob } from "../lib/attachments";

async function openAttachment(attachment: Attachment) {
  const blob = await getAttachmentBlob(attachment.id);
  if (!blob) {
    alert("This file is no longer available in this browser.");
    return;
  }
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function AttachmentBadge({ attachment }: { attachment: Attachment }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    await openAttachment(attachment);
    setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      title={attachment.name}
      className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
    >
      <Paperclip size={11} />
      <span className="max-w-[8rem] truncate">{attachment.name}</span>
    </button>
  );
}

export function AttachmentField({
  attachment,
  onRemove,
}: {
  attachment: Attachment;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700">
      <button
        type="button"
        onClick={() => openAttachment(attachment)}
        className="flex min-w-0 items-center gap-2 text-left text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
      >
        <Paperclip size={14} className="shrink-0 text-slate-400" />
        <span className="truncate">{attachment.name}</span>
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove attachment"
        className="shrink-0 text-slate-400 hover:text-rose-500"
      >
        <X size={14} />
      </button>
    </div>
  );
}
