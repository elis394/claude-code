import { useMemo, useState } from "react";
import { Check, Plus, Trash2, User, X } from "lucide-react";
import { useAppData } from "../lib/store";
import type { Chore, Frequency } from "../types";
import { FREQUENCY_LABELS } from "../types";
import { daysUntil, formatDateShort, isDueSoon, isOverdue, todayIso } from "../lib/dates";
import { Badge, Button, Card, EmptyState, Field, Input, Modal, PageHeader, Select } from "../components/ui";

type FilterMode = "all" | "overdue";

const emptyForm = {
  title: "",
  assignee: "",
  room: "",
  frequency: "weekly" as Frequency,
  dueDate: todayIso(),
  notes: "",
};

export default function Chores() {
  const { data, addChore, updateChore, deleteChore, completeChore, addMember } = useAppData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");

  const sorted = useMemo(
    () => [...data.chores].sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [data.chores],
  );

  const filtered = sorted.filter((c) => {
    if (filter === "overdue" && !isOverdue(c.dueDate)) return false;
    if (assigneeFilter !== "all" && c.assignee !== assigneeFilter) return false;
    return true;
  });

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(chore: Chore) {
    setEditingId(chore.id);
    setForm({
      title: chore.title,
      assignee: chore.assignee ?? "",
      room: chore.room ?? "",
      frequency: chore.frequency,
      dueDate: chore.dueDate,
      notes: chore.notes ?? "",
    });
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (form.assignee.trim()) addMember(form.assignee.trim());
    const payload = {
      title: form.title.trim(),
      assignee: form.assignee.trim() || undefined,
      room: form.room.trim() || undefined,
      frequency: form.frequency,
      dueDate: form.dueDate,
      notes: form.notes.trim() || undefined,
    };
    if (editingId) {
      updateChore(editingId, payload);
    } else {
      addChore(payload);
    }
    setModalOpen(false);
  }

  return (
    <div>
      <PageHeader
        title="Chores"
        subtitle="Recurring and one-off tasks around the house"
        action={
          <Button onClick={openAdd}>
            <Plus size={16} /> Add chore
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(["all", "overdue"] as FilterMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setFilter(m)}
            className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
              filter === m
                ? "bg-teal-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            {m}
          </button>
        ))}
        {data.members.length > 0 && (
          <Select
            className="ml-auto w-auto"
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
          >
            <option value="all">Everyone</option>
            {data.members.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No chores here" subtitle="Add a chore to get started" />
      ) : (
        <div className="space-y-2">
          {filtered.map((chore) => {
              const overdue = isOverdue(chore.dueDate);
              const soon = isDueSoon(chore.dueDate);
              const d = daysUntil(chore.dueDate);
              return (
                <Card key={chore.id} className="flex items-center gap-3">
                  <button
                    onClick={() => completeChore(chore.id)}
                    aria-label="Complete chore"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-slate-300 text-transparent hover:border-teal-500 hover:text-teal-500 dark:border-slate-600"
                  >
                    <Check size={15} />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-slate-800 dark:text-slate-100">{chore.title}</p>
                      <Badge tone="slate">{FREQUENCY_LABELS[chore.frequency]}</Badge>
                      {overdue && <Badge tone="rose">Overdue</Badge>}
                      {!overdue && soon && <Badge tone="amber">Due soon</Badge>}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {formatDateShort(chore.dueDate)} ({d === 0 ? "today" : d > 0 ? `in ${d}d` : `${-d}d ago`})
                      {chore.room ? ` · ${chore.room}` : ""}
                      {chore.assignee ? ` · ` : ""}
                      {chore.assignee && (
                        <span className="inline-flex items-center gap-0.5">
                          <User size={11} className="inline" /> {chore.assignee}
                        </span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => openEdit(chore)}
                    className="text-xs font-medium text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteChore(chore.id)}
                    aria-label="Delete chore"
                    className="text-slate-300 hover:text-rose-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </Card>
              );
            })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit chore" : "Add chore"}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="Title">
            <Input
              autoFocus
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Vacuum living room"
              required
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Assignee">
              <Input
                value={form.assignee}
                onChange={(e) => setForm({ ...form, assignee: e.target.value })}
                placeholder="Who's doing it?"
                list="member-list"
              />
              <datalist id="member-list">
                {data.members.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </Field>
            <Field label="Room / area">
              <Input
                value={form.room}
                onChange={(e) => setForm({ ...form, room: e.target.value })}
                placeholder="e.g. Kitchen"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Due date">
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                required
              />
            </Field>
            <Field label="Repeats">
              <Select
                value={form.frequency}
                onChange={(e) => setForm({ ...form, frequency: e.target.value as Frequency })}
              >
                {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="mt-5 flex justify-between">
            {editingId ? (
              <Button
                type="button"
                variant="danger"
                onClick={() => {
                  deleteChore(editingId);
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
              <Button type="submit">{editingId ? "Save" : "Add chore"}</Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
