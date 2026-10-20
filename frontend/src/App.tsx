import { lazy, Suspense, useEffect, useState } from "react";
import {
  NavLink,
  Route,
  Routes,
  Link,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Leaf,
  House,
  ReceiptText,
  CalendarDays,
  Plus,
  ChartNoAxesColumn,
  Settings as SettingsIcon,
  LogOut,
  Bell,
  X,
  WifiOff,
} from "lucide-react";
import { api, type User, ApiError } from "./lib/api";
import { endSession } from "./lib/session";
import { Auth } from "./pages/Auth";

import { ErrorState, Loading } from "./components";
const Dashboard = lazy(() =>
  import("./pages/Dashboard").then((m) => ({ default: m.Dashboard })),
);
const Bills = lazy(() =>
  import("./pages/Bills").then((m) => ({ default: m.Bills })),
);
const BillDetail = lazy(() =>
  import("./pages/Bills").then((m) => ({ default: m.BillDetail })),
);
const Calendar = lazy(() =>
  import("./pages/Calendar").then((m) => ({ default: m.Calendar })),
);
const Editor = lazy(() =>
  import("./pages/Editor").then((m) => ({ default: m.Editor })),
);
const Insights = lazy(() =>
  import("./pages/Insights").then((m) => ({ default: m.Insights })),
);
const Settings = lazy(() =>
  import("./pages/Settings").then((m) => ({ default: m.Settings })),
);
const Reminders = lazy(() =>
  import("./pages/Settings").then((m) => ({ default: m.Reminders })),
);
export function App() {
  const client = useQueryClient();
  const [notice, setNotice] = useState("");
  const [offline, setOffline] = useState(!navigator.onLine);
  const location = useLocation();
  const q = useQuery({
    queryKey: ["me"],
    queryFn: () => api<User>("/auth/me"),
    retry: false,
    staleTime: 60_000,
  });
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    const expired = () => client.resetQueries({ queryKey: ["me"] });
    window.addEventListener("session-expired", expired);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      window.removeEventListener("session-expired", expired);
    };
  }, [client]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 7000);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    document.getElementById("main")?.focus();
  }, [location.pathname]);
  async function logout() {
    try {
      await api("/auth/logout", { method: "POST" });
      await endSession(client);
    } catch (e) {
      setNotice((e as Error).message);
    }
  }
  if (q.isPending)
    return (
      <main className="boot-loading">
        <Loading />
      </main>
    );
  if (q.error && !(q.error instanceof ApiError && q.error.status === 401))
    return (
      <main className="boot-loading">
        <ErrorState error={q.error} retry={() => q.refetch()} />
      </main>
    );
  if (!q.data)
    return (
      <Auth
        onSuccess={() => {
          client.removeQueries({
            predicate: (query) => query.queryKey[0] !== "me",
          });
          q.refetch();
        }}
      />
    );
  const nav = [
    { to: "/", label: "Overview", mobile: "Home", icon: House },
    {
      to: "/bills",
      label: "Bills & subscriptions",
      mobile: "Bills",
      icon: ReceiptText,
    },
    { to: "/bills/new", label: "Add a bill", mobile: "Add", icon: Plus },
    {
      to: "/calendar",
      label: "Calendar",
      mobile: "Calendar",
      icon: CalendarDays,
    },
    {
      to: "/insights",
      label: "Insights",
      mobile: "Insights",
      icon: ChartNoAxesColumn,
    },
  ];
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside className="sidebar">
        <Link to="/" className="brand">
          <span className="brand-mark">
            <Leaf size={25} />
          </span>
          <span>
            DueWise<small>Bills & subscriptions</small>
          </span>
        </Link>
        <p className="sidebar-label">YOUR EVERYDAY, SIMPLIFIED</p>
        <nav aria-label="Main navigation">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/" || to === "/bills"}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <Leaf />
            <strong>A little more calm.</strong>
            <p>You’re making space for what matters.</p>
          </div>
          <NavLink to="/settings">
            <SettingsIcon size={19} /> Settings
          </NavLink>
          <button onClick={logout}>
            <LogOut size={19} /> Sign out
          </button>
          <small>Thoughtfully made for your peace of mind.</small>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <Link to="/" className="mobile-brand">
            <Leaf size={22} /> DueWise
          </Link>
          <span className="topbar-greeting">
            Stay on top of your bills. <span>Make room for life.</span>
          </span>
          <div className="topbar-actions">
            <Link
              className="icon-button"
              to="/reminders"
              aria-label="Reminders"
            >
              <Bell size={20} />
            </Link>
            <Link className="icon-button" to="/settings" aria-label="Settings">
              <SettingsIcon size={20} />
            </Link>
            <span className="avatar" title={q.data.email}>
              {q.data.email[0].toUpperCase()}
            </span>
          </div>
        </header>
        {offline && (
          <div className="offline" role="status">
            <WifiOff size={16} /> You’re offline. Reconnect to load or save your
            bills.
          </div>
        )}
        <main id="main" tabIndex={-1} className="main-content">
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<Dashboard notice={setNotice} />} />
              <Route path="/bills" element={<Bills />} />
              <Route
                path="/bills/new"
                element={<Editor notice={setNotice} user={q.data} />}
              />
              <Route
                path="/bills/:id"
                element={<BillDetail notice={setNotice} />}
              />
              <Route
                path="/bills/:id/edit"
                element={<Editor notice={setNotice} user={q.data} />}
              />
              <Route
                path="/calendar"
                element={
                  <Calendar notice={setNotice} timezone={q.data.timezone} />
                }
              />
              <Route
                path="/insights"
                element={<Insights timezone={q.data.timezone} />}
              />
              <Route
                path="/settings"
                element={<Settings notice={setNotice} logout={logout} />}
              />
              <Route
                path="/reminders"
                element={<Reminders notice={setNotice} />}
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
          <footer className="page-footer">
            <Leaf size={15} /> Take control. Spend with purpose.
            <span>
              Personal planning estimates · Your inputs, your clarity.
            </span>
          </footer>
        </main>
      </div>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {nav.map(({ to, mobile, icon: Icon }) => (
          <NavLink
            key={to}
            end={to === "/" || to === "/bills"}
            to={to}
            className={mobile === "Add" ? "add-nav" : ""}
          >
            <span>
              <Icon size={20} />
            </span>
            {mobile}
          </NavLink>
        ))}
      </nav>
      {notice && (
        <div className="toast" role="status">
          {notice}
          <button
            aria-label="Dismiss notification"
            onClick={() => setNotice("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
