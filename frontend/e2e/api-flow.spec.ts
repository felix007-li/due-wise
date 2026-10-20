import { test, expect, type APIRequestContext } from "@playwright/test";
// Uses real HTTP and cookies, without a browser process. Synthetic local account only.
test("real HTTP session, financial projection, pagination, export and deletion", async ({
  request,
}) => {
  const root =
    process.env.DUEWISE_TEST_API_URL ?? "http://127.0.0.1:8080/api/v1";
  const csrf = async (r: APIRequestContext = request) => {
    const response = await r.get(root + "/auth/csrf");
    expect(response.ok()).toBeTruthy();
    const token = await response.json();
    return { [token.headerName]: token.token };
  };
  const email = `http-${Date.now()}@example.test`,
    password = "http-test-password-123";
  const reg = await request.post(root + "/auth/register", {
    headers: await csrf(),
    data: { email, password },
  });
  expect(reg.status()).toBe(201);
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const input = {
    name: "Synthetic HTTP fixture",
    amount: "10.0050",
    currency: "CAD",
    firstDue: date,
    recurrence: "monthly",
    everyNWeeks: 1,
    monthEndPolicy: "clamp",
    category: "Housing",
    subscription: false,
    active: true,
    reminderDays: [0],
    notes: "Synthetic fixture, not a verified market price.",
    rowVersion: 0,
  };
  const create = await request.post(root + "/bills", {
    headers: await csrf(),
    data: input,
  });
  expect(create.status()).toBe(201);
  const bill = await create.json();
  expect(bill.amount).toBe("10.0050");
  const dashboard = await request.get(root + "/dashboard");
  expect(dashboard.status()).toBe(200);
  const projection = await dashboard.json();
  expect(projection.roundedCurrencyAmounts.CAD).toBe("10.00");
  expect(projection.assumptions.length).toBeGreaterThan(0);
  const occurrence = projection.upcoming[0];
  for (let i = 0; i < 2; i++)
    expect(
      (
        await request.post(root + `/occurrences/${occurrence.id}/pay`, {
          headers: await csrf(),
        })
      ).status(),
    ).toBe(204);
  expect(
    (await (await request.get(root + "/dashboard")).json())
      .roundedCurrencyAmounts,
  ).toEqual({});
  const paidBill = await (await request.get(root + "/bills/" + bill.id)).json();
  expect(paidBill.nextDue).not.toBe(date);
  const calendar = await request.get(
    root + `/calendar?from=${date}&to=${date}&size=1&page=0`,
  );
  expect((await calendar.json()).items[0].paid).toBe(true);
  expect(
    (
      await request.post(root + `/occurrences/${occurrence.id}/undo`, {
        headers: await csrf(),
      })
    ).status(),
  ).toBe(204);
  const edited = await request.patch(root + "/bills/" + bill.id, {
    headers: await csrf(),
    data: { ...input, amount: "20.0150" },
  });
  expect(edited.status()).toBe(200);
  const stale = await request.patch(root + "/bills/" + bill.id, {
    headers: await csrf(),
    data: input,
  });
  expect(stale.status()).toBe(409);
  const insights = await request.get(
    root + "/insights?month=" + date.slice(0, 7),
  );
  expect((await insights.json()).roundedCurrencyAmounts.CAD).toBe("20.02");
  const reminders = await request.get(root + "/reminders");
  expect((await reminders.json()).items[0].name).toBe(input.name);
  const exported = await request.get(root + "/account/export");
  expect((await exported.json()).bills[0].name).toBe(input.name);
  expect(
    (await request.get(root + "/account/export?format=csv")).headers()[
      "content-type"
    ],
  ).toContain("text/csv");
  const deletion = await request.delete(root + "/account", {
    headers: await csrf(),
    data: { password, confirmation: "DELETE" },
  });
  expect(deletion.status()).toBe(204);
  expect((await request.get(root + "/auth/me")).status()).toBe(401);
});
