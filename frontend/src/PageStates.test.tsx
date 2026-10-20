import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { vi, it, expect } from "vitest";
import { Bills } from "./pages/Bills";
import { Calendar } from "./pages/Calendar";
import { Insights } from "./pages/Insights";
import { Settings, Reminders } from "./pages/Settings";
import { api } from "./lib/api";
vi.mock("./lib/api", async (original) => ({
  ...(await original<typeof import("./lib/api")>()),
  api: vi.fn(),
}));
const cases = [
  ["Bills", <Bills />],
  ["Calendar", <Calendar timezone="America/Toronto" notice={() => {}} />],
  ["Insights", <Insights timezone="America/Toronto" />],
  ["Settings", <Settings notice={() => {}} logout={async () => {}} />],
  ["Reminders", <Reminders notice={() => {}} />],
] as const;
it.each(cases)(
  "%s has explicit loading, error and retry controls",
  async (_name, page) => {
    vi.mocked(api).mockRejectedValue(new Error("Synthetic network failure"));
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>{page}</MemoryRouter>
      </QueryClientProvider>,
    );
    expect(screen.getByRole("status", { name: "Loading" })).toBeVisible();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Synthetic network failure",
    );
    expect(screen.getByRole("button", { name: "Try again" })).toBeVisible();
  },
);
