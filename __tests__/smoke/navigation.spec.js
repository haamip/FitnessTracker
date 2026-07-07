import { test, expect } from "@playwright/test";

test("bottom navigation routes load", async ({ page }) => {
  await page.goto("/");

  const routes = [
    { label: "Home", text: /Today/i },
    { label: "Train", text: /Workout/i },
    { label: "Move", text: /Cardio|Movement|Move/i },
    { label: "Food", text: /Nutrition|Food/i },
    { label: "Coach", text: /Coach|Training Coach/i },
    { label: "Check", text: /Check/i },
  ];

  for (const route of routes) {
    await page.getByRole("link", { name: new RegExp(route.label, "i") }).click();
    await expect(page.getByText(route.text).first()).toBeVisible();
  }
});