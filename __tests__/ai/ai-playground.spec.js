import { test, expect } from "@playwright/test";

test("AI playground loads mock provider and prompt data", async ({ page }) => {
  await page.goto("/dev-tools");
  await page.getByRole("button", { name: /Weight loss athlete/i }).click();

  await page.goto("/dev-tools/ai");

  await expect(page).toHaveURL(/dev-tools\/ai/);
await expect(
  page.getByText(/Prompt Preview|Mock AI Response|Provider Status/i).first()
).toBeVisible();
  await expect(page.getByText(/Mock/i).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: /Cost if live/i })).toBeVisible();
  await expect(page.getByText(/Recovery Overview/i)).toBeVisible();
});