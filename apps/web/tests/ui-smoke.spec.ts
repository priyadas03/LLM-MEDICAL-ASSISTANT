import { test, expect } from "@playwright/test";

test("chat page renders ask button", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: /ask|analyzing/i })).toBeVisible();
});

test("eval page renders run eval button", async ({ page }) => {
  await page.goto("/eval");
  await expect(page.getByRole("button", { name: /run eval suite|running/i })).toBeVisible();
});

