import { test, expect } from "@playwright/test";

test("TrackFit loads main app shell", async ({ page }) => {
  const consoleErrors = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  await page.goto("/");

  await expect(page.getByText(/TrackFit/i).first()).toBeVisible();
  await expect(page.getByRole("navigation", { name: /Main navigation/i })).toBeVisible();

  expect(consoleErrors).toEqual([]);
});