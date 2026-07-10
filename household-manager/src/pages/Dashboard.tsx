import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Receipt, ListChecks, FolderClock, Hammer } from "lucide-react";
import { useAppData } from "../lib/store";
import { currentMonthKey, daysUntil, formatDateShort, isOverdue } from "../lib/dates";
import { Badge, Card, EmptyState, PageHeader, StatCard, formatCurrency } from "../components/ui";

interface TimelineItem {
  id: string;
  label: string;
  dueDate: string;
  kind: "chore" | "bill" | "admin";
  href: string;
}

export default function Dashboard() {
  const { data } = useAppData();

  const overdueBills = data.bills.filter((b) => !b.paid && isOverdue(b.dueDate));
  const dueSoonBills = data.bills.filter((b) => !b.paid && !isOverdue(b.dueDate) && daysUntil(b.dueDate) <= 7);
  const overdueChores = data.chores.filter((c) => isOverdue(c.dueDate));
  const activeProjects = data.renovations.filter((r) => r.status === "in-progress" || r.status === "planning");
  const overdueAdmin = data.admin.filter((a) => a.status === "active" && a.dueDate && isOverdue(a.dueDate));

  const month = currentMonthKey();
  const monthTx = data.transactions.filter((t) => currentMonthKey(t.date) === month);
  const income = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expenses = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  const timeline = useMemo<TimelineItem[]>(() => {
    const items: TimelineItem[] = [];
    data.bills
      .filter((b) => !b.paid && daysUntil(b.dueDate) <= 14)
      .forEach((b) => items.push({ id: b.id, label: `${b.name} · ${formatCurrency(b.amount)}`, dueDate: b.dueDate, kind: "bill", href: "/bills" }));
    data.chores
      .filter((c) => daysUntil(c.dueDate) <= 14)
      .forEach((c) => items.push({ id: c.id, label: c.title, dueDate: c.dueDate, kind: "chore", href: "/chores" }));
    data.admin
      .filter((a) => a.status === "active" && a.dueDate && daysUntil(a.dueDate) <= 14)
      .forEach((a) => items.push({ id: a.id, label: a.title, dueDate: a.dueDate!, kind: "admin", href: "/admin" }));
    return items.sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 10);
  }, [data]);

  const kindMeta: Record<TimelineItem["kind"], { icon: typeof Receipt }> = {
    bill: { icon: Receipt },
    chore: { icon: ListChecks },
    admin: { icon: FolderClock },
  };

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Everything about the house, at a glance" />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Bills due/overdue"
          value={overdueBills.length + dueSoonBills.length}
          tone={overdueBills.length ? "rose" : dueSoonBills.length ? "amber" : "slate"}
          hint={overdueBills.length ? `${overdueBills.length} overdue` : "next 7 days"}
        />
        <StatCard
          label="Chores overdue"
          value={overdueChores.length}
          tone={overdueChores.length ? "rose" : "slate"}
        />
        <StatCard label="Active projects" value={activeProjects.length} tone="teal" />
        <StatCard
          label="This month's net"
          value={formatCurrency(income - expenses)}
          tone={income - expenses >= 0 ? "green" : "rose"}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Coming up</h2>
          {timeline.length === 0 ? (
            <EmptyState title="Nothing due in the next two weeks" />
          ) : (
            <ul className="space-y-2">
              {timeline.map((item) => {
                const { icon: Icon } = kindMeta[item.kind];
                const d = daysUntil(item.dueDate);
                const overdue = d < 0;
                return (
                  <li key={`${item.kind}-${item.id}`}>
                    <Link
                      to={item.href}
                      className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        <Icon size={14} />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-slate-700 dark:text-slate-200">
                        {item.label}
                      </span>
                      <span className="shrink-0 text-xs text-slate-400">{formatDateShort(item.dueDate)}</span>
                      {overdue && <Badge tone="rose">Overdue</Badge>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Renovation projects</h2>
          {activeProjects.length === 0 ? (
            <EmptyState title="No active projects" />
          ) : (
            <ul className="space-y-3">
              {activeProjects.map((p) => (
                <li key={p.id}>
                  <Link to="/renovations" className="block rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/60">
                    <div className="flex items-center gap-2">
                      <Hammer size={14} className="text-slate-400" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{p.name}</span>
                    </div>
                    <p className="ml-6 text-xs text-slate-400">
                      {p.tasks.filter((t) => t.done).length}/{p.tasks.length} tasks done
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {overdueAdmin.length > 0 && (
        <Card className="mt-4 border-rose-200 dark:border-rose-900">
          <h2 className="mb-2 text-sm font-semibold text-rose-700 dark:text-rose-400">Overdue admin items</h2>
          <ul className="space-y-1">
            {overdueAdmin.map((a) => (
              <li key={a.id}>
                <Link to="/admin" className="text-sm text-slate-600 hover:underline dark:text-slate-300">
                  {a.title} — due {formatDateShort(a.dueDate!)}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
