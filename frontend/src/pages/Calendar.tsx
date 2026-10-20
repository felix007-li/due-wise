import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { api, localToday, monthRange, type Item, type Page } from "../lib/api";
import {
  Assumptions,
  Empty,
  ErrorState,
  Heading,
  Loading,
  OccurrenceRow,
} from "../components";
export function Calendar({
  notice,
  timezone,
}: {
  notice: (s: string) => void;
  timezone: string;
}) {
  const today = localToday(timezone);
  const [month, setMonth] = useState(today.slice(0, 7));
  const [view, setView] = useState("month");
  const [selected, setSelected] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const range = monthRange(month);
  const q = useQuery({
    queryKey: ["calendar", month],
    queryFn: async () => {
      let p = 0;
      let all: Item[] = [];
      let r: Page<Item>;
      do {
        r = await api<Page<Item>>(
          `/calendar?from=${range.from}&to=${range.to}&size=100&page=${p++}`,
        );
        all = all.concat(r.items);
      } while (p * 100 < r.total);
      return { ...r, items: all };
    },
  });
  const move = (delta: number) => {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(Date.UTC(y, m - 1 + delta, 1));
    if (d.getUTCFullYear() < 2000 || d.getUTCFullYear() > 2100) return;
    setMonth(d.toISOString().slice(0, 7));
    setSelected(null);
    setPage(0);
  };
  const [year, m] = month.split("-").map(Number);
  const start = new Date(Date.UTC(year, m - 1, 1)).getUTCDay();
  const days = Number(range.to.slice(-2));
  const filtered =
    q.data?.items.filter((i) => !selected || i.dueDate === selected) ?? [];
  return (
    <>
      <Heading
        eyebrow="PLAN WITH A LITTLE MORE CONFIDENCE"
        title="Your bill calendar"
      />
      <div className="calendar-toolbar">
        <div className="month-controls">
          <button
            className="icon-button"
            aria-label="Previous month"
            onClick={() => move(-1)}
          >
            <ChevronLeft />
          </button>
          <h2>
            {new Intl.DateTimeFormat("en-CA", {
              month: "long",
              year: "numeric",
              timeZone: "UTC",
            }).format(new Date(Date.UTC(year, m - 1, 1)))}
          </h2>
          <button
            className="icon-button"
            aria-label="Next month"
            onClick={() => move(1)}
          >
            <ChevronRight />
          </button>
        </div>
        <div className="tabs">
          <button
            className={view === "month" ? "selected" : ""}
            aria-pressed={view === "month"}
            onClick={() => setView("month")}
          >
            Month
          </button>
          <button
            className={view === "list" ? "selected" : ""}
            aria-pressed={view === "list"}
            onClick={() => setView("list")}
          >
            List
          </button>
        </div>
      </div>
      {q.isPending ? (
        <Loading />
      ) : q.error ? (
        <ErrorState error={q.error} retry={() => q.refetch()} />
      ) : (
        <>
          <div className={view === "month" ? "calendar-layout" : ""}>
            {view === "month" && (
              <section
                className="card calendar-card"
                aria-label="Month calendar"
              >
                <div className="calendar-grid">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (d) => (
                      <span className="weekday" key={d}>
                        {d}
                      </span>
                    ),
                  )}
                  {Array.from({ length: start }, (_, i) => (
                    <span key={"blank" + i} />
                  ))}
                  {Array.from({ length: days }, (_, i) => {
                    const d = `${month}-${String(i + 1).padStart(2, "0")}`;
                    const rows = q.data.items.filter((o) => o.dueDate === d);
                    return (
                      <button
                        className={
                          "day " +
                          (d === today ? "today " : "") +
                          (selected === d ? "chosen" : "")
                        }
                        key={d}
                        aria-pressed={selected === d}
                        aria-label={`${d}, ${rows.length} bills${rows.some((r) => r.overdue) ? ", overdue" : ""}`}
                        onClick={() => {
                          setSelected(selected === d ? null : d);
                          setPage(0);
                        }}
                      >
                        <span>{i + 1}</span>
                        {rows.length > 0 && (
                          <span className="date-badge">
                            {rows.length}
                            <span className="sr-only"> bills</span>
                          </span>
                        )}
                        {rows.some((r) => r.overdue) && (
                          <span className="date-overdue" aria-hidden="true">
                            !
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="muted calendar-caption">
                  Select a date to see its bills. Select it again to see the
                  month.
                </p>
              </section>
            )}
            <section className="card list-card">
              <div className="section-heading">
                <h2>{selected ? "Bills on " + selected : "This month"}</h2>
                <span className="muted">{filtered.length} occurrences</span>
              </div>
              {filtered.length ? (
                filtered
                  .slice(page * 30, (page + 1) * 30)
                  .map((i) => (
                    <OccurrenceRow key={i.id} item={i} onNotice={notice} />
                  ))
              ) : (
                <Empty
                  title="A little breathing room."
                  text="No bills scheduled for this period."
                />
              )}
              {filtered.length > 30 && (
                <div className="pagination">
                  <button
                    disabled={!page}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </button>
                  <span>{page + 1}</span>
                  <button
                    disabled={(page + 1) * 30 >= filtered.length}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </section>
          </div>
          <Assumptions data={q.data} />
        </>
      )}
    </>
  );
}
