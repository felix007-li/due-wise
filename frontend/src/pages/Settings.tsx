import { endSession } from "../lib/session";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type User, type Envelope, type Item } from "../lib/api";
import {
  Assumptions,
  Empty,
  ErrorState,
  Heading,
  Loading,
  OccurrenceRow,
} from "../components";
export function Settings({
  notice,
  logout,
}: {
  notice: (s: string) => void;
  logout: () => Promise<void>;
}) {
  const client = useQueryClient();
  const q = useQuery({
    queryKey: ["settings"],
    queryFn: () => api<User>("/settings"),
  });
  const [deleting, setDeleting] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const update = useMutation({
    mutationFn: (input: Record<string, unknown>) =>
      api("/settings", { method: "PUT", body: JSON.stringify(input) }),
    onSuccess: () => {
      client.invalidateQueries();
      notice("Preferences saved. Due dates remain unchanged.");
    },
  });
  const remove = useMutation({
    mutationFn: () =>
      api("/account", {
        method: "DELETE",
        body: JSON.stringify({ password, confirmation }),
      }),
    onSuccess: () => endSession(client),
  });
  async function download(format: string) {
    try {
      const r = await fetch("/api/v1/account/export?format=" + format, {
        credentials: "same-origin",
      });
      if (!r.ok) throw new Error("Export failed. Please try again.");
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "duewise-export." + format;
      document.body.appendChild(a);
      a.click();
      a.remove();
      // Allow the browser to consume the blob before releasing the URL.
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      notice("Your export is ready. Store it somewhere private.");
    } catch (e) {
      notice((e as Error).message);
    }
  }
  if (q.isPending) return <Loading />;
  if (q.error) return <ErrorState error={q.error} retry={() => q.refetch()} />;
  return (
    <>
      <Heading eyebrow="MADE TO FIT YOUR LIFE" title="Settings & preferences" />
      <div className="settings-grid">
        <form
          className="card settings-form"
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            update.mutate({
              timezone: data.get("timezone"),
              locale: data.get("locale"),
              currency: data.get("currency"),
              rowVersion: q.data.rowVersion,
            });
          }}
        >
          <h2>Your preferences</h2>
          <p className="muted">{q.data.email}</p>
          <label>
            Timezone
            <input
              name="timezone"
              defaultValue={q.data.timezone}
              required
              list="timezones"
            />
            <datalist id="timezones">
              {[
                "America/Toronto",
                "America/Vancouver",
                "America/Winnipeg",
                "America/Halifax",
                "America/St_Johns",
                "America/Edmonton",
                "America/Regina",
                "UTC",
                "Pacific/Auckland",
              ].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </datalist>
          </label>
          <label>
            Currency
            <select name="currency" defaultValue={q.data.currency}>
              {["CAD", "USD", "EUR", "GBP", "JPY"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <small>
              Default for new bills. Existing amounts stay in their original
              currencies.
            </small>
          </label>
          <label>
            Preferred locale
            <select name="locale" defaultValue={q.data.locale}>
              <option value="en-CA">English (Canada)</option>
              <option value="fr-CA">
                Français (Canada) — UI translations planned
              </option>
              <option value="zh-CN">中文 — UI translations planned</option>
            </select>
          </label>
          {update.error && <p role="alert">{update.error.message}</p>}
          <button disabled={update.isPending}>
            {update.isPending ? "Saving…" : "Save preferences"}
          </button>
          <button type="button" className="secondary" onClick={logout}>
            Sign out
          </button>
        </form>
        <div>
          <section className="card settings-group">
            <h2>Your data belongs to you.</h2>
            <p>
              Export all source bills, generated occurrences, payment marks and
              settings as JSON. CSV contains bill templates and protects
              spreadsheet formula cells.
            </p>
            <div className="settings-actions">
              <button className="secondary" onClick={() => download("json")}>
                Export JSON
              </button>
              <button className="secondary" onClick={() => download("csv")}>
                Export CSV
              </button>
            </div>
          </section>
          <section className="card settings-group" style={{ marginTop: 20 }}>
            <h2>Privacy & account deletion</h2>
            <p>
              DueWise stores the financial facts you enter. It does not connect
              to banks or make payments. Account deletion removes active
              database records immediately; encrypted backup copies expire under
              the operator’s retention policy (maximum 30 days required before
              launch).
            </p>
            {!deleting ? (
              <button className="secondary" onClick={() => setDeleting(true)}>
                Delete my account
              </button>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  remove.mutate();
                }}
              >
                <p>
                  This permanently deletes your bills and payment records.
                  Export first if you need a copy.
                </p>
                <label>
                  Current password
                  <input
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>
                <label style={{ marginTop: 15 }}>
                  Type DELETE
                  <input
                    required
                    pattern="DELETE"
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                  />
                </label>
                {remove.error && (
                  <p role="alert" className="inline-error">
                    {remove.error.message}
                  </p>
                )}
                <div className="settings-actions" style={{ marginTop: 15 }}>
                  <button className="danger-button" disabled={remove.isPending}>
                    Permanently delete account
                  </button>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => setDeleting(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </section>
          <section className="info-note">
            <strong>Planning, with clear boundaries.</strong>
            <p>
              Personal planning estimates only, not individualized financial
              advice. User-entered contractual facts take precedence. No bank
              synchronization, lending or payment services. Contact the operator
              for privacy requests; a verified support contact is required
              before launch.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
interface RemindersData extends Envelope {
  items: Item[];
  enabled: boolean;
  channel: string;
  timezone: string;
}
export function Reminders({ notice }: { notice: (s: string) => void }) {
  const client = useQueryClient();
  const q = useQuery({
    queryKey: ["reminders"],
    queryFn: () => api<RemindersData>("/reminders"),
  });
  const toggle = useMutation({
    mutationFn: (enabled: boolean) =>
      api("/reminders/preference", {
        method: "PUT",
        body: JSON.stringify({ enabled }),
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["reminders"] });
      notice("Reminder preference saved.");
    },
  });
  return (
    <>
      <Heading eyebrow="A FRIENDLY HEADS-UP" title="Reminders" />
      {q.isPending ? (
        <Loading />
      ) : q.error ? (
        <ErrorState error={q.error} retry={() => q.refetch()} />
      ) : (
        <>
          <div className="info-note">
            <strong>In-app reminders, on your local day.</strong>
            <p>
              Checked in {q.data.timezone}. Push notifications and email are not
              connected. Open DueWise to review reminders.
            </p>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={q.data.enabled}
                disabled={toggle.isPending}
                onChange={(e) => toggle.mutate(e.target.checked)}
              />{" "}
              Enable in-app payment reminders
            </label>
            {toggle.error && <p role="alert">{toggle.error.message}</p>}
          </div>
          <section className="card list-card">
            <h2 className="reminder-heading">Today’s reminders</h2>
            {q.data.items.length ? (
              q.data.items.map((i) => (
                <OccurrenceRow key={i.id} item={i} onNotice={notice} />
              ))
            ) : (
              <Empty
                title="You’re all caught up."
                text="No reminder offsets match today. See your calendar for all upcoming bills."
              />
            )}
          </section>
          <Assumptions data={q.data} />
        </>
      )}
    </>
  );
}
