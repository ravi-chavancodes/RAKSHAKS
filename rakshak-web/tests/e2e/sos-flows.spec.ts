import { expect, test } from "@playwright/test";

test.describe("RAKSHAK SRS E2E Suite (TC-01 to TC-06)", () => {
  test("TC-01: Self SOS with GPS creates a case and shows reference", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      geolocation: { latitude: 12.9716, longitude: 77.5946 },
      permissions: ["geolocation"],
    });
    const page = await context.newPage();

    await page.goto("/report?mode=self", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /I need help/i }).click();
    await expect(
      page.getByRole("heading", { name: /Select emergency category/i }),
    ).toBeVisible();
    await page.getByRole("button", { name: /Human Medical or Safety/i }).click();
    await page.getByRole("button", { name: "Next" }).click();

    await page
      .getByLabel(/What is happening/i)
      .fill("TC-01 automated test: minor collision near MG Road.");
    await page.getByRole("button", { name: "Next" }).click();

    await page.getByRole("button", { name: /Share GPS Location/i }).click();
    await expect(page.getByText(/12\.97160/)).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: "Next" }).click();

    await page.getByRole("button", { name: /Skip Audio/i }).click();
    await page.getByRole("button", { name: /Send SOS Report/i }).click();

    await expect(
      page.getByRole("heading", { name: /Report received/i }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/RK-\d{8}-[A-Z0-9]{4}/)).toBeVisible();
    await expect(
      page.getByRole("main").getByRole("link", { name: /112/ }),
    ).toBeVisible();

    await page.screenshot({ path: "../docs/screenshots/tc01-self-sos.png" });
    await context.close();
  });

  test("TC-02 & TC-03: Third-Person SOS with manual location & mic denied succeeds", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      permissions: [],
    });
    const page = await context.newPage();

    await page.goto("/report?mode=third_person", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /Someone else needs help/i }).click();
    await expect(
      page.getByRole("heading", { name: /Select emergency category/i }),
    ).toBeVisible();
    await page.getByRole("button", { name: /Animal or Bird Rescue/i }).click();
    await page.getByRole("button", { name: "Next" }).click();

    await page
      .getByLabel(/What is happening/i)
      .fill("TC-02/03 automated test: injured bird near metro gate.");
    await page.getByRole("button", { name: "Next" }).click();

    await page.getByRole("button", { name: /Enter Location Manually/i }).click();
    await page
      .getByLabel(/Location or nearby landmark/i)
      .fill("Outside Indiranagar Metro Gate B");
    await page.getByRole("button", { name: "Next" }).click();

    // TC-03: Even if mic is denied/skipped, submission proceeds cleanly
    await page.getByRole("button", { name: /Skip Audio/i }).click();
    await page.getByRole("button", { name: /Send SOS Report/i }).click();

    await expect(
      page.getByRole("heading", { name: /Report received/i }),
    ).toBeVisible({ timeout: 15_000 });
    await page.screenshot({ path: "../docs/screenshots/tc02-third-person.png" });
    await context.close();
  });

  test("TC-04 & TC-05: Track page handles AI state and no-match fallback cleanly", async ({
    page,
  }) => {
    // Submit a fire_rescue incident at a remote coordinate with no matching responder
    const formData = new URLSearchParams();
    formData.append("clientRequestId", crypto.randomUUID());
    formData.append("reportingMode", "third_person");
    formData.append("category", "fire_rescue");
    formData.append("description", "TC-05 remote location with no local match.");
    formData.append("latitude", "28.6139");
    formData.append("longitude", "77.2090");
    formData.append("locationText", "Remote sector");
    formData.append("locationIsApproximate", "true");
    formData.append("audioPermissionState", "skipped");

    const res = await page.request.post("/api/incidents", {
      multipart: {
        clientRequestId: crypto.randomUUID(),
        reportingMode: "third_person",
        category: "fire_rescue",
        description: "TC-05 remote location with no local match.",
        latitude: "28.6139",
        longitude: "77.2090",
        locationText: "Remote sector",
        locationIsApproximate: "true",
        audioPermissionState: "skipped",
      },
    });
    expect(res.status()).toBe(201);
    const body = (await res.json()) as {
      ok: boolean;
      data: { reference: string };
    };
    const ref = body.data.reference;

    // Confirm category via API to trigger route-incident (which finds 0 responders in Delhi)
    const confirmRes = await page.request.patch(
      `/api/incidents/${ref}/category`,
      {
        data: { category: "fire_rescue" },
      },
    );
    expect(confirmRes.status()).toBe(200);

    await page.goto(`/track/${ref}`);
    await expect(page.getByText(ref)).toBeVisible();
    await expect(
      page.getByText(/No registered responder found nearby/i),
    ).toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: "../docs/screenshots/tc05-no-match.png" });
  });

  test("TC-06: Unauthorised user cannot access /responder or /admin", async ({
    page,
  }) => {
    await page.goto("/responder");
    await expect(page).toHaveURL(/\/login/);

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});
