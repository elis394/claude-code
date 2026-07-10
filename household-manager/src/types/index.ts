export type Frequency =
  | "once"
  | "daily"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "quarterly"
  | "yearly";

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  once: "One-time",
  daily: "Daily",
  weekly: "Weekly",
  biweekly: "Every 2 weeks",
  monthly: "Monthly",
  quarterly: "Every 3 months",
  yearly: "Yearly",
};

export interface Chore {
  id: string;
  title: string;
  notes?: string;
  assignee?: string;
  room?: string;
  frequency: Frequency;
  dueDate: string; // ISO date (yyyy-mm-dd)
  lastCompletedDate?: string;
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  category: string;
  payee?: string;
  dueDate: string; // ISO date
  frequency: Frequency;
  autopay: boolean;
  paid: boolean;
  notes?: string;
}

export type RenovationStatus = "planning" | "in-progress" | "on-hold" | "completed";

export interface RenovationTask {
  id: string;
  title: string;
  done: boolean;
  cost?: number;
}

export interface RenovationProject {
  id: string;
  name: string;
  description?: string;
  status: RenovationStatus;
  budget: number;
  startDate?: string;
  targetDate?: string;
  tasks: RenovationTask[];
}

export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  date: string; // ISO date
  description: string;
  amount: number; // always positive; sign implied by type
  type: TransactionType;
  category: string;
  account?: string;
}

export type AdminStatus = "active" | "done";

export interface AdminItem {
  id: string;
  title: string;
  category: string;
  dueDate?: string;
  frequency?: Frequency;
  status: AdminStatus;
  notes?: string;
}

export interface AppData {
  members: string[];
  chores: Chore[];
  bills: Bill[];
  renovations: RenovationProject[];
  transactions: Transaction[];
  admin: AdminItem[];
}

export const emptyAppData: AppData = {
  members: [],
  chores: [],
  bills: [],
  renovations: [],
  transactions: [],
  admin: [],
};
