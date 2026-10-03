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

  // Assert the mounted secondary workspace, because it is the runtime source-of-truth.
  const analyticsView = page.locator('#view-analytics');
  await expect(analyticsView).toHaveClass(/active/);
  await expect(analyticsView).toContainText('Evidence status');
  await expect(analyticsView).toContainText('0 verified DIRECT_USER · 0 verified PROXY sessions');
  await expect(analyticsView).toContainText('Prevented fraud loss');
  await expect(analyticsView).toContainText('NOT MEASURED');
  await expect(analyticsView).toContainText(/Synthetic|synthetic/);

  // Guard both the legacy base renderer and the richer secondary workspace claims.
  await expect(analyticsView).not.toContainText('$1,842,900');
  await expect(analyticsView).not.toContainText('99.4% precision');
  await expect(analyticsView).not.toContainText('Reduced from 18.2 min');
  await expect(analyticsView).not.toContainText('$1.84M');
  await expect(analyticsView).not.toContainText('2.1%');
  await expect(analyticsView).not.toContainText('3.4m');
  await expect(analyticsView).not.toContainText('18% after split-workspace rollout');

  const kpis = page.locator('.sentry-kpi-strip');
  await expect(kpis).toContainText('Decision Time Evidence:');
  await expect(kpis).toContainText('False Positive Evidence:');
  await expect(kpis).toContainText('Not measured');

  await fs.mkdir('qa-artifacts', { recursive: true });
  await page.screenshot({ path: 'qa-artifacts/sentry-truthful-analytics.png', fullPage: true });
});

test('Sentry decision safety requires rationale, review acknowledgement and second-step commit', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${baseURL}/index.html`, { waitUntil: 'domcontentloaded' });

  const note = page.locator('#analystNoteInput');
  const guard = page.locator('#decisionConfirmPanel');
  const validation = page.locator('#rationaleValidationMessage');
  const statusBadge = page.locator('#evidenceStateBadge');
  const rationale = 'Reviewed device spoofing, impossible travel and the newly added beneficiary.';

  await expect(statusBadge).toContainText('HIGH RISK');

  const bypassResult = await page.evaluate(() => window.sentryConsole.executeDecision(
    'APPROVED',
    'Reviewed the alert evidence and would otherwise allow this transaction.',
    { evidenceReviewAcknowledged: false }
  ));
  expect(bypassResult).toBe(false);
  await expect(statusBadge).toContainText('HIGH RISK');

  // A destructive hotkey cannot commit, stage, or leak its key into rationale.
  await page.keyboard.press('b');
  await expect(note).toHaveValue('');
  await expect(validation).toContainText('Rationale required');
  await expect(guard).toBeHidden();
  await expect(statusBadge).toContainText('HIGH RISK');

  await note.fill(rationale);
  await note.evaluate(element => element.blur());
  await page.keyboard.press('b');

  // Hotkey now stages the decision after the analyst leaves the text field; it still cannot commit in one step.
  await expect(guard).toBeVisible();
  await expect(page.locator('#pendingDecisionTitle')).toContainText('BLOCK & FREEZE');
  await expect(page.locator('#btnConfirmDecision')).toBeDisabled();
  await expect(statusBadge).toContainText('HIGH RISK');

  await page.locator('#decisionEvidenceAck').check();
  await expect(page.locator('#btnConfirmDecision')).toBeEnabled();
  await page.locator('#btnConfirmDecision').click();

  // The mounted Audit workspace reads consoleApp.auditLog and must show the real analyst rationale.
  await page.locator('.nav-tab[data-view="audit"]').click();
  const auditWorkspace = page.locator('#opsAuditRoot');
  await expect(auditWorkspace).toContainText(rationale);
  await expect(auditWorkspace).toContainText('FROZEN');

  // Re-opening the committed alert locks decision controls against silent overwrite.
  await page.evaluate(() => {
    window.sentryConsole.activeAlertId = 'ALT-8921';
    window.sentryConsole.switchView('queue');
    window.sentryConsole.renderAlertQueue();
    window.sentryConsole.renderActiveAlert();
  });
  await expect(page.locator('#btnActionFreeze')).toBeDisabled();
  await expect(page.locator('#decisionSafetyStatus')).toContainText('Decision committed: FROZEN');

  // A decision that conflicts with the model recommendation is visibly flagged.
  await page.locator('.queue-alert-card', { hasText: 'ALT-8920' }).click();
  await note.fill('Travel evidence is plausible, but the unresolved policy conflict requires a supervisor-safe containment choice.');
  await page.locator('#btnActionFreeze').click();
  await expect(page.locator('#pendingDecisionImpact')).toContainText('overrides the model recommendation');
  await page.locator('#btnCancelDecision').click();

  await fs.mkdir('qa-artifacts', { recursive: true });
  await page.screenshot({ path: 'qa-artifacts/sentry-decision-safety.png', fullPage: true });
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
