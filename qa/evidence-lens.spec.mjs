import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';

const baseURL = process.env.SENTRY_BASE_URL || 'http://127.0.0.1:4199';

test('Sentry evidence lens exposes decision pins, baseline, tour and operational state links', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${baseURL}/design-lens.html`, { waitUntil: 'domcontentloaded' });
  const frame = page.frameLocator('#frame');

  await expect(frame.locator('.lens-pin')).toHaveCount(4);
  await expect(page.getByText(/0 verified sessions/)).toBeVisible();

  await frame.locator('.lens-pin', { hasText: 'D-02' }).click();
  await expect(frame.locator('.lens-pop')).toContainText('Consequence-specific actions');
  await expect(frame.locator('.lens-pop')).toContainText('PLANNED_VALIDATION');

  await page.getByRole('button', { name: 'CONCEPTUAL BASELINE' }).click();
  await expect(frame.locator('.lens-baseline-banner')).toContainText('NOT A HISTORICAL SHIPPED SCREEN');

  await page.getByRole('button', { name: 'START 5-STEP TOUR' }).click();
  await expect(page.locator('#tourIndex')).toHaveText('01 / 05');
  await expect(frame.locator('.lens-tour-focus')).toHaveCount(1);

  await page.getByRole('button', { name: 'DECISION SERVICE ERROR' }).click();
  await expect(page.locator('#frame')).toHaveAttribute('src', /recruiter-state-lab\.html/);

  await fs.mkdir('qa-artifacts', { recursive: true });
  await page.screenshot({ path: 'qa-artifacts/sentry-evidence-lens.png', fullPage: true });
});

test('Sentry analytics keeps simulated outcomes inside the evidence boundary', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${baseURL}/index.html`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /Analytics/ }).click();
  await expect(page.locator('#view-analytics')).toHaveClass(/active/);

  const metrics = page.locator('#analyticsMetrics');
  await expect(metrics).toContainText('EVIDENCE STATUS');
  await expect(metrics).toContainText('0 verified DIRECT_USER · 0 verified PROXY sessions');
  await expect(metrics).toContainText('PREVENTED FRAUD LOSS');
  await expect(metrics).toContainText('NOT MEASURED');
  await expect(metrics).toContainText('SCENARIO ONLY');

  await expect(metrics).not.toContainText('$1,842,900');
  await expect(metrics).not.toContainText('99.4% precision');
  await expect(metrics).not.toContainText('Reduced from 18.2 min');

  const kpis = page.locator('.sentry-kpi-strip');
  await expect(kpis).toContainText('Decision Time Evidence:');
  await expect(kpis).toContainText('False Positive Evidence:');
  await expect(kpis).toContainText('Not measured');
});

test('Sentry research truth gate remains planned until real sessions exist', async () => {
  const status = JSON.parse(await fs.readFile('research/validation/sentry-round-01/status.json', 'utf8'));
  expect(status.status).toBe('READY_TO_RECRUIT');
  expect(status.evidence_state).toBe('PLANNED_VALIDATION');
  expect(status.verified_direct_user_sessions).toBe(0);
  expect(status.verified_proxy_sessions).toBe(0);
  expect(status.prototype_routes).toContain('design-lens.html');

  const ledger = await fs.readFile('research/validation/sentry-round-01/evidence-ledger.jsonl', 'utf8');
  expect(ledger).toBe('');
});
