import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, ArrowLeft, Pencil } from "lucide-react";
import {
  api,
  dateLabel,
  money,
  type Bill,
  type Page,
  type Item,
} from "../lib/api";
import {
  BillIcon,
  Empty,
  ErrorState,
  Heading,
  Loading,
  OccurrenceRow,
} from "../components";
export function Bills() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(0);
  const q = useQuery({
    queryKey: ["bills", page],
    queryFn: () => api<Page<Bill>>(`/bills?page=${page}&size=100`),
  });
  const rows = q.data?.items.filter(
    (b) =>
      (type === "all" ||
        (type === "subscriptions" ? b.subscription : !b.subscription)) &&
      (status === "all" || (status === "active" ? b.active : !b.active)) &&
      b.name.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      <Heading
        eyebrow="EVERY COMMITMENT, ONE PLACE"
        title="Bills & subscriptions"
      >
        <Link className="button" to="/bills/new">
          <Plus size={18} /> Add a bill
        </Link>
      </Heading>
      <div className="toolbar">
        <div className="tabs" aria-label="Bill type">
          {["all", "bills", "subscriptions"].map((t) => (
            <button
              aria-pressed={type === t}
              className={type === t ? "selected" : ""}
              onClick={() => setType(t)}
              key={t}
            >
              {t === "all" ? "All items" : t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <label className="search">
          <Search size={17} />
          <input
            aria-label="Search bills on this page"
            placeholder="Search this page…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>
      <div className="filter-row">
        <label>
          Status{" "}
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
          </select>
        </label>
        <span>{q.data?.total ?? 0} items in your account</span>
      </div>
      {q.isPending ? (
        <Loading />
      ) : q.error ? (
        <ErrorState error={q.error} retry={() => q.refetch()} />
      ) : (
        <section className="card list-card">
          {rows?.length ? (
            rows.map((b) => (
              <Link className="bill-list-row" key={b.id} to={"/bills/" + b.id}>
                <BillIcon category={b.category} />
                <div className="row-name">
                  <strong>{b.name}</strong>
                  <span>
                    {b.recurrence.replaceAll("_", " ")} ·{" "}
                    {b.nextDue
                      ? "Next " + dateLabel(b.nextDue)
                      : b.active
                        ? "No future date"
                        : "Paused"}
                  </span>
                  {q.data?.duplicateIds?.includes(b.id) && (
                    <span className="duplicate">
                      Possible duplicate — review this item
                    </span>
                  )}
                </div>
                <div className="row-amount">
                  <strong>{money(b.amount, b.currency)}</strong>
                  <span className="badge">
                    {b.active ? "Active" : "Paused"}
                  </span>
                </div>
                <span aria-hidden="true">›</span>
              </Link>
            ))
          ) : (
            <Empty
              title={
                search || type !== "all" || status !== "all"
                  ? "No matching bills"
                  : "Your bills start here."
              }
              text="Add a bill or adjust your filters."
            />
          )}
        </section>
      )}
      <div className="pagination">
        <button
          className="secondary"
          disabled={!page}
          onClick={() => setPage((p) => p - 1)}
        >
          Previous
        </button>
        <span>Page {page + 1}</span>
        <button
          className="secondary"
          disabled={!q.data || (page + 1) * 100 >= q.data.total}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>
    </>
  );
}
export function BillDetail({ notice }: { notice: (s: string) => void }) {
  const { id } = useParams();
  const client = useQueryClient();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(false);
  const q = useQuery({
    queryKey: ["bill", id],
    queryFn: () => api<Bill>("/bills/" + id),
  });
  const b = q.data;
  const occurrences = useQuery({
    queryKey: ["bill-occurrences", id, b?.firstDue],
    enabled: !!b,
    queryFn: async () => {
      const today = new Date();
      const from = `${today.getFullYear()}-01-01`,
        to = `${today.getFullYear()}-12-31`;
      let all: Item[] = [];
      let page = 0;
      let r: Page<Item>;
      do {
        r = await api<Page<Item>>(
          `/calendar?from=${from}&to=${to}&size=100&page=${page++}`,
        );
        all = all.concat(r.items.filter((i) => i.billId === id));
      } while (page * 100 < r.total);
      return all;
    },
  });
  const pause = useMutation({
    mutationFn: () => api<void>("/bills/" + id, { method: "DELETE" }),
    onSuccess: () => {
      client.invalidateQueries();
      notice("Bill paused. Recorded payments are preserved.");
      navigate("/bills");
    },
  });
  if (q.isPending) return <Loading />;
  if (q.error) return <ErrorState error={q.error} retry={() => q.refetch()} />;
  if (!b) return null;
  return (
    <>
      <Link className="text-link" to="/bills">
        <ArrowLeft size={16} /> All bills
      </Link>
      <Heading
        eyebrow={b.subscription ? "SUBSCRIPTION DETAILS" : "BILL DETAILS"}
        title={b.name}
      >
        <Link className="button" to={`/bills/${id}/edit`}>
          <Pencil size={16} /> Edit bill
        </Link>
      </Heading>
      <div className="detail-grid">
        <section className="card detail-summary">
          <BillIcon category={b.category} />
          <h2>{money(b.amount, b.currency)}</h2>
          <p>{b.recurrence.replaceAll("_", " ")}</p>
          <span className="badge">{b.active ? "Active" : "Paused"}</span>
          <dl>
            {[
              [
                "Next due date",
                b.nextDue ? dateLabel(b.nextDue) : "No future occurrence",
              ],
              ["Anchor date", dateLabel(b.firstDue)],
              ["Month-end policy", b.monthEndPolicy.replaceAll("_", " ")],
              ["Category", b.category],
              [
                "Reminders",
                b.reminderDays ? b.reminderDays + " days before" : "Off",
              ],
              ["Notes", b.notes || "No notes"],
            ].map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          {b.active &&
            (confirm ? (
              <div role="group" aria-label="Confirm pause">
                <p>
                  Pause future unpaid occurrences? Recorded payment history
                  stays.
                </p>
                <button
                  disabled={pause.isPending}
                  onClick={() => pause.mutate()}
                >
                  Pause bill
                </button>
                <button className="secondary" onClick={() => setConfirm(false)}>
                  Cancel
                </button>
              </div>
            ) : (
              <button className="secondary" onClick={() => setConfirm(true)}>
                Pause bill
              </button>
            ))}
          {pause.error && <p role="alert">{pause.error.message}</p>}
        </section>
        <section className="card list-card">
          <div className="section-heading">
            <h2>This year’s timeline</h2>
          </div>
          <p className="muted inset">
            Dates and payment status are per occurrence.
          </p>
          {occurrences.isPending ? (
            <Loading />
          ) : occurrences.error ? (
            <ErrorState
              error={occurrences.error}
              retry={() => occurrences.refetch()}
            />
          ) : occurrences.data?.length ? (
            occurrences.data.map((i) => (
              <OccurrenceRow key={i.id} item={i} onNotice={notice} />
            ))
          ) : (
            <p className="inset">No occurrences this year.</p>
          )}
        </section>
      </div>
    </>
  );
}
