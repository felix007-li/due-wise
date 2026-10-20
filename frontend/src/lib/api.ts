export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fieldErrors: Record<string, string> = {},
  ) {
    super(message);
  }
}
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set("Content-Type", "application/json");
  if (init.method && !["GET", "HEAD"].includes(init.method)) {
    const r = await fetch("/api/v1/auth/csrf", { credentials: "same-origin" });
    if (!r.ok)
      throw new ApiError(
        r.status,
        "SESSION",
        "Unable to verify your session. Refresh and try again.",
      );
    const csrf = await r.json();
    headers.set(csrf.headerName, csrf.token);
  }
  const response = await fetch("/api/v1" + path, {
    ...init,
    headers,
    credentials: "same-origin",
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: "The service could not complete this request.",
    }));
    if (response.status === 401 && path != "/auth/me" && path != "/auth/login")
      window.dispatchEvent(new Event("session-expired"));
    throw new ApiError(
      response.status,
      error.code ?? "REQUEST_FAILED",
      error.message,
      error.fieldErrors,
    );
  }
  return response.status === 204 ? (undefined as T) : response.json();
}
export interface User {
  id: string;
  email: string;
  timezone: string;
  locale: string;
  currency: string;
  rowVersion: number;
}
export interface Bill {
  nextDue: string | null;
  id: string;
  name: string;
  amount: string;
  currency: string;
  firstDue: string;
  recurrence: string;
  everyNWeeks: number;
  monthEndPolicy: string;
  category: string;
  subscription: boolean;
  active: boolean;
  reminderDays: string;
  notes: string;
  rowVersion: number;
}
export interface Item {
  id: string;
  billId: string;
  dueDate: string;
  name: string;
  amount: string;
  currency: string;
  category: string;
  subscription: boolean;
  paid: boolean;
  overdue: boolean;
}
export interface Envelope {
  asOfDate: string;
  calculationVersion: string;
  assumptions: string[];
  warnings: string[];
}
export interface Dashboard extends Envelope {
  roundedCurrencyAmounts: Record<string, string>;
  next7Totals: Record<string, string>;
  dueThisWeek: number;
  dueNextWeek: number;
  overdueCount: number;
  upcoming: Item[];
  overdueLookbackDays: number;
}
export interface Page<T> extends Envelope {
  items: T[];
  total: number;
  page: number;
  size: number;
  duplicateIds?: string[];
}
export interface Insights extends Envelope {
  month: string;
  roundedCurrencyAmounts: Record<string, string>;
  subscriptionTotals: Record<string, string>;
  unpaidTotals: Record<string, string>;
  categoryTotals: Record<string, Record<string, string>>;
  occurrenceCount: number;
  comparison: { available: boolean; reason: string };
}
// Monetary text is formatted from server decimal strings, without conversion to floating point.
export function money(amount: string, currency: string) {
  const [whole, fraction] = amount.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const digits =
    new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency,
    }).resolvedOptions().maximumFractionDigits ?? 2;
  return `${currency} ${grouped}${digits ? "." + (fraction ?? "").padEnd(digits, "0") : ""}`;
}
export function dateLabel(date: string) {
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date + "T12:00:00"));
}
export function localToday(timezone = "America/Toronto") {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
export function monthRange(month: string) {
  const [y, m] = month.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { from: month + "-01", to: `${month}-${last}` };
}
