import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { useAppData } from "../lib/store";
import type { Attachment, RenovationProject, RenovationStatus } from "../types";
import { formatDate } from "../lib/dates";
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
  ProgressBar,
  formatCurrency,
} from "../components/ui";
import { AttachmentBadge, AttachmentField } from "../components/Attachment";
import { deleteAttachment, stripExtension } from "../lib/attachments";
import { usePendingAttachment } from "../lib/usePendingAttachment";

const STATUS_LABELS: Record<RenovationStatus, string> = {
  planning: "Planning",
  "in-progress": "In progress",
  "on-hold": "On hold",
  completed: "Completed",
};

const STATUS_TONE: Record<RenovationStatus, "slate" | "green" | "amber" | "rose" | "teal"> = {
  planning: "slate",
  "in-progress": "teal",
  "on-hold": "amber",
  completed: "green",
};

const emptyForm = {
  name: "",
  description: "",
  status: "planning" as RenovationStatus,
  budget: "",
  startDate: "",
  targetDate: "",
};

export default function Renovations() {
  const {
    data,
    addRenovation,
    updateRenovation,
    deleteRenovation,
    addRenovationTask,
    toggleRenovationTask,
    deleteRenovationTask,
  } = useAppData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [attachment, setAttachment] = useState<Attachment | undefined>(undefined);
  const [taskDrafts, setTaskDrafts] = useState<Record<string, string>>({});
  const [taskCostDrafts, setTaskCostDrafts] = useState<Record<string, string>>({});

  usePendingAttachment((meta) => {
    setEditingId(null);
    setForm({ ...emptyForm, name: stripExtension(meta.name) });
    setAttachment(meta);
    setModalOpen(true);
  });

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setAttachment(undefined);
    setModalOpen(true);
  }

  function openEdit(project: RenovationProject) {
    setEditingId(project.id);
    setForm({
      name: project.name,
      description: project.description ?? "",
      status: project.status,
      budget: String(project.budget),
      startDate: project.startDate ?? "",
      targetDate: project.targetDate ?? "",
    });
    setAttachment(project.attachment);
    setModalOpen(true);
  }

  async function handleRemoveAttachment() {
    if (attachment) await deleteAttachment(attachment.id);
    setAttachment(undefined);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      status: form.status,
      budget: Number(form.budget) || 0,
      startDate: form.startDate || undefined,
      targetDate: form.targetDate || undefined,
      attachment,
    };
    if (editingId) {
      updateRenovation(editingId, payload);
    } else {
      addRenovation(payload);
    }
    setModalOpen(false);
  }

  function handleAddTask(projectId: string) {
    const title = (taskDrafts[projectId] ?? "").trim();
    if (!title) return;
    const cost = Number(taskCostDrafts[projectId]) || undefined;
    addRenovationTask(projectId, { title, done: false, cost });
    setTaskDrafts((d) => ({ ...d, [projectId]: "" }));
    setTaskCostDrafts((d) => ({ ...d, [projectId]: "" }));
  }

  return (
    <div>
      <PageHeader
        title="Renovations"
        subtitle="Plan projects, track budgets and checklists"
        action={
          <Button onClick={openAdd}>
            <Plus size={16} /> Add project
          </Button>
        }
      />

      {data.renovations.length === 0 ? (
        <EmptyState title="No renovation projects yet" subtitle="Add one to start planning" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.renovations.map((project) => {
            const spent = project.tasks.reduce((s, t) => s + (t.done ? t.cost ?? 0 : 0), 0);
            const doneCount = project.tasks.filter((t) => t.done).length;
            const progress = project.tasks.length ? (doneCount / project.tasks.length) * 100 : 0;
            const overBudget = project.budget > 0 && spent > project.budget;

            return (
              <Card key={project.id} className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{project.name}</p>
                    {project.description && (
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{project.description}</p>
                    )}
                    {project.attachment && (
                      <div className="mt-1">
                        <AttachmentBadge attachment={project.attachment} />
                      </div>
                    )}
                  </div>
                  <Badge tone={STATUS_TONE[project.status]}>{STATUS_LABELS[project.status]}</Badge>
                </div>

                {(project.startDate || project.targetDate) && (
                  <p className="text-xs text-slate-400">
                    {project.startDate ? formatDate(project.startDate) : "—"} →{" "}
                    {project.targetDate ? formatDate(project.targetDate) : "—"}
                  </p>
                )}

                {project.budget > 0 && (
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className={overBudget ? "font-medium text-rose-600" : "text-slate-500 dark:text-slate-400"}>
                        {formatCurrency(spent)} of {formatCurrency(project.budget)} spent
                      </span>
                      {overBudget && <Badge tone="rose">Over budget</Badge>}
                    </div>
                    <ProgressBar value={project.budget ? (spent / project.budget) * 100 : 0} />
                  </div>
                )}

                <div>
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>
                      Checklist ({doneCount}/{project.tasks.length})
                    </span>
                  </div>
                  <ProgressBar value={progress} />
                  <ul className="mt-2 space-y-1.5">
                    {project.tasks.map((task) => (
                      <li key={task.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={task.done}
                          onChange={() => toggleRenovationTask(project.id, task.id)}
                          className="h-3.5 w-3.5 accent-teal-600"
                        />
                        <span className={task.done ? "flex-1 text-slate-400 line-through" : "flex-1 text-slate-700 dark:text-slate-200"}>
                          {task.title}
                        </span>
                        {task.cost ? (
                          <span className="text-xs text-slate-400">{formatCurrency(task.cost)}</span>
                        ) : null}
                        <button
                          onClick={() => deleteRenovationTask(project.id, task.id)}
                          aria-label="Remove task"
                          className="text-slate-300 hover:text-rose-500"
                        >
                          <X size={13} />
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-2 flex gap-2">
                    <Input
                      placeholder="Add a task..."
                      value={taskDrafts[project.id] ?? ""}
                      onChange={(e) => setTaskDrafts((d) => ({ ...d, [project.id]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTask(project.id);
                        }
                      }}
                    />
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Cost"
                      className="w-24"
                      value={taskCostDrafts[project.id] ?? ""}
                      onChange={(e) => setTaskCostDrafts((d) => ({ ...d, [project.id]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTask(project.id);
                        }
                      }}
                    />
                    <Button type="button" variant="secondary" onClick={() => handleAddTask(project.id)}>
                      Add
                    </Button>
                  </div>
                </div>

                <div className="mt-1 flex justify-end gap-3 border-t border-slate-100 pt-2 text-xs dark:border-slate-800">
                  <button
                    onClick={() => openEdit(project)}
                    className="font-medium text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteRenovation(project.id)}
                    className="flex items-center gap-1 font-medium text-slate-400 hover:text-rose-500"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit project" : "Add project"}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="Project name">
            <Input
              autoFocus
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Kitchen remodel"
              required
            />
          </Field>
          {attachment && <AttachmentField attachment={attachment} onRemove={handleRemoveAttachment} />}
          <Field label="Description (optional)">
            <Textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Status">
              <Select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as RenovationStatus })}
              >
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Budget">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
                placeholder="0.00"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start date">
              <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </Field>
            <Field label="Target date">
              <Input type="date" value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} />
            </Field>
          </div>
          <div className="mt-5 flex justify-between">
            {editingId ? (
              <Button
                type="button"
                variant="danger"
                onClick={() => {
                  deleteRenovation(editingId);
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
              <Button type="submit">{editingId ? "Save" : "Add project"}</Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
