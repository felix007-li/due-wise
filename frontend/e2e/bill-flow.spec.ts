import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
const password = "e2e-test-password-12345";
test("real API: onboard, create, pay, undo, edit, calendar, insights, export, delete", async ({
  page,
}, testInfo) => {
  const email = `e2e-${testInfo.project.name}-${Date.now()}@example.test`;
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("button", { name: "Get started" }).click();
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(
    page.getByRole("heading", { name: "A little setup. A lot more calm." }),
  ).toBeVisible();
  const check = async (name: string) => {
    await expect(page.locator("body")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    const accessibility = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      accessibility.violations,
      JSON.stringify(accessibility.violations, null, 2),
    ).toEqual([]);
    await page.screenshot({
      path: `../docs/qa/${testInfo.project.name}-${name}.png`,
      fullPage: true,
    });
  };
  await check("dashboard-empty");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".brand-mark")).toHaveCSS("animation-name", "none");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.locator(".skip-link").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toBeVisible();
  await page.goto("/bills/new");
  await page.getByLabel("Name", { exact: true }).fill("Synthetic test rent");
  await page.getByLabel("Amount", { exact: true }).fill("123.45");
  const due = await page.getByLabel("First due date").inputValue();
  await page.getByLabel("Remind me before the due date").fill("0");
  await check("editor");
  await page.getByRole("button", { name: "Save bill", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Synthetic test rent", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "CAD 123.4500", exact: true }),
  ).toBeVisible();
  await check("detail");
  await page.goto("/");
  await expect(page.getByText("CAD 123.45").first()).toBeVisible();
  await check("dashboard");
  await page
    .getByRole("button", {
      name: new RegExp("Record payment for Synthetic test rent on " + due),
    })
    .click();
  await expect(
    page.getByText("Payment recorded.", { exact: true }),
  ).toBeVisible();
  await page.goto("/calendar");
  await expect(page.getByText("Recorded paid", { exact: true })).toBeVisible();
  await check("calendar");
  await page
    .getByRole("button", {
      name: new RegExp("Undo payment for Synthetic test rent on " + due),
    })
    .click();
  await expect(
    page.getByText("Payment record removed.", { exact: true }),
  ).toBeVisible();
  await page.goto("/bills");
  await page.getByLabel("Search bills on this page").fill("missing");
  await expect(page.getByText("No matching bills")).toBeVisible();
  await page.getByLabel("Search bills on this page").fill("");
  await check("bills");
  await page.getByRole("link", { name: /Synthetic test rent/ }).click();
  await page.getByRole("link", { name: "Edit bill", exact: true }).click();
  await page.getByLabel("Amount", { exact: true }).fill("150.01");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(
    page.getByRole("heading", { name: "CAD 150.0100" }),
  ).toBeVisible();
  await page.goto("/insights");
  await expect(page.getByText("CAD 150.01").first()).toBeVisible();
  await check("insights");
  await page.getByRole("button", { name: "Categories", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Spending by category" }),
  ).toBeVisible();
  await check("categories");
  await page.getByRole("button", { name: "Trends", exact: true }).click();
  await expect(page.getByRole("table")).toBeVisible();
  await page.goto("/reminders");
  await expect(
    page.getByRole("heading", { name: "Today’s reminders" }),
  ).toBeVisible();
  await expect(
    page.getByText("Synthetic test rent", { exact: true }),
  ).toBeVisible();
  await check("reminders");
  await page.goto("/settings");
  await check("settings");
  const downloadPromise = page.waitForEvent("download", { timeout: 15000 });
  await page.getByRole("button", { name: "Export JSON" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("duewise-export.json");
  const exportPath = await download.path();
  expect(exportPath).toBeTruthy();
  const exported = JSON.parse(await readFile(exportPath!, "utf8"));
  expect(exported.bills).toHaveLength(1);
  expect(exported.bills[0].amount).toBe("150.0100");
  expect(exported.bills[0].name).toBe("Synthetic test rent");
  await page.context().setOffline(true);
  await expect(page.getByText(/You’re offline/)).toBeVisible();
  await page.context().setOffline(false);
  await expect(page.getByText(/You’re offline/)).not.toBeVisible();
  await page
    .getByRole("combobox", { name: /Timezone/ })
    .fill("America/Vancouver");
  await page.getByRole("button", { name: "Save preferences" }).click();
  await expect(
    page.getByText("Preferences saved. Due dates remain unchanged."),
  ).toBeVisible();
  if (testInfo.project.name === "desktop") {
    await page.setViewportSize({ width: 768, height: 1024 });
    for (const [route, title] of [
      ["/", "Next payments"],
      ["/bills", "Bills & subscriptions"],
      ["/calendar", "Your bill calendar"],
      ["/bills/new", "Add a new commitment"],
      ["/insights", "Insights"],
    ]) {
      await page.goto(route);
      await expect(
        page.getByRole("heading", { name: title, exact: true }),
      ).toBeVisible();
      await check("tablet-" + (route.replaceAll("/", "-") || "home"));
    }
    await page.goto("/settings");
  }
  await page
    .getByRole("button", { name: "Delete my account", exact: true })
    .click();
  await page.getByLabel("Current password").fill(password);
  await page.getByLabel("Type DELETE").fill("DELETE");
  await page
    .getByRole("button", { name: "Permanently delete account" })
    .click();
  await expect(page.getByRole("button", { name: "Get started" })).toBeVisible();
  expect(errors).toEqual([]);
});
