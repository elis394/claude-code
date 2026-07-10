import { useMemo, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { useAppData } from "../lib/store";
import type { Transaction, TransactionType } from "../types";
import { currentMonthKey, formatDate, todayIso } from "../lib/dates";
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
import CategoryBreakdown from "../components/CategoryBreakdown";

const EXPENSE_CATEGORIES = ["Groceries", "Dining", "Transport", "Utilities", "Housing", "Health", "Entertainment", "Other"];
const INCOME_CATEGORIES = ["Salary", "Freelance", "Gift", "Refund", "Other"];

const emptyForm = {
  type: "expense" as TransactionType,
  description: "",
  amount: "",
  category: EXPENSE_CATEGORIES[0],
  date: todayIso(),
  account: "",
};

export default function Financials() {
  const { data, addTransaction, updateTransaction, deleteTransaction } = useAppData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [monthFilter, setMonthFilter] = useState(currentMonthKey());

  const monthTx = useMemo(
    () => data.transactions.filter((t) => currentMonthKey(t.date) === monthFilter),
    [data.transactions, monthFilter],
  );

  const income = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expenses = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const net = income - expenses;

  const breakdown = useMemo(() => {
    const map = new Map<string, number>();
    monthTx
      .filter((t) => t.type === "expense")
      .forEach((t) => map.set(t.category, (map.get(t.category) ?? 0) + t.amount));
    return Array.from(map.entries()).map(([category, amount]) => ({ category, amount }));
  }, [monthTx]);

  const months = useMemo(() => {
    const set = new Set<string>([currentMonthKey()]);
    data.transactions.forEach((t) => set.add(currentMonthKey(t.date)));
    return Array.from(set).sort().reverse();
  }, [data.transactions]);

  const sortedTx = useMemo(() => [...monthTx].sort((a, b) => b.date.localeCompare(a.date)), [monthTx]);

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(tx: Transaction) {
    setEditingId(tx.id);
    setForm({
      type: tx.type,
      description: tx.description,
      amount: String(tx.amount),
      category: tx.category,
      date: tx.date,
      account: tx.account ?? "",
    });
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.description.trim()) return;
    const payload = {
      type: form.type,
      description: form.description.trim(),
      amount: Math.abs(Number(form.amount)) || 0,
      category: form.category,
      date: form.date,
      account: form.account.trim() || undefined,
    };
    if (editingId) {
      updateTransaction(editingId, payload);
    } else {
      addTransaction(payload);
    }
    setModalOpen(false);
  }

  const categoryOptions = form.type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <div>
      <PageHeader
        title="Financials"
        subtitle="Household income and spending"
        action={
          <Button onClick={openAdd}>
            <Plus size={16} /> Add transaction
          </Button>
        }
      />

      <div className="mb-4">
        <Select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="w-auto">
          {months.map((m) => (
            <option key={m} value={m}>
              {new Date(`${m}-01T00:00:00`).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
            </option>
          ))}
        </Select>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3">
        <StatCard label="Income" value={formatCurrency(income)} tone="green" />
        <StatCard label="Expenses" value={formatCurrency(expenses)} tone="rose" />
        <StatCard label="Net" value={formatCurrency(net)} tone={net >= 0 ? "teal" : "rose"} />
      </div>

      <Card className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Spending by category</h2>
        <CategoryBreakdown data={breakdown} />
      </Card>

      {sortedTx.length === 0 ? (
        <EmptyState title="No transactions this month" subtitle="Add income or an expense" />
      ) : (
        <div className="space-y-2">
          {sortedTx.map((tx) => (
            <Card key={tx.id} className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-slate-800 dark:text-slate-100">{tx.description}</p>
                  <Badge tone="slate">{tx.category}</Badge>
                </div>
                <p className="mt-0.5 text-xs text-slate-400">
                  {formatDate(tx.date)}
                  {tx.account ? ` · ${tx.account}` : ""}
                </p>
              </div>
              <p
                className={`w-24 shrink-0 text-right font-semibold ${
                  tx.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-700 dark:text-slate-200"
                }`}
              >
                {tx.type === "income" ? "+" : "-"}
                {formatCurrency(tx.amount)}
              </p>
              <button
                onClick={() => openEdit(tx)}
                className="text-xs font-medium text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                Edit
              </button>
              <button onClick={() => deleteTransaction(tx.id)} aria-label="Delete transaction" className="text-slate-300 hover:text-rose-500">
                <Trash2 size={16} />
              </button>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit transaction" : "Add transaction"}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-2">
            {(["expense", "income"] as TransactionType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm({ ...form, type: t, category: t === "expense" ? EXPENSE_CATEGORIES[0] : INCOME_CATEGORIES[0] })}
                className={`flex-1 rounded-lg py-2 text-sm font-medium capitalize transition-colors ${
                  form.type === t
                    ? "bg-teal-600 text-white"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <Field label="Description">
            <Input
              autoFocus
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="e.g. Weekly groceries"
              required
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Amount">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0.00"
                required
              />
            </Field>
            <Field label="Category">
              <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date">
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </Field>
            <Field label="Account (optional)">
              <Input value={form.account} onChange={(e) => setForm({ ...form, account: e.target.value })} />
            </Field>
          </div>
          <div className="mt-5 flex justify-between">
            {editingId ? (
              <Button
                type="button"
                variant="danger"
                onClick={() => {
                  deleteTransaction(editingId);
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
              <Button type="submit">{editingId ? "Save" : "Add"}</Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
