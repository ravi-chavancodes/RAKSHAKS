import { expect, test, type Page } from "@playwright/test";

const isCiWithoutSupabase =
  Boolean(process.env.CI) &&
  ![
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  ].every((value) => Boolean(value?.trim()));

async function mockSuccessfulSubmission(page: Page) {
  await page.route("**/api/incidents", (route) =>
    route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        data: { reference: "RK-20261125-E2E1" },
      }),
    }),
  );
}

test.describe("RAKSHAK SRS E2E Suite (TC-01 to TC-06)", () => {
  test("TC-01: Self SOS with GPS creates a case and shows reference", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      geolocation: { latitude: 12.9716, longitude: 77.5946 },
      permissions: ["geolocation"],
    });
    const page = await context.newPage();
    if (isCiWithoutSupabase) {
      await mockSuccessfulSubmission(page);
    }

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

    await context.close();
  });

  test("TC-02 & TC-03: Third-Person SOS with manual location & mic denied succeeds", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      permissions: [],
    });
    const page = await context.newPage();
    if (isCiWithoutSupabase) {
      await mockSuccessfulSubmission(page);
    }

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

    await page.getByRole("button", { name: /Skip Audio/i }).click();
    await page.getByRole("button", { name: /Send SOS Report/i }).click();

    await expect(
      page.getByRole("heading", { name: /Report received/i }),
    ).toBeVisible({ timeout: 15_000 });
    await context.close();
  });

  test("TC-04 & TC-05: Track page handles AI state and no-match fallback cleanly", async ({
    page,
  }) => {
    test.skip(
      isCiWithoutSupabase,
      "Requires a configured Supabase project for database integration.",
    );

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
  });

  test("TC-06: Unauthorised user cannot access /responder or /admin", async ({
    page,
  }) => {
    await page.goto("/responder");
    await expect(page).toHaveURL(/\/login/);

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("Landing page scroll storytelling and dispatch overview render cleanly", async ({
    page,
  }) => {
    const scrollToStory = async (ratio: number) => {
      await page.evaluate((r) => {
        const storyContainer = document.querySelector("[data-story-container='true']");
        if (storyContainer instanceof HTMLElement) {
          window.scrollTo({
            top:
              storyContainer.offsetTop +
              (storyContainer.offsetHeight - window.innerHeight) * r,
            behavior: "instant",
          });
        }
      }, ratio);
    };

    await page.goto("/", { waitUntil: "networkidle" });
    await expect(
      page.getByRole("heading", { name: /When something goes wrong/i }),
    ).toBeVisible();

    await scrollToStory(0.25);
    await page.waitForTimeout(1400);
    await expect(page.getByText(/Accident Strikes/i)).toBeVisible();

    await scrollToStory(0.48);
    await page.waitForTimeout(1400);
    await expect(page.getByText(/Someone else needs help/i).first()).toBeVisible();

    await scrollToStory(0.62);
    await page.waitForTimeout(1400);
    await expect(page.getByText(/incident_scene\.jpg/i).first()).toBeVisible();

    await scrollToStory(0.84);
    await page.waitForTimeout(1400);
    await expect(page.getByText(/Accepted by Responder/i).first()).toBeVisible();

    await scrollToStory(0.985);
    await page.waitForTimeout(1200);
    await expect(
      page.getByRole("heading", { name: /Send an SOS report from any browser/i }),
    ).toBeVisible();

    // Confirm dispatch overview guarantees render visibly (never blank white box)
    await page.locator("#overview-content").scrollIntoViewIfNeeded();
    await expect(page.getByText("Map pin or manual address")).toBeVisible();
    await expect(page.getByText("Assigned is not Accepted")).toBeVisible();
  });

  test("Mobile viewport renders compact hamburger navbar with no overflow", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    const mobilePage = await context.newPage();
    await mobilePage.goto("/", { waitUntil: "networkidle" });

    const hasOverflow = await mobilePage.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(hasOverflow).toBe(false);

    const menuBtn = mobilePage.getByRole("button", { name: /Open navigation menu/i });
    await expect(menuBtn).toBeVisible();
    await menuBtn.click();

    const drawer = mobilePage.locator("#mobile-nav-drawer");
    await expect(drawer).toBeVisible();
    await expect(drawer.getByRole("link", { name: "Track Case" })).toBeVisible();
    await expect(drawer.getByRole("link", { name: "Sign In" })).toBeVisible();

    await context.close();
  });
});
