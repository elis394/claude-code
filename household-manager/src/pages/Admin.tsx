import { useMemo, useState } from "react";
import { Check, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { useAppData } from "../lib/store";
import type { AdminItem, Frequency } from "../types";
import { FREQUENCY_LABELS } from "../types";
import { daysUntil, formatDateShort, isDueSoon, isOverdue } from "../lib/dates";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  Textarea,
} from "../components/ui";

const CATEGORIES = ["Insurance", "Subscription", "Document/ID", "Vehicle", "Warranty", "Home", "Other"];

const emptyForm = {
  title: "",
  category: CATEGORIES[0],
  dueDate: "",
  frequency: "once" as Frequency,
  notes: "",
};

export default function Admin() {
  const { data, addAdminItem, updateAdminItem, deleteAdminItem, completeAdminItem } = useAppData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showDone, setShowDone] = useState(false);

  const sorted = useMemo(
    () =>
      [...data.admin].sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      }),
    [data.admin],
  );

  const visible = sorted.filter((a) => showDone || a.status !== "done");

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(item: AdminItem) {
    setEditingId(item.id);
    setForm({
      title: item.title,
      category: item.category,
      dueDate: item.dueDate ?? "",
      frequency: item.frequency ?? "once",
      notes: item.notes ?? "",
    });
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    const payload = {
      title: form.title.trim(),
      category: form.category,
      dueDate: form.dueDate || undefined,
      frequency: form.dueDate ? form.frequency : undefined,
      notes: form.notes.trim() || undefined,
    };
    if (editingId) {
      updateAdminItem(editingId, payload);
    } else {
      addAdminItem({ ...payload, status: "active" });
    }
    setModalOpen(false);
  }

  return (
    <div>
      <PageHeader
        title="Admin"
        subtitle="Paperwork, renewals, subscriptions and important dates"
        action={
          <Button onClick={openAdd}>
            <Plus size={16} /> Add item
          </Button>
        }
      />

      <div className="mb-4">
        <button
          onClick={() => setShowDone((s) => !s)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            showDone
              ? "bg-teal-600 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
          }`}
        >
          {showDone ? "Showing completed" : "Hiding completed"}
        </button>
      </div>

      {visible.length === 0 ? (
        <EmptyState title="Nothing here" subtitle="Add renewals, subscriptions or paperwork to track" />
      ) : (
        <div className="space-y-2">
          {visible.map((item) => {
            const overdue = item.status === "active" && !!item.dueDate && isOverdue(item.dueDate);
            const soon = item.status === "active" && !!item.dueDate && isDueSoon(item.dueDate);
            const d = item.dueDate ? daysUntil(item.dueDate) : null;
            const recurring = !!item.frequency && item.frequency !== "once";
            return (
              <Card key={item.id} className="flex items-center gap-3">
                <button
                  onClick={() => completeAdminItem(item.id)}
                  aria-label={recurring ? "Advance to next cycle" : "Mark done"}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-slate-300 text-transparent hover:border-teal-500 hover:text-teal-500 dark:border-slate-600"
                >
                  {recurring ? <RotateCcw size={13} /> : <Check size={15} />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p
                      className={`font-medium ${
                        item.status === "done" ? "text-slate-400 line-through" : "text-slate-800 dark:text-slate-100"
                      }`}
                    >
                      {item.title}
                    </p>
                    <Badge tone="slate">{item.category}</Badge>
                    {recurring && <Badge tone="teal">{FREQUENCY_LABELS[item.frequency!]}</Badge>}
                    {overdue && <Badge tone="rose">Overdue</Badge>}
                    {!overdue && soon && <Badge tone="amber">Due soon</Badge>}
                    {item.status === "done" && <Badge tone="green">Done</Badge>}
                  </div>
                  {item.dueDate && (
                    <p className="mt-0.5 text-xs text-slate-400">
                      {formatDateShort(item.dueDate)}
                      {d !== null && ` (${d === 0 ? "today" : d > 0 ? `in ${d}d` : `${-d}d ago`})`}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => openEdit(item)}
                  className="text-xs font-medium text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  Edit
                </button>
                <button onClick={() => deleteAdminItem(item.id)} aria-label="Delete item" className="text-slate-300 hover:text-rose-500">
                  <Trash2 size={16} />
                </button>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit item" : "Add item"}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="Title">
            <Input
              autoFocus
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Renew car insurance"
              required
            />
          </Field>
          <Field label="Category">
            <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Due date (optional)">
              <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </Field>
            <Field label="Repeats">
              <Select
                value={form.frequency}
                onChange={(e) => setForm({ ...form, frequency: e.target.value as Frequency })}
                disabled={!form.dueDate}
              >
                {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Notes (optional)">
            <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
          <div className="mt-5 flex justify-between">
            {editingId ? (
              <Button
                type="button"
                variant="danger"
                onClick={() => {
                  deleteAdminItem(editingId);
                  setModalOpen(false);
                }}
              >
                <X size={15} /> Delete
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingId ? "Save" : "Add item"}</Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
