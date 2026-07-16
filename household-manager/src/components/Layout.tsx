import { useRef, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  ListChecks,
  Receipt,
  Hammer,
  Wallet,
  FolderClock,
  Home,
  Download,
  Upload,
  Menu,
  X,
} from "lucide-react";
import { useAppData } from "../lib/store";
import LockSettings from "./LockSettings";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/chores", label: "Chores", icon: ListChecks },
  { to: "/bills", label: "Bills", icon: Receipt },
  { to: "/renovations", label: "Renovations", icon: Hammer },
  { to: "/financials", label: "Financials", icon: Wallet },
  { to: "/admin", label: "Admin", icon: FolderClock },
];

export default function Layout() {
  const { exportData, importData } = useAppData();
  const [mobileOpen, setMobileOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleExport() {
    const json = exportData();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `household-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const ok = importData(String(reader.result));
      if (!ok) alert("Could not import that file — make sure it's a valid export.");
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  const nav = (
    <>
      <div className="flex items-center gap-2 px-3 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-white">
          <Home size={18} />
        </div>
        <span className="text-base font-semibold text-slate-900 dark:text-slate-100">Homebase</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-2">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto flex flex-col gap-1 border-t border-slate-200 px-2 py-3 dark:border-slate-800">
        <button
          onClick={handleExport}
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Download size={17} />
          Export backup
        </button>
        <button
          onClick={handleImportClick}
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Upload size={17} />
          Import backup
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={handleFileChange}
        />
        <LockSettings />
      </div>
    </>
  );

  return (
    <div className="flex min-h-svh bg-slate-50 dark:bg-slate-950">
      <aside className="hidden w-56 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 md:flex">
        {nav}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="flex w-64 flex-col bg-white dark:bg-slate-900">{nav}</div>
          <div className="flex-1 bg-slate-900/40" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 md:hidden">
          <button onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Homebase</span>
          {mobileOpen && (
            <button className="ml-auto" onClick={() => setMobileOpen(false)} aria-label="Close menu">
              <X size={20} />
            </button>
          )}
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
