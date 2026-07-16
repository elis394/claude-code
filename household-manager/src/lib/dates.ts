import type { Frequency } from "../types";

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function parseIso(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function daysUntil(date: string): number {
  const target = parseIso(date);
  const now = parseIso(todayIso());
  const ms = target.getTime() - now.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

export function formatDate(date: string): string {
  return parseIso(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateShort(date: string): string {
  return parseIso(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function addInterval(date: string, frequency: Frequency): string {
  const d = parseIso(date);
  switch (frequency) {
    case "daily":
      d.setDate(d.getDate() + 1);
      break;
    case "weekly":
      d.setDate(d.getDate() + 7);
      break;
    case "biweekly":
      d.setDate(d.getDate() + 14);
      break;
    case "monthly":
      d.setMonth(d.getMonth() + 1);
      break;
    case "quarterly":
      d.setMonth(d.getMonth() + 3);
      break;
    case "yearly":
      d.setFullYear(d.getFullYear() + 1);
      break;
    case "once":
    default:
      return date;
  }
  return d.toISOString().slice(0, 10);
}

export function isOverdue(date: string): boolean {
  return daysUntil(date) < 0;
}

export function isDueSoon(date: string, withinDays = 7): boolean {
  const d = daysUntil(date);
  return d >= 0 && d <= withinDays;
}

export function currentMonthKey(date = todayIso()): string {
  return date.slice(0, 7); // yyyy-mm
}
