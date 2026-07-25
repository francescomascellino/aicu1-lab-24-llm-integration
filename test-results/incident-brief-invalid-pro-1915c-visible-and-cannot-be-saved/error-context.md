# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: incident-brief.spec.js >> invalid provider output is visible and cannot be saved
- Location: tests\e2e\incident-brief.spec.js:23:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('#app-status')
Expected substring: "invalid_output"
Received string:    "Output non valido dal provider"
Timeout: 5000ms

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('#app-status')
    - locator resolved to <div role="status" id="app-status" data-type="info" class="app-status" aria-live="polite">Generazione in corso...</div>
    - unexpected value "Generazione in corso..."
    13 × locator resolved to <div role="status" id="app-status" data-type="error" class="app-status" aria-live="polite">Output non valido dal provider</div>
       - unexpected value "Output non valido dal provider"

```

```yaml
- status: Output non valido dal provider
```

# Test source

```ts
  1  | import { expect, test } from "@playwright/test";
  2  | 
  3  | test("incident proposal stays a preview until the user saves it", async ({
  4  |   page
  5  | }) => {
  6  |   await page.goto("/incident.html");
  7  | 
  8  |   const tickets = page.locator('input[name="ticket"]');
  9  |   await tickets.nth(0).check();
  10 |   await tickets.nth(1).check();
  11 |   await page.getByRole("button", { name: "Genera sintesi" }).click();
  12 | 
  13 |   await expect(page.getByText("Anteprima generata dall'AI")).toBeVisible();
  14 |   await expect(page.locator("#draft-count")).toHaveText("0");
  15 | 
  16 |   await page.getByLabel("Titolo").fill("Titolo verificato dalla persona");
  17 |   await page.getByRole("button", { name: "Salva come bozza" }).click();
  18 | 
  19 |   await expect(page.locator("#draft-count")).toHaveText("1");
  20 |   await expect(page.getByText("Titolo verificato dalla persona")).toBeVisible();
  21 | });
  22 | 
  23 | test("invalid provider output is visible and cannot be saved", async ({ page }) => {
  24 |   await page.goto("/incident.html");
  25 |   const initialDraftCount = await page.locator("#draft-count").textContent();
  26 | 
  27 |   const tickets = page.locator('input[name="ticket"]');
  28 |   await tickets.nth(0).check();
  29 |   await tickets.nth(1).check();
  30 |   await page.getByLabel("Scenario Replay").selectOption("invalid_output");
  31 |   await page.getByRole("button", { name: "Genera sintesi" }).click();
  32 | 
> 33 |   await expect(page.locator("#app-status")).toContainText("invalid_output");
     |                                             ^ Error: expect(locator).toContainText(expected) failed
  34 |   await expect(page.getByRole("button", { name: "Salva come bozza" })).toBeHidden();
  35 |   await expect(page.locator("#draft-count")).toHaveText(initialDraftCount);
  36 | });
  37 | 
```