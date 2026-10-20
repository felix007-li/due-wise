import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("production PWA offline fallback caches no financial responses", async ({
  page,
}, testInfo) => {
  test.skip(
    !process.env.DUEWISE_TEST_PREVIEW,
    "Requires the production service worker; use scripts/qa-browser.sh.",
  );
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Get started", exact: true }),
  ).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Get started", exact: true }),
  ).toBeVisible();
  const cachedPaths = await page.evaluate(async () => {
    const paths: string[] = [];
    for (const name of await caches.keys()) {
      for (const request of await (await caches.open(name)).keys()) {
        paths.push(new URL(request.url).pathname);
      }
    }
    return paths;
  });
  expect(cachedPaths).toContain("/offline.html");
  expect(
    cachedPaths.some(
      (path) => path.startsWith("/api/") || path.includes("export"),
    ),
  ).toBe(false);
  await page.context().setOffline(true);
  await page.goto("/offline-verification");
  await expect(
    page.getByRole("heading", { name: "A moment to reconnect." }),
  ).toBeVisible();
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(250, 248, 243)",
  );
  await expect(page.getByRole("link", { name: "Try again" })).toHaveCSS(
    "background-color",
    "rgb(41, 91, 70)",
  );
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(result.violations).toEqual([]);
  await page.screenshot({
    path: `../docs/qa/${testInfo.project.name}-offline.png`,
    fullPage: true,
  });
  await page.context().setOffline(false);
});
