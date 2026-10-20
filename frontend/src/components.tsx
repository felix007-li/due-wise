import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Check,
  Home,
  Wifi,
  Zap,
  Tv,
  Receipt,
  Leaf,
  CalendarDays,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, dateLabel, money, type Envelope, type Item } from "./lib/api";
import type { ReactNode } from "react";
export function BillIcon({ category }: { category: string }) {
  const Icon =
    (
      {
        Housing: Home,
        Utilities: Zap,
        Internet: Wifi,
        Entertainment: Tv,
      } as Record<string, typeof Home>
    )[category] ?? Receipt;
  return (
    <span className={"bill-icon " + category.toLowerCase()}>
      <Icon size={21} aria-hidden="true" />
    </span>
  );
}
export function Heading({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
      </div>
      {children}
    </div>
  );
}
export function ErrorState({
  error,
  retry,
}: {
  error: Error;
  retry: () => void;
}) {
  return (
    <div className="state error" role="alert">
      <AlertCircle aria-hidden="true" />
      <h2>We couldn’t load this</h2>
      <p>{error.message}</p>
      <button onClick={retry}>Try again</button>
    </div>
  );
}
export function Loading() {
  return (
    <div role="status" aria-label="Loading" className="skeletons">
      {[1, 2, 3].map((i) => (
        <div key={i} className="skeleton" />
      ))}
      <span className="sr-only">Loading your information…</span>
    </div>
  );
}
export function Empty({
  title = "A little setup. A lot more calm.",
  text = "Add your first bill to see what’s coming up.",
}: {
  title?: string;
  text?: string;
}) {
  return (
    <div className="state">
      <span className="empty-icon">
        <Leaf size={32} aria-hidden="true" />
      </span>
      <h2>{title}</h2>
      <p>{text}</p>
      <Link className="button" to="/bills/new">
        Add a bill <ArrowRight size={16} />
      </Link>
    </div>
  );
}
export function Totals({
  values,
  empty = "No commitments yet",
}: {
  values: Record<string, string>;
  empty?: string;
}) {
  return (
    <>
      {Object.entries(values).length ? (
        Object.entries(values).map(([c, a]) => (
          <span className="money-total" key={c}>
            {money(a, c)}
          </span>
        ))
      ) : (
        <span className="zero">{empty}</span>
      )}
    </>
  );
}
export function Assumptions({ data }: { data: Envelope }) {
  return (
    <details className="assumptions">
      <summary>How these numbers are calculated</summary>
      <p>
        As of {dateLabel(data.asOfDate)} · {data.calculationVersion}
      </p>
      <ul>
        {data.assumptions.map((a) => (
          <li key={a}>{a}</li>
        ))}
      </ul>
      {data.warnings.map((w) => (
        <p key={w}>{w}</p>
      ))}
    </details>
  );
}
export function OccurrenceRow({
  item,
  onNotice,
}: {
  item: Item;
  onNotice?: (message: string) => void;
}) {
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: () =>
      api<void>(`/occurrences/${item.id}/${item.paid ? "undo" : "pay"}`, {
        method: "POST",
      }),
    onSuccess: () => {
      client.invalidateQueries();
      onNotice?.(item.paid ? "Payment record removed." : "Payment recorded.");
    },
  });
  return (
    <div className="occurrence">
      <BillIcon category={item.category} />
      <Link className="row-name" to={"/bills/" + item.billId}>
        <strong>{item.name}</strong>
        <span>
          {dateLabel(item.dueDate)}
          {item.subscription ? " · Subscription" : ""}
        </span>
      </Link>
      <div className="row-amount">
        <strong>{money(item.amount, item.currency)}</strong>
        <span
          className={
            "badge " + (item.paid ? "paid" : item.overdue ? "overdue" : "")
          }
        >
          {item.paid ? "Recorded paid" : item.overdue ? "Overdue" : "Upcoming"}
        </span>
      </div>
      <button
        className="icon-button record"
        disabled={mutation.isPending}
        onClick={() => mutation.mutate()}
        aria-label={`${item.paid ? "Undo payment for" : "Record payment for"} ${item.name} on ${item.dueDate}`}
        title={item.paid ? "Undo payment" : "Record payment"}
      >
        {item.paid ? <Check size={18} /> : <span>Pay</span>}
      </button>
      {mutation.error && (
        <p role="alert" className="inline-error">
          {mutation.error.message}
        </p>
      )}
    </div>
  );
}
export function CalmNote() {
  return (
    <div className="calm-note">
      <Leaf aria-hidden="true" />
      <div>
        <strong>A little clarity goes a long way.</strong>
        <p>Your bills, in one place. More room to breathe.</p>
      </div>
      <CalendarDays className="note-art" size={64} aria-hidden="true" />
    </div>
  );
}
