import { test, expect } from "@playwright/test";

test("developer tools seeds demo athlete profiles", async ({ page }) => {
  await page.goto("/dev-tools");

  await expect(page.getByText(/TrackFit cockpit/i)).toBeVisible();

  await page.getByRole("button", { name: /Consistent athlete/i }).click();
  await expect(page.getByText(/Seeded Consistent athlete/i)).toBeVisible();
  await expect(page.getByText("Decision Engine", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: /Overtrained athlete/i }).click();
  await expect(page.getByText(/Seeded Overtrained athlete/i)).toBeVisible();
  await expect(
  page.getByText(/Readiness|Training Intensity|Decision Score|Coach Intelligence|Recovery/i).first()
).toBeVisible();
});