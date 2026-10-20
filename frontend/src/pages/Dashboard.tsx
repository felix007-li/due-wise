import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Plus, CalendarDays } from "lucide-react";
import { api, type Dashboard as Data } from "../lib/api";
import {
  Assumptions,
  CalmNote,
  Empty,
  ErrorState,
  Heading,
  Loading,
  OccurrenceRow,
  Totals,
} from "../components";
export function Dashboard({ notice }: { notice: (s: string) => void }) {
  const q = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api<Data>("/dashboard"),
  });
  return (
    <div className="dashboard-page">
      <Heading
        eyebrow="YOUR FINANCIAL PEACE OF MIND"
        title="A clear view of what’s ahead."
      >
        <Link className="button" to="/bills/new">
          <Plus size={18} /> Add a bill
        </Link>
      </Heading>
      {q.isPending ? (
        <Loading />
      ) : q.error ? (
        <ErrorState error={q.error} retry={() => q.refetch()} />
      ) : (
        <>
          <div className="dashboard-grid">
            <section className="summary-card">
              <div className="summary-label">
                <span>Upcoming bills</span>
                <span className="light-tag">NEXT 30 DAYS</span>
              </div>
              <div className="hero-total">
                <Totals values={q.data.roundedCurrencyAmounts} />
              </div>
              <p>Unpaid commitments from {q.data.asOfDate}</p>
              <div className="hero-bars" aria-hidden="true">
                {[20, 32, 25, 52, 41, 65, 80, 58, 92, 110].map((h, i) => (
                  <i key={i} style={{ height: h }} />
                ))}
              </div>
              <div className="summary-footer">
                <CalendarDays size={16} />
                <span>Plan ahead. Stay a step ahead.</span>
              </div>
            </section>
            <section className="week-card card">
              <p className="eyebrow">THE NEXT SEVEN DAYS</p>
              <h2>Make space for what matters.</h2>
              <div className="week-amount">
                <Totals
                  values={q.data.next7Totals}
                  empty="Nothing due this week"
                />
              </div>
              <p>Based on the bills you’ve added. No bank connection needed.</p>
              <Link to="/calendar" className="text-link">
                Open your calendar <ArrowRight size={16} />
              </Link>
            </section>
          </div>
          <div className="stats">
            <div>
              <strong>{q.data.dueThisWeek}</strong>
              <span>Due this week</span>
            </div>
            <div>
              <strong>{q.data.dueNextWeek}</strong>
              <span>Due next week</span>
            </div>
            <div>
              <strong className={q.data.overdueCount ? "danger" : ""}>
                {q.data.overdueCount}
              </strong>
              <span>Overdue · last {q.data.overdueLookbackDays} days</span>
            </div>
          </div>
          <section className="card list-card">
            <div className="section-heading">
              <h2>Next payments</h2>
              <Link to="/calendar" className="text-link">
                See all <ArrowRight size={15} />
              </Link>
            </div>
            {q.data.upcoming.length ? (
              q.data.upcoming.map((item) => (
                <OccurrenceRow key={item.id} item={item} onNotice={notice} />
              ))
            ) : (
              <Empty />
            )}
          </section>
          <CalmNote />
          <Assumptions data={q.data} />
        </>
      )}
    </div>
  );
}
