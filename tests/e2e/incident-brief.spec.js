import { expect, test } from "@playwright/test";

test("incident proposal stays a preview until the user saves it", async ({
  page
}) => {
  await page.goto("/incident.html");

  const tickets = page.locator('input[name="ticket"]');
  await tickets.nth(0).check();
  await tickets.nth(1).check();
  await page.getByRole("button", { name: "Genera sintesi" }).click();

  await expect(page.getByText("Anteprima generata dall'AI")).toBeVisible();
  await expect(page.locator("#draft-count")).toHaveText("0");

  await page.getByLabel("Titolo").fill("Titolo verificato dalla persona");
  await page.getByRole("button", { name: "Salva come bozza" }).click();

  await expect(page.locator("#draft-count")).toHaveText("1");
  await expect(page.getByText("Titolo verificato dalla persona")).toBeVisible();
});

test("invalid provider output is visible and cannot be saved", async ({ page }) => {
  await page.goto("/incident.html");
  const initialDraftCount = await page.locator("#draft-count").textContent();

  const tickets = page.locator('input[name="ticket"]');
  await tickets.nth(0).check();
  await tickets.nth(1).check();
  await page.getByLabel("Scenario Replay").selectOption("invalid_output");
  await page.getByRole("button", { name: "Genera sintesi" }).click();

  await expect(page.locator("#app-status")).toContainText("invalid_output");
  await expect(page.getByRole("button", { name: "Salva come bozza" })).toBeHidden();
  await expect(page.locator("#draft-count")).toHaveText(initialDraftCount);
});
