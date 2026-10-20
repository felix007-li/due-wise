import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { api, localToday, type Insights as Data } from "../lib/api";
import {
  Assumptions,
  Empty,
  ErrorState,
  Heading,
  Loading,
  Totals,
} from "../components";
const colors = [
  "#397653",
  "#7fa77a",
  "#c6a35e",
  "#9479ac",
  "#ce8763",
  "#a8bb9e",
  "#5b8c85",
  "#ab9c79",
  "#737f67",
];
function previousMonths(month: string) {
  const [y, m] = month.split("-").map(Number);
  return Array.from({ length: 6 }, (_, i) =>
    new Date(Date.UTC(y, m - 6 + i, 1)).toISOString().slice(0, 7),
  );
}
export function Insights({ timezone }: { timezone: string }) {
  const [month, setMonth] = useState(localToday(timezone).slice(0, 7));
  const [tab, setTab] = useState("Spending");
  const [currency, setCurrency] = useState("CAD");
  const q = useQuery({
    queryKey: ["insights", month],
    queryFn: () => api<Data>("/insights?month=" + month),
    enabled: /^\d{4}-\d{2}$/.test(month),
  });
  const trend = useQuery({
    queryKey: ["insight-trend", month],
    queryFn: () =>
      Promise.all(
        previousMonths(month).map((m) => api<Data>("/insights?month=" + m)),
      ),
    enabled: tab === "Trends",
  });
  const currencies = Object.keys(q.data?.roundedCurrencyAmounts ?? {});
  const selected = currencies.includes(currency)
    ? currency
    : (currencies[0] ?? "CAD");
  // Conversion to chart coordinates only; exact server decimal strings remain in the visible tables.
  const chart = Object.entries(q.data?.categoryTotals ?? {})
    .map(([name, values]) => ({ name, value: Number(values[selected] ?? "0") }))
    .filter((c) => c.value > 0);
  return (
    <>
      <Heading eyebrow="UNDERSTAND YOUR COMMITMENTS" title="Insights">
        <label className="month-label">
          Period
          <input
            type="month"
            value={month}
            min="2000-06"
            max="2100-12"
            onChange={(e) => {
              if (e.target.value) setMonth(e.target.value);
            }}
          />
        </label>
      </Heading>
      <div className="tabs insight-tabs">
        {["Spending", "Trends", "Categories"].map((t) => (
          <button
            key={t}
            aria-pressed={tab === t}
            className={tab === t ? "selected" : ""}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {q.isPending ? (
        <Loading />
      ) : q.error ? (
        <ErrorState error={q.error} retry={() => q.refetch()} />
      ) : (
        <>
          <div className="insight-cards">
            <section className="summary-card">
              <p className="summary-label">Monthly commitments</p>
              <div className="hero-total">
                <Totals values={q.data.roundedCurrencyAmounts} />
              </div>
              <p>
                {q.data.occurrenceCount} scheduled occurrences · {month}
              </p>
            </section>
            <section className="card insight-stat">
              <p className="eyebrow">SUBSCRIPTIONS</p>
              <Totals
                values={q.data.subscriptionTotals}
                empty="No subscriptions"
              />
              <p>Recurring services you’ve added</p>
            </section>
            <section className="card insight-stat">
              <p className="eyebrow">STILL TO SET ASIDE</p>
              <Totals
                values={q.data.unpaidTotals}
                empty="No unpaid commitments"
              />
              <p>Unpaid occurrences in this month</p>
            </section>
          </div>
          {currencies.length > 1 && (
            <label className="chart-currency">
              Chart currency
              <select
                value={selected}
                onChange={(e) => setCurrency(e.target.value)}
              >
                {currencies.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
          )}
          {tab === "Trends" ? (
            <section className="card chart-card">
              <h2>Scheduled commitment trend</h2>
              <p className="muted">
                Projected from current templates and recorded paid occurrences.
                This is not verified past spending.
              </p>
              {trend.isPending ? (
                <Loading />
              ) : trend.error ? (
                <ErrorState error={trend.error} retry={() => trend.refetch()} />
              ) : (
                <>
                  <div
                    className="chart"
                    role="img"
                    aria-label={`Six month scheduled commitments in ${selected}. Exact values in the table below.`}
                  >
                    <ResponsiveContainer width="100%" height={230}>
                      <BarChart
                        data={trend.data?.map((d) => ({
                          month: d.month.slice(5),
                          amount: Number(
                            d.roundedCurrencyAmounts[selected] ?? "0",
                          ),
                        }))}
                      >
                        <XAxis
                          dataKey="month"
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis width={65} axisLine={false} tickLine={false} />
                        <Tooltip />
                        <Bar
                          isAnimationActive={false}
                          dataKey="amount"
                          fill="#6e9d76"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <table className="data-table">
                    <caption>Exact server totals, by original currency</caption>
                    <thead>
                      <tr>
                        <th>Month</th>
                        <th>Commitments</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trend.data?.map((d) => (
                        <tr key={d.month}>
                          <td>{d.month}</td>
                          <td>
                            <Totals values={d.roundedCurrencyAmounts} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </section>
          ) : (
            <section className="card categories">
              <div className="section-heading">
                <h2>
                  {tab === "Categories"
                    ? "Spending by category"
                    : "Commitments by category"}
                </h2>
                <span className="muted">{selected} · scheduled</span>
              </div>
              {q.data.occurrenceCount ? (
                <>
                  <div className="category-visual">
                    <div
                      className="donut-chart"
                      role="img"
                      aria-label={`Scheduled ${selected} commitments by category. Exact values listed below.`}
                    >
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie
                            isAnimationActive={false}
                            data={chart}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={62}
                            outerRadius={90}
                            paddingAngle={2}
                            stroke="none"
                          >
                            {chart.map((d, i) => (
                              <Cell
                                key={d.name}
                                fill={colors[i % colors.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="donut-label">
                        <strong>{selected}</strong>
                        <small>Commitments</small>
                      </div>
                    </div>
                    <div className="category-list">
                      {Object.entries(q.data.categoryTotals).map(
                        ([category, totals], i) => (
                          <div className="category-row" key={category}>
                            <span
                              className="category-dot"
                              style={{ background: colors[i % colors.length] }}
                            />
                            <strong>{category}</strong>
                            <Totals values={totals} />
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <Empty />
              )}
            </section>
          )}
          <div className="info-note">
            <strong>A grounded view, without the guesswork.</strong>
            <p>
              These are scheduled commitments, not bank-confirmed spending.{" "}
              {q.data.comparison.reason}
            </p>
          </div>
          <Assumptions data={q.data} />
        </>
      )}
    </>
  );
}
