import { useMemo, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { useAppData } from "../lib/store";
import type { Bill, Frequency } from "../types";
import { FREQUENCY_LABELS } from "../types";
import { daysUntil, formatDateShort, isDueSoon, isOverdue, todayIso } from "../lib/dates";
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
  StatCard,
  formatCurrency,
} from "../components/ui";

const CATEGORIES = ["Housing", "Utilities", "Insurance", "Subscription", "Loan", "Other"];

const emptyForm = {
  name: "",
  amount: "",
  category: CATEGORIES[0],
  payee: "",
  dueDate: todayIso(),
  frequency: "monthly" as Frequency,
  autopay: false,
  notes: "",
};

export default function Bills() {
  const { data, addBill, updateBill, deleteBill, toggleBillPaid } = useAppData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showPaid, setShowPaid] = useState(false);

  const sorted = useMemo(() => [...data.bills].sort((a, b) => a.dueDate.localeCompare(b.dueDate)), [data.bills]);
  const visible = sorted.filter((b) => showPaid || !b.paid);

  const monthlyTotal = useMemo(() => {
    return data.bills.reduce((sum, b) => {
      const monthlyEquivalent: Record<Frequency, number> = {
        once: 0,
        daily: b.amount * 30,
        weekly: b.amount * 4.33,
        biweekly: b.amount * 2.17,
        monthly: b.amount,
        quarterly: b.amount / 3,
        yearly: b.amount / 12,
      };
      return sum + monthlyEquivalent[b.frequency];
    }, 0);
  }, [data.bills]);

  const overdueCount = data.bills.filter((b) => !b.paid && isOverdue(b.dueDate)).length;
  const dueSoonCount = data.bills.filter((b) => !b.paid && isDueSoon(b.dueDate)).length;

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(bill: Bill) {
    setEditingId(bill.id);
    setForm({
      name: bill.name,
      amount: String(bill.amount),
      category: bill.category,
      payee: bill.payee ?? "",
      dueDate: bill.dueDate,
      frequency: bill.frequency,
      autopay: bill.autopay,
      notes: bill.notes ?? "",
    });
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    const payload = {
      name: form.name.trim(),
      amount: Number(form.amount) || 0,
      category: form.category,
      payee: form.payee.trim() || undefined,
      dueDate: form.dueDate,
      frequency: form.frequency,
      autopay: form.autopay,
      notes: form.notes.trim() || undefined,
    };
    if (editingId) {
      updateBill(editingId, payload);
    } else {
      addBill({ ...payload, paid: false });
    }
    setModalOpen(false);
  }

  return (
    <div>
      <PageHeader
        title="Bills"
        subtitle="Track what's due and what's paid"
        action={
          <Button onClick={openAdd}>
            <Plus size={16} /> Add bill
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Est. monthly total" value={formatCurrency(monthlyTotal)} tone="teal" />
        <StatCard label="Overdue" value={overdueCount} tone={overdueCount ? "rose" : "slate"} />
        <StatCard label="Due within 7 days" value={dueSoonCount} tone={dueSoonCount ? "amber" : "slate"} />
      </div>

      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={() => setShowPaid((s) => !s)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            showPaid
              ? "bg-teal-600 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
          }`}
        >
          {showPaid ? "Showing paid bills" : "Hiding paid bills"}
        </button>
      </div>

      {visible.length === 0 ? (
        <EmptyState title="No bills to show" subtitle="Add a bill to start tracking" />
      ) : (
        <div className="space-y-2">
          {visible.map((bill) => {
            const overdue = !bill.paid && isOverdue(bill.dueDate);
            const soon = !bill.paid && isDueSoon(bill.dueDate);
            const d = daysUntil(bill.dueDate);
            return (
              <Card key={bill.id} className="flex items-center gap-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={bill.paid}
                    onChange={() => toggleBillPaid(bill.id)}
                    className="h-4 w-4 accent-teal-600"
                  />
                </label>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={`font-medium ${bill.paid ? "text-slate-400 line-through" : "text-slate-800 dark:text-slate-100"}`}>
                      {bill.name}
                    </p>
                    <Badge tone="slate">{bill.category}</Badge>
                    {bill.autopay && <Badge tone="teal">Autopay</Badge>}
                    {overdue && <Badge tone="rose">Overdue</Badge>}
                    {!overdue && soon && <Badge tone="amber">Due soon</Badge>}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {formatDateShort(bill.dueDate)} ({d === 0 ? "today" : d > 0 ? `in ${d}d` : `${-d}d ago`}) ·{" "}
                    {FREQUENCY_LABELS[bill.frequency]}
                    {bill.payee ? ` · ${bill.payee}` : ""}
                  </p>
                </div>
                <p className="w-20 shrink-0 text-right font-semibold text-slate-700 dark:text-slate-200">
                  {formatCurrency(bill.amount)}
                </p>
                <button
                  onClick={() => openEdit(bill)}
                  className="text-xs font-medium text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  Edit
                </button>
                <button onClick={() => deleteBill(bill.id)} aria-label="Delete bill" className="text-slate-300 hover:text-rose-500">
                  <Trash2 size={16} />
                </button>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit bill" : "Add bill"}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="Name">
            <Input
              autoFocus
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Electric bill"
              required
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Amount">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0.00"
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
          <Field label="Payee / account (optional)">
            <Input value={form.payee} onChange={(e) => setForm({ ...form, payee: e.target.value })} />
          </Field>
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={form.autopay}
              onChange={(e) => setForm({ ...form, autopay: e.target.checked })}
              className="h-4 w-4 accent-teal-600"
            />
            On autopay
          </label>
          <div className="mt-5 flex justify-between">
            {editingId ? (
              <Button
                type="button"
                variant="danger"
                onClick={() => {
                  deleteBill(editingId);
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
              <Button type="submit">{editingId ? "Save" : "Add bill"}</Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
