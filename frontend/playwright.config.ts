import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 180000,
  expect: { timeout: 15000 },
  reporter: [["list"], ["json", { outputFile: "../docs/qa/e2e-results.json" }]],
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1000 },
      },
    },
    {
      name: "mobile",
      use: {
        ...devices["iPhone SE"],
        defaultBrowserType: "chromium",
        viewport: { width: 375, height: 812 },
      },
    },
  ],
  webServer: {
    stdout: "pipe",
    stderr: "pipe",
    command: process.env.DUEWISE_TEST_PREVIEW
      ? "npx vite preview --host 127.0.0.1 --port 5173"
      : "npm run dev",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: !process.env.CI && !process.env.DUEWISE_TEST_PREVIEW,
  },
});
