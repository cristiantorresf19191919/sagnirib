import { expect, test } from "@playwright/test";

test("foundation placeholder loads and is noindex", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Biringas/);
  const robots = await page.locator('meta[name="robots"]').getAttribute("content");
  expect(robots).toContain("noindex");
});
