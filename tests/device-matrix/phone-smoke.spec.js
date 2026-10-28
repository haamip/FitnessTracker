import { test, expect } from "@playwright/test";

/**
 * The device matrix tests what is available before authentication.
 * A future test-account fixture is needed for workouts/food/HealthKit flows.
 */
test("sign-in screen fits and is usable at this phone size", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Welcome back." })).toBeVisible();
  await expect(page.getByLabel("Email address")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();

  const metrics = await page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    documentWidth: document.documentElement.scrollWidth,
  }));
  expect(metrics.documentWidth, "Sign-in page must not scroll sideways").toBeLessThanOrEqual(metrics.viewportWidth + 2);
  await page.screenshot({ path: testInfo.outputPath("trackfit-phone-screen.png"), fullPage: true });
});

test("sign-in and registration remain reachable via touch-size UI", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Create an account" }).click();
  await expect(page.getByRole("heading", { name: "Start your journey." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Create account", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Sign in", exact: true }).last().click();
  await expect(page.getByRole("heading", { name: "Welcome back." })).toBeVisible();
});

test("mobile keyboard input remains usable and reloads safely", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Email address").fill("test@example.invalid");
  await page.getByLabel("Password").fill("example-password");
  await expect(page.getByLabel("Email address")).toHaveValue("test@example.invalid");
  await expect(page.getByLabel("Password")).toHaveValue("example-password");
  await page.reload();
  await expect(page.getByRole("heading", { name: "Welcome back." })).toBeVisible();
});
