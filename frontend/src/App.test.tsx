import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { App } from "./App";
import { Dashboard } from "./pages/Dashboard";
import { Bills } from "./pages/Bills";
import { Calendar } from "./pages/Calendar";
import { Editor, billSchema } from "./pages/Editor";
import { Insights } from "./pages/Insights";
import { api, ApiError, money, type User } from "./lib/api";
vi.mock("./lib/api", async (original) => ({
  ...(await original<typeof import("./lib/api")>()),
  api: vi.fn(),
}));
const mocked = vi.mocked(api);
const user: User = {
  id: "owner",
  email: "test@example.test",
  timezone: "America/Toronto",
  locale: "en-CA",
  currency: "CAD",
  rowVersion: 0,
};
const envelope = {
  asOfDate: "2026-10-19",
  calculationVersion: "schedule-1.0",
  assumptions: ["Synthetic fixture; server totals."],
  warnings: ["Planning estimates only."],
};
const dashboard = {
  ...envelope,
  roundedCurrencyAmounts: {},
  next7Totals: {},
  dueThisWeek: 0,
  dueNextWeek: 0,
  overdueCount: 0,
  upcoming: [],
  overdueLookbackDays: 336,
};
function mount(node: React.ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>{node}</MemoryRouter>
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  vi.clearAllMocks();
});
describe("onboarding and page states", () => {
  it("signs out without a reload and removes private cached data", async () => {
    mocked.mockImplementation(async (path: string) => {
      if (path === "/auth/me") return user;
      if (path === "/auth/logout") return undefined;
      return dashboard;
    });
    mount(<App />);
    await userEvent.click(
      await screen.findByRole("button", { name: "Sign out" }),
    );
    expect(
      await screen.findByRole("button", { name: "Get started" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Sign out" }),
    ).not.toBeInTheDocument();
  });
  it("offers signup and accessible sign-in without fake social auth", async () => {
    mocked.mockRejectedValue(new ApiError(401, "UNAUTHORIZED", "Sign in"));
    mount(<App />);
    await userEvent.click(
      await screen.findByRole("button", { name: "I already have an account" }),
    );
    expect(screen.getByLabelText("Email address")).toHaveAttribute(
      "type",
      "email",
    );
    expect(screen.getByLabelText("Password")).toHaveAttribute(
      "minLength",
      "12",
    );
  });
  it("dashboard has loading and empty setup", async () => {
    mocked.mockResolvedValue(dashboard);
    mount(<Dashboard notice={vi.fn()} />);
    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
    expect(
      await screen.findByText("A little setup. A lot more calm."),
    ).toBeVisible();
    expect(screen.getByText("No commitments yet")).toBeVisible();
  });
  it("dashboard error can be retried", async () => {
    mocked
      .mockRejectedValueOnce(new Error("Offline"))
      .mockResolvedValue(dashboard);
    mount(<Dashboard notice={vi.fn()} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Offline");
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(
      await screen.findByText("A little setup. A lot more calm."),
    ).toBeVisible();
  });
  it("renders original currency totals and visible assumptions", async () => {
    mocked.mockResolvedValue({
      ...dashboard,
      roundedCurrencyAmounts: { CAD: "1234.56", USD: "19.99" },
    });
    mount(<Dashboard notice={vi.fn()} />);
    expect(await screen.findByText("CAD 1,234.56")).toBeVisible();
    expect(screen.getByText("USD 19.99")).toBeVisible();
    await userEvent.click(screen.getByText("How these numbers are calculated"));
    expect(screen.getByText("Synthetic fixture; server totals.")).toBeVisible();
  });
  it("bills filters active subscriptions and flags duplicates", async () => {
    mocked.mockResolvedValue({
      items: [
        {
          id: "a",
          category: "Housing",
          name: "Rent",
          amount: "1000",
          currency: "CAD",
          firstDue: "2026-11-01",
          recurrence: "monthly",
          subscription: false,
          active: true,
        },
        {
          id: "b",
          category: "Entertainment",
          name: "Music",
          amount: "11",
          currency: "CAD",
          firstDue: "2026-11-01",
          recurrence: "monthly",
          subscription: true,
          active: false,
        },
      ],
      total: 2,
      duplicateIds: ["b"],
    });
    mount(<Bills />);
    await screen.findByText("Rent");
    expect(
      screen.getByText("Possible duplicate — review this item"),
    ).toBeVisible();
    await userEvent.click(
      screen.getByRole("button", { name: "Subscriptions" }),
    );
    expect(screen.queryByText("Rent")).not.toBeInTheDocument();
    expect(screen.getByText("Music")).toBeVisible();
    await userEvent.selectOptions(screen.getByLabelText("Status"), "active");
    expect(screen.getByText("No matching bills")).toBeVisible();
  });
  it("calendar has month/list controls and date labels", async () => {
    mocked.mockResolvedValue({
      ...envelope,
      items: [],
      total: 0,
      page: 0,
      size: 100,
    });
    mount(<Calendar notice={vi.fn()} timezone="America/Toronto" />);
    expect(await screen.findByLabelText("Month calendar")).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "List" }));
    expect(screen.queryByLabelText("Month calendar")).not.toBeInTheDocument();
    expect(screen.getByText("A little breathing room.")).toBeVisible();
  });
  it("editor rejects zero amount and missing name before API call", async () => {
    mount(<Editor user={user} notice={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "Save bill" }));
    expect(await screen.findByText("Enter a name.")).toBeVisible();
    expect(mocked).not.toHaveBeenCalled();
  });
  it("insights does not invent historical comparisons", async () => {
    mocked.mockResolvedValue({
      ...envelope,
      roundedCurrencyAmounts: {},
      subscriptionTotals: {},
      unpaidTotals: {},
      categoryTotals: {},
      occurrenceCount: 0,
      comparison: {
        available: false,
        reason: "Complete immutable historical coverage is required.",
      },
    });
    mount(<Insights timezone="America/Toronto" />);
    expect(
      await screen.findByText(
        /Complete immutable historical coverage is required/,
      ),
    ).toBeVisible();
    expect(screen.queryByText(/12%/)).not.toBeInTheDocument();
  });
});
describe("input and display boundaries", () => {
  it("formats large decimal strings without precision loss", () => {
    expect(money("999999999999999.1234", "CAD")).toBe(
      "CAD 999,999,999,999,999.1234",
    );
    expect(money("2", "JPY")).toBe("JPY 2");
  });
  it("validates recurrence, reminders and decimal precision", () => {
    const valid = {
      name: "Rent",
      amount: "1000.0050",
      currency: "CAD",
      firstDue: "2026-01-31",
      recurrence: "monthly",
      everyNWeeks: "1",
      monthEndPolicy: "clamp",
      category: "Housing",
      subscription: false,
      active: true,
      reminderDays: "3, 1, 0",
      notes: "",
    };
    expect(billSchema.safeParse(valid).success).toBe(true);
    for (const patch of [
      { amount: "0" },
      { amount: "1.00001" },
      { reminderDays: "366" },
      { everyNWeeks: "0" },
    ])
      expect(billSchema.safeParse({ ...valid, ...patch }).success).toBe(false);
  });
});
