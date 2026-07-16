import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  AdminItem,
  AppData,
  Bill,
  Chore,
  RenovationProject,
  RenovationTask,
  Transaction,
} from "../types";
import { emptyAppData } from "../types";
import { addInterval, todayIso } from "./dates";
import { makeId } from "./id";
import { blobToDataUrl, dataUrlToBlob, deleteAttachment, getAttachmentBlob, putAttachmentBlob } from "./attachments";

const STORAGE_KEY = "household-manager-data";

function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...emptyAppData };
    const parsed = JSON.parse(raw);
    return { ...emptyAppData, ...parsed };
  } catch {
    return { ...emptyAppData };
  }
}

function collectAttachmentIds(data: AppData): string[] {
  return [
    ...data.chores.map((c) => c.attachment?.id),
    ...data.bills.map((b) => b.attachment?.id),
    ...data.renovations.map((r) => r.attachment?.id),
    ...data.transactions.map((t) => t.attachment?.id),
    ...data.admin.map((a) => a.attachment?.id),
  ].filter((id): id is string => !!id);
}

interface AppDataContextValue {
  data: AppData;
  addMember: (name: string) => void;
  removeMember: (name: string) => void;

  addChore: (chore: Omit<Chore, "id">) => void;
  updateChore: (id: string, patch: Partial<Chore>) => void;
  deleteChore: (id: string) => void;
  completeChore: (id: string) => void;

  addBill: (bill: Omit<Bill, "id">) => void;
  updateBill: (id: string, patch: Partial<Bill>) => void;
  deleteBill: (id: string) => void;
  toggleBillPaid: (id: string) => void;

  addRenovation: (project: Omit<RenovationProject, "id" | "tasks">) => void;
  updateRenovation: (id: string, patch: Partial<RenovationProject>) => void;
  deleteRenovation: (id: string) => void;
  addRenovationTask: (projectId: string, task: Omit<RenovationTask, "id">) => void;
  toggleRenovationTask: (projectId: string, taskId: string) => void;
  deleteRenovationTask: (projectId: string, taskId: string) => void;

  addTransaction: (tx: Omit<Transaction, "id">) => void;
  updateTransaction: (id: string, patch: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  addAdminItem: (item: Omit<AdminItem, "id">) => void;
  updateAdminItem: (id: string, patch: Partial<AdminItem>) => void;
  deleteAdminItem: (id: string) => void;
  completeAdminItem: (id: string) => void;

  exportData: () => Promise<string>;
  importData: (json: string) => Promise<boolean>;
  resetData: () => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(load);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const addMember = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setData((d) => (d.members.includes(trimmed) ? d : { ...d, members: [...d.members, trimmed] }));
  }, []);

  const removeMember = useCallback((name: string) => {
    setData((d) => ({ ...d, members: d.members.filter((m) => m !== name) }));
  }, []);

  const addChore = useCallback((chore: Omit<Chore, "id">) => {
    setData((d) => ({ ...d, chores: [...d.chores, { ...chore, id: makeId() }] }));
  }, []);

  const updateChore = useCallback((id: string, patch: Partial<Chore>) => {
    setData((d) => ({
      ...d,
      chores: d.chores.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  }, []);

  const deleteChore = useCallback((id: string) => {
    setData((d) => {
      const chore = d.chores.find((c) => c.id === id);
      if (chore?.attachment) deleteAttachment(chore.attachment.id);
      return { ...d, chores: d.chores.filter((c) => c.id !== id) };
    });
  }, []);

  const completeChore = useCallback((id: string) => {
    setData((d) => {
      const chore = d.chores.find((c) => c.id === id);
      if (!chore) return d;
      if (chore.frequency === "once") {
        if (chore.attachment) deleteAttachment(chore.attachment.id);
        return { ...d, chores: d.chores.filter((c) => c.id !== id) };
      }
      return {
        ...d,
        chores: d.chores.map((c) =>
          c.id === id
            ? { ...c, dueDate: addInterval(c.dueDate, c.frequency), lastCompletedDate: todayIso() }
            : c,
        ),
      };
    });
  }, []);

  const addBill = useCallback((bill: Omit<Bill, "id">) => {
    setData((d) => ({ ...d, bills: [...d.bills, { ...bill, id: makeId() }] }));
  }, []);

  const updateBill = useCallback((id: string, patch: Partial<Bill>) => {
    setData((d) => ({ ...d, bills: d.bills.map((b) => (b.id === id ? { ...b, ...patch } : b)) }));
  }, []);

  const deleteBill = useCallback((id: string) => {
    setData((d) => {
      const bill = d.bills.find((b) => b.id === id);
      if (bill?.attachment) deleteAttachment(bill.attachment.id);
      return { ...d, bills: d.bills.filter((b) => b.id !== id) };
    });
  }, []);

  const toggleBillPaid = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      bills: d.bills.map((b) => {
        if (b.id !== id) return b;
        if (!b.paid && b.frequency !== "once") {
          return { ...b, paid: false, dueDate: addInterval(b.dueDate, b.frequency) };
        }
        return { ...b, paid: !b.paid };
      }),
    }));
  }, []);

  const addRenovation = useCallback((project: Omit<RenovationProject, "id" | "tasks">) => {
    setData((d) => ({
      ...d,
      renovations: [...d.renovations, { ...project, id: makeId(), tasks: [] }],
    }));
  }, []);

  const updateRenovation = useCallback((id: string, patch: Partial<RenovationProject>) => {
    setData((d) => ({
      ...d,
      renovations: d.renovations.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));
  }, []);

  const deleteRenovation = useCallback((id: string) => {
    setData((d) => {
      const project = d.renovations.find((r) => r.id === id);
      if (project?.attachment) deleteAttachment(project.attachment.id);
      return { ...d, renovations: d.renovations.filter((r) => r.id !== id) };
    });
  }, []);

  const addRenovationTask = useCallback((projectId: string, task: Omit<RenovationTask, "id">) => {
    setData((d) => ({
      ...d,
      renovations: d.renovations.map((r) =>
        r.id === projectId ? { ...r, tasks: [...r.tasks, { ...task, id: makeId() }] } : r,
      ),
    }));
  }, []);

  const toggleRenovationTask = useCallback((projectId: string, taskId: string) => {
    setData((d) => ({
      ...d,
      renovations: d.renovations.map((r) =>
        r.id === projectId
          ? {
              ...r,
              tasks: r.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)),
            }
          : r,
      ),
    }));
  }, []);

  const deleteRenovationTask = useCallback((projectId: string, taskId: string) => {
    setData((d) => ({
      ...d,
      renovations: d.renovations.map((r) =>
        r.id === projectId ? { ...r, tasks: r.tasks.filter((t) => t.id !== taskId) } : r,
      ),
    }));
  }, []);

  const addTransaction = useCallback((tx: Omit<Transaction, "id">) => {
    setData((d) => ({ ...d, transactions: [...d.transactions, { ...tx, id: makeId() }] }));
  }, []);

  const updateTransaction = useCallback((id: string, patch: Partial<Transaction>) => {
    setData((d) => ({
      ...d,
      transactions: d.transactions.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setData((d) => {
      const tx = d.transactions.find((t) => t.id === id);
      if (tx?.attachment) deleteAttachment(tx.attachment.id);
      return { ...d, transactions: d.transactions.filter((t) => t.id !== id) };
    });
  }, []);

  const addAdminItem = useCallback((item: Omit<AdminItem, "id">) => {
    setData((d) => ({ ...d, admin: [...d.admin, { ...item, id: makeId() }] }));
  }, []);

  const updateAdminItem = useCallback((id: string, patch: Partial<AdminItem>) => {
    setData((d) => ({ ...d, admin: d.admin.map((a) => (a.id === id ? { ...a, ...patch } : a)) }));
  }, []);

  const deleteAdminItem = useCallback((id: string) => {
    setData((d) => {
      const item = d.admin.find((a) => a.id === id);
      if (item?.attachment) deleteAttachment(item.attachment.id);
      return { ...d, admin: d.admin.filter((a) => a.id !== id) };
    });
  }, []);

  const completeAdminItem = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      admin: d.admin.map((a) => {
        if (a.id !== id) return a;
        if (a.frequency && a.frequency !== "once" && a.dueDate) {
          return { ...a, dueDate: addInterval(a.dueDate, a.frequency) };
        }
        return { ...a, status: "done" };
      }),
    }));
  }, []);

  const exportData = useCallback(async () => {
    const attachments: Record<string, string> = {};
    for (const id of collectAttachmentIds(data)) {
      const blob = await getAttachmentBlob(id);
      if (blob) attachments[id] = await blobToDataUrl(blob);
    }
    return JSON.stringify({ ...data, __attachments: attachments }, null, 2);
  }, [data]);

  const importData = useCallback(async (json: string) => {
    try {
      const parsed = JSON.parse(json);
      const { __attachments, ...rest } = parsed;
      setData({ ...emptyAppData, ...rest });
      if (__attachments) {
        for (const [id, dataUrl] of Object.entries(__attachments as Record<string, string>)) {
          await putAttachmentBlob(id, await dataUrlToBlob(dataUrl));
        }
      }
      return true;
    } catch {
      return false;
    }
  }, []);

  const resetData = useCallback(() => {
    setData({ ...emptyAppData });
  }, []);

  const value = useMemo<AppDataContextValue>(
    () => ({
      data,
      addMember,
      removeMember,
      addChore,
      updateChore,
      deleteChore,
      completeChore,
      addBill,
      updateBill,
      deleteBill,
      toggleBillPaid,
      addRenovation,
      updateRenovation,
      deleteRenovation,
      addRenovationTask,
      toggleRenovationTask,
      deleteRenovationTask,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addAdminItem,
      updateAdminItem,
      deleteAdminItem,
      completeAdminItem,
      exportData,
      importData,
      resetData,
    }),
    [
      data,
      addMember,
      removeMember,
      addChore,
      updateChore,
      deleteChore,
      completeChore,
      addBill,
      updateBill,
      deleteBill,
      toggleBillPaid,
      addRenovation,
      updateRenovation,
      deleteRenovation,
      addRenovationTask,
      toggleRenovationTask,
      deleteRenovationTask,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addAdminItem,
      updateAdminItem,
      deleteAdminItem,
      completeAdminItem,
      exportData,
      importData,
      resetData,
    ],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
