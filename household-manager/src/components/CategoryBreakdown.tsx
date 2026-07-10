import { formatCurrency } from "./ui";

// Categorical palette (validated), fixed order — see dataviz skill reference palette.
const CATEGORY_COLORS = [
  { light: "#2a78d6", dark: "#3987e5" },
  { light: "#1baf7a", dark: "#199e70" },
  { light: "#eda100", dark: "#c98500" },
  { light: "#008300", dark: "#008300" },
  { light: "#4a3aa7", dark: "#9085e9" },
  { light: "#e34948", dark: "#e66767" },
  { light: "#e87ba4", dark: "#d55181" },
  { light: "#eb6834", dark: "#d95926" },
];

export default function CategoryBreakdown({ data }: { data: { category: string; amount: number }[] }) {
  const sorted = [...data].sort((a, b) => b.amount - a.amount);
  const max = Math.max(...sorted.map((d) => d.amount), 1);

  if (sorted.length === 0) {
    return <p className="text-sm text-slate-400">No expenses recorded yet.</p>;
  }

  return (
    <div className="space-y-2.5">
      {sorted.map((row, i) => {
        const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
        const pct = (row.amount / max) * 100;
        return (
          <div key={row.category} className="flex items-center gap-3">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: `light-dark(${color.light}, ${color.dark})` }}
            />
            <span className="w-28 shrink-0 truncate text-sm text-slate-600 dark:text-slate-300">
              {row.category}
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  backgroundColor: `light-dark(${color.light}, ${color.dark})`,
                }}
              />
            </div>
            <span className="w-20 shrink-0 text-right text-sm font-medium text-slate-700 dark:text-slate-200">
              {formatCurrency(row.amount)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
