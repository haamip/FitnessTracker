import { test, expect } from "@playwright/test";

test("coach page loads unified intelligence", async ({ page }) => {
  await page.goto("/dev-tools");
  await page.getByRole("button", { name: /Consistent athlete/i }).click();

  await page.goto("/coach");

  await expect(page.getByText(/Training Coach/i)).toBeVisible();
  await expect(page.getByText(/Next best move/i)).toBeVisible();
  await expect(page.getByText(/Support signals/i)).toBeVisible();
});