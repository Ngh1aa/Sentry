// SENTRY end-to-end gate.
// Covers every workflow against the sessionStorage store, sign-out / sign-in,
// the hidden demo tools (?demo=1: reset and failed-request simulation), and
// global rules: no console errors, no href="#" on any page, and no prototype
// wording on product pages.
//
// Run: SENTRY_BASE_URL=http://127.0.0.1:8922 npx playwright test qa/full-prototype.spec.mjs --workers=1
import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';

const baseURL = process.env.SENTRY_BASE_URL || 'http://127.0.0.1:8922';
const RATIONALE = 'Reviewed device spoofing, impossible travel and the new beneficiary before acting.';

const APP_PAGES = ['index.html', 'cases.html', 'rules.html', 'customers.html', 'analytics.html', 'audit.html', 'recovery-scenario.html'];
const DOC_PAGES = ['prototype.html', 'design-system.html', 'component-states.html', 'state-matrix.html', 'recruiter-state-lab.html', 'design-lens.html', 'sitemap.html', 'user-flow.html'];
const DETAIL_ROUTES = ['index.html#cases/CASE-4401', 'index.html#rules/RULE-402', 'index.html#customers/CUST-90412', 'index.html#audit/AUD-99120'];

// Python's http.server on Windows has a small listen backlog and sometimes
// refuses a burst of parallel requests (net::ERR_CONNECTION_REFUSED). That is a
// dev-server limit, not an app error: navigation helpers retry the load, and
// the console check ignores only that one network message.
const DEV_SERVER_REFUSED = /ERR_CONNECTION_REFUSED/;

function watchConsole(page) {
  const errors = [];
  page.on('console', message => { if (message.type() === 'error' && !DEV_SERVER_REFUSED.test(message.text())) errors.push(message.text()); });
  page.on('pageerror', error => errors.push(String(error)));
  return errors;
}

async function ready(page, timeout = 15000) {
  await page.waitForFunction(() => {
    const active = document.querySelector('.console-view.active');
    if (!active) return false;
    if (active.id === 'view-queue') return document.querySelectorAll('.queue-alert-card').length > 0;
    return active.querySelector('[data-state="ready"]') !== null;
  }, null, { timeout });
}

async function withRetry(page, load) {
  for (let attempt = 1; ; attempt++) {
    await load();
    try { await ready(page); return; } catch (error) { if (attempt >= 3) throw error; }
  }
}

async function open(page, route) {
  await withRetry(page, () => page.goto(`${baseURL}/${route}`, { waitUntil: 'domcontentloaded' }));
}

async function reloadReady(page) {
  await withRetry(page, () => page.reload({ waitUntil: 'domcontentloaded' }));
}

async function armFailure(page) {
  await page.locator('#demoMenuButton').click();
  await page.locator('#demoFailToggle').check();
  await page.locator('#demoMenuButton').click();
  await expect(page.locator('#demoFailFlag')).toBeVisible();
}

test.describe.configure({ timeout: 120000 });

test('every page loads without console errors or href="#"', async ({ page }) => {
  test.setTimeout(300000);
  const errors = watchConsole(page);
  for (const route of [...APP_PAGES, ...DETAIL_ROUTES, ...DOC_PAGES]) {
    if (!DOC_PAGES.includes(route) && route !== 'recovery-scenario.html') await open(page, route);
    else await page.goto(`${baseURL}/${route}`, { waitUntil: 'load' });
    await page.waitForTimeout(300);
    const hashLinks = await page.evaluate(() => [...document.querySelectorAll('a[href="#"]')].length);
    expect(hashLinks, `${route} has href="#"`).toBe(0);
    for (const frame of page.frames().filter(f => f !== page.mainFrame())) {
      const frameLinks = await frame.evaluate(() => [...document.querySelectorAll('a[href="#"]')].length).catch(() => 0);
      expect(frameLinks, `${route} iframe has href="#"`).toBe(0);
    }
  }
  expect(errors).toEqual([]);
});

test('alerts: assign, case from alert, bulk escalate, false positive and resolved filter', async ({ page }) => {
  const errors = watchConsole(page);
  await open(page, 'index.html#queue/ALT-8921');

  await page.locator('#btnAssignAlert').click();
  await page.waitForSelector('#btnAssignAlert:has-text("Assigned to you")');
  await expect(page.locator('#evidenceAssignee')).toHaveText('Assignee: Hannah Cole');
  await expect(page.locator('.queue-alert-card.active .alert-card-assignee')).toContainText('Hannah Cole');

  // Bulk: validation first, then escalate two pending alerts.
  await page.locator('#queueSelectToggle').click();
  await expect(page.locator('#queueBulkBar')).toBeVisible();
  await page.locator('[data-bulk-action="escalate"]').click();
  await expect(page.locator('#queueBulkError')).toContainText('Select at least one alert');
  await page.locator('.queue-alert-card', { hasText: 'ALT-8920' }).locator('.queue-select-box').check();
  await expect(page.locator('#queueBulkCount')).toHaveText('1 selected');
  await page.locator('[data-bulk-action="escalate"]').click();
  await expect(page.locator('#queueBulkError')).toContainText('rationale of at least 20 characters');
  await page.locator('#queueBulkRationale').fill('VIP travel conflict needs supervisor precedence decision.');
  await page.locator('[data-bulk-action="escalate"]').click();
  await page.waitForSelector('.queue-alert-card:has-text("ALT-8920") .badge-status:has-text("ESCALATED")');

  // Single-alert false positive through the decision dock.
  await page.locator('#queueSelectToggle').click();
  await page.locator('.queue-alert-card', { hasText: 'ALT-8921' }).click();
  await page.locator('#analystNoteInput').fill(RATIONALE);
  await page.locator('#btnActionFalsePositive').click();
  await page.locator('#decisionEvidenceAck').check();
  await page.locator('#btnConfirmDecision').click();
  await page.waitForSelector('.queue-alert-card:has-text("ALT-8921") .badge-status:has-text("FALSE POSITIVE")');

  await page.locator('.filter-btn[data-filter="RESOLVED"]').click();
  await expect(page.locator('.queue-alert-card')).toHaveCount(2);

  // Persistence across reload within the tab.
  await reloadReady(page);
  await expect(page.locator('.queue-alert-card', { hasText: 'ALT-8920' }).locator('.badge-status')).toContainText('ESCALATED');

  // Create a case from the active alert (ALT-8919 already has CASE-4403, so use bulk create).
  await page.locator('#queueSelectToggle').click();
  await page.locator('.queue-alert-card', { hasText: 'ALT-8919' }).locator('.queue-select-box').check();
  await page.locator('[data-bulk-action="case"]').click();
  await page.waitForURL(/#cases\/CASE-4411$/);
  await page.waitForSelector('#caseDetailPanel:has-text("CASE-4411")');
  await expect(page.locator('#caseDetailPanel')).toContainText('ALT-8919');

  await open(page, 'index.html#queue/ALT-DOES-NOT-EXIST');
  await expect(page.locator('#sentryToast')).toContainText('ALT-DOES-NOT-EXIST was not found');
  expect(errors).toEqual([]);
});

test('alerts: a failed audit write keeps the rationale and retry commits', async ({ page }) => {
  const errors = watchConsole(page);
  await open(page, 'index.html?demo=1#queue/ALT-8921');
  await armFailure(page);
  await page.locator('#analystNoteInput').fill(RATIONALE);
  await page.locator('#btnActionFreeze').click();
  await page.locator('#decisionEvidenceAck').check();
  await page.locator('#btnConfirmDecision').click();
  await page.waitForSelector('#decisionCommitError:not([hidden])');
  await expect(page.locator('#decisionCommitError')).toContainText('Audit write failed');
  await expect(page.locator('#analystNoteInput')).toHaveValue(RATIONALE);
  await expect(page.locator('#evidenceStateBadge')).toContainText('HIGH RISK');
  await expect(page.locator('#btnConfirmDecision')).toHaveText('Retry commit');
  await page.locator('#btnConfirmDecision').click();
  await page.waitForSelector('.queue-alert-card:has-text("ALT-8921") .badge-status:has-text("FROZEN")');
  expect(errors).toEqual([]);
});

test('cases: create, view, note, evidence, status, close, reopen and not-found', async ({ page }) => {
  const errors = watchConsole(page);
  await open(page, 'cases.html?demo=1');

  // Empty state from filters.
  await page.locator('#caseSearch').fill('zzz-no-match');
  await page.waitForSelector('#caseClearFilters');
  await page.locator('#caseClearFilters').click();
  await page.waitForSelector('#opsCasesRoot tr[data-href]');

  // Create with validation.
  await page.locator('#caseNewBtn').click();
  await page.locator('#newCaseTitle').fill('Wire');
  await page.locator('#caseComposer input[name="newCaseAlert"]').evaluateAll(boxes => boxes.forEach(b => { if (b.checked) b.click(); }));
  await page.locator('#caseCreateBtn').click();
  await expect(page.locator('#err-newCaseTitle')).toContainText('at least 6 characters');
  await expect(page.locator('#err-newCaseCustomer')).toBeVisible();
  await page.locator('#newCaseTitle').fill('Wire takeover, Vance household');
  await page.locator('#caseComposer input[value="ALT-8921"]').check();
  await page.locator('#caseCreateBtn').click();
  await page.waitForURL(/#cases\/CASE-4411$/);
  const detail = page.locator('#caseDetailPanel');
  await page.waitForSelector('#caseDetailPanel:has-text("CASE-4411")');

  // Note.
  await page.locator('#caseNoteInput').fill('Called the customer, no answer. Retry at 02:00 UTC.');
  await page.locator('[data-case-action="note"]').click();
  await page.waitForSelector('#caseDetailPanel .ops-note:has-text("Called the customer")');

  // Evidence (file names only).
  await page.locator('#caseEvidenceInput').setInputFiles([{ name: 'wire-confirmation.pdf', mimeType: 'application/pdf', buffer: Buffer.from('x') }, { name: 'callback-log.txt', mimeType: 'text/plain', buffer: Buffer.from('y') }]);
  await page.waitForSelector('#caseDetailPanel .ops-file-name:has-text("callback-log.txt")');
  await page.locator('[data-remove-evidence]').first().click();
  await page.waitForFunction(() => document.querySelectorAll('#caseDetailPanel .ops-file-name').length === 1);

  // Status change.
  await page.locator('#caseStatusSelect').selectOption('PENDING_EVIDENCE');
  await page.locator('[data-case-action="status"]').click();
  await page.waitForSelector('#caseDetailPanel .ops-detail-meta:has-text("PENDING EVIDENCE")');

  // Close with validation, then reopen.
  await page.locator('[data-case-action="close-form"]').click();
  await page.locator('[data-case-action="close"]').click();
  await expect(page.locator('#err-caseResolution')).toBeVisible();
  await page.locator('#caseResolution').selectOption('Confirmed fraud');
  await page.locator('#caseCloseSummary').fill('Customer confirmed the wire was not authorised; funds recalled.');
  await page.locator('[data-case-action="close"]').click();
  await page.waitForSelector('#caseDetailPanel .ops-resolution:has-text("Confirmed fraud")');
  await page.locator('[data-case-action="reopen-form"]').click();
  await page.locator('#caseReopenReason').fill('Second beneficiary found in the same session.');
  await page.locator('[data-case-action="reopen"]').click();
  await page.waitForSelector('#caseDetailPanel [data-case-action="close-form"]');
  await expect(detail).toContainText('Reopened: Second beneficiary');

  // Recoverable error keeps the draft.
  await armFailure(page);
  await page.locator('#caseNoteInput').fill('Draft that must survive a failed save.');
  await page.locator('[data-case-action="note"]').click();
  await page.waitForSelector('#caseDetailPanel .ops-inline-error');
  await expect(page.locator('#caseNoteInput')).toHaveValue('Draft that must survive a failed save.');
  await page.locator('[data-case-action="note"]').click();
  await page.waitForSelector('#caseDetailPanel .ops-note:has-text("Draft that must survive")');

  // Persistence and not-found.
  await reloadReady(page);
  await expect(page.locator('#caseDetailPanel')).toContainText('Draft that must survive');
  await open(page, 'index.html#cases/CASE-0000');
  await expect(page.locator('[data-not-found="Case"]')).toContainText('CASE-0000 was not found');
  expect(errors).toEqual([]);
});

test('rules: create with validation, edit, disable, test 30 days, delete', async ({ page }) => {
  const errors = watchConsole(page);
  await open(page, 'rules.html');

  await page.locator('#newRuleBtn').click();
  await page.locator('#ruleName').fill('bad name');
  await page.locator('#ruleLogic').fill('Amount');
  await page.locator('#ruleSave').click();
  await expect(page.locator('#err-newRule_name')).toContainText('capital letters');
  await expect(page.locator('#err-newRule_category')).toBeVisible();
  await expect(page.locator('#err-newRule_logic')).toBeVisible();
  await page.locator('#ruleName').fill('HIGH_VELOCITY_NEW_DEVICE');
  await page.locator('#ruleCategoryInput').fill('Device & Velocity');
  await page.locator('#ruleLogic').fill('DeviceAge < 1h AND TxCount10m > 6 AND Amount > 1000');
  await page.locator('#ruleSave').click();
  await page.waitForURL(/#rules\/RULE-601$/);
  await page.waitForSelector('#ruleDetailPanel:has-text("HIGH VELOCITY NEW DEVICE")');

  await page.locator('[data-rule-action="edit"]').click();
  await page.locator('#ruleLogic').fill('DeviceAge < 30m AND TxCount10m > 8');
  await page.locator('#ruleSave').click();
  await page.waitForSelector('#ruleDetailPanel .ops-code-block:has-text("DeviceAge &lt; 30m"), #ruleDetailPanel .ops-code-block:has-text("DeviceAge < 30m")');

  await page.locator('[data-rule-action="toggle"]').click();
  await page.waitForSelector('#ruleDetailPanel [data-rule-action="toggle"]:has-text("Disable")');
  await page.locator('[data-rule-action="toggle"]').click();
  await page.waitForSelector('#ruleDetailPanel [data-rule-action="toggle"]:has-text("Enable")');

  await page.locator('[data-rule-action="test"]').click();
  await page.waitForSelector('#ruleTestResult');
  await expect(page.locator('#ruleTestResult')).toContainText('Would fire');
  await expect(page.locator('#ruleTestResult .ops-backtest-bar')).toHaveCount(30);

  await page.locator('[data-rule-action="delete"]').click();
  await page.locator('[data-rule-action="cancel-delete"]').click();
  await page.locator('[data-rule-action="delete"]').click();
  await page.locator('[data-rule-action="confirm-delete"]').click();
  await page.waitForURL(/#rules$/);
  await expect(page.locator('#opsRulesRoot .ops-rule-item', { hasText: 'RULE-601' })).toHaveCount(0);
  await open(page, 'index.html#rules/RULE-601');
  await expect(page.locator('[data-not-found="Rule"]')).toContainText('RULE-601 was not found');
  expect(errors).toEqual([]);
});

test('customers: detail, freeze and unfreeze, watchlist note, export', async ({ page }) => {
  const errors = watchConsole(page);
  await open(page, 'customers.html');
  await page.locator('#opsCustomersRoot a.ops-link', { hasText: 'Eleanor Vance' }).click();
  await page.waitForURL(/#customers\/CUST-90412$/);
  const panel = page.locator('#customerDetailPanel');
  await page.waitForSelector('#customerDetailPanel:has-text("Eleanor Vance")');

  await page.locator('[data-customer-action="freeze-form"]').click();
  await page.locator('[data-customer-action="freeze"]').click();
  await expect(page.locator('#err-freezeReason-CUST-90412')).toBeVisible();
  await page.locator('#customerFreezeReason').fill('Account takeover evidence on ALT-8921.');
  await page.locator('[data-customer-action="freeze"]').click();
  await page.waitForSelector('#customerDetailPanel .ops-account-state.is-frozen');
  await page.locator('[data-customer-action="freeze-form"]').click();
  await page.locator('#customerFreezeReason').fill('Customer re-verified in branch with ID.');
  await page.locator('[data-customer-action="freeze"]').click();
  await page.waitForSelector('#customerDetailPanel .ops-account-state:not(.is-frozen)');

  await page.locator('#watchNoteInput').fill('Watch for new beneficiaries in Panama.');
  await page.locator('[data-customer-action="note"]').click();
  await page.waitForSelector('#customerDetailPanel .ops-note:has-text("Panama")');
  await expect(panel.locator('[data-customer-action="watchlist"]')).toHaveText('Remove from watchlist');

  const downloadPromise = page.waitForEvent('download');
  await page.locator('#customerExportBtn').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('sentry-customer-cohort.csv');

  await open(page, 'index.html#customers/CUST-NOPE');
  await expect(page.locator('[data-not-found="Customer"]')).toBeVisible();
  expect(errors).toEqual([]);
});

test('analytics: date range, filters, CSV export, load failure and retry', async ({ page }) => {
  const errors = watchConsole(page);
  await open(page, 'analytics.html?demo=1');
  const root = page.locator('#opsAnalyticsRoot');
  await expect(root).toContainText('2026-08-18 to 2026-09-16');
  await page.locator('[data-analytics-range="7d"]').click();
  await expect(root).toContainText('2026-09-10 to 2026-09-16');
  await expect(root.locator('.ops-badge.info').first()).toHaveText('7 DAYS');

  await page.locator('#analyticsFrom').fill('2026-09-12');
  await page.locator('#analyticsTo').fill('2026-09-01');
  await expect(page.locator('#err-analyticsRange')).toContainText('Start date must be on or before');
  await page.locator('#analyticsTo').fill('2026-09-15');
  await expect(root).toContainText('2026-09-12 to 2026-09-15');

  const before = await root.locator('.ops-intro-chip').nth(1).textContent();
  await page.locator('#analyticsTypology').selectOption('Carding / bots');
  await expect(root.locator('.ops-intro-chip').nth(1)).not.toHaveText(before || '');
  await page.locator('#analyticsChannel').selectOption('Wire');

  const downloadPromise = page.waitForEvent('download');
  await page.locator('#analyticsExport').click();
  const download = await downloadPromise;
  const csv = await fs.readFile(await download.path(), 'utf8');
  expect(csv.split('\n')[0]).toBe('"Date","Typology","Channel","Alerts","Blocked","Step-up","Escalated","Approved"');
  expect(csv).toContain('"Carding / bots","Wire"');
  expect(csv).not.toContain('"Account takeover"');

  await page.locator('#analyticsBrief').click();
  await page.waitForSelector('#analyticsBriefPanel');

  // Loading state is visible during a refresh.
  const loading = page.waitForSelector('#opsAnalyticsRoot[data-state="loading"] .ops-skeleton');
  await page.locator('#analyticsRefresh').click();
  await loading;
  await page.waitForSelector('#opsAnalyticsRoot[data-state="ready"]');

  await armFailure(page);
  await page.locator('#analyticsRefresh').click();
  await page.waitForSelector('#opsAnalyticsRoot[data-state="error"]');
  await page.locator('#retry-analytics').click();
  await page.waitForSelector('#opsAnalyticsRoot[data-state="ready"]');
  await expect(root).toContainText('Block rate');
  expect(errors).toEqual([]);
});

test('audit: filters, entry detail, CSV export, verify chain, not-found', async ({ page }) => {
  const errors = watchConsole(page);
  await open(page, 'audit.html');
  const root = page.locator('#opsAuditRoot');
  await page.locator('#auditAction').selectOption('STEP_UP_PASSED');
  await expect(root.locator('tbody tr')).toHaveCount(1);
  await page.locator('#auditSearch').fill('no-such-event');
  await page.waitForSelector('#auditClearFilters');
  await page.locator('#auditClearFilters').click();
  await page.waitForFunction(() => document.querySelectorAll('#opsAuditRoot tbody tr').length >= 6);

  await root.locator('a.ops-link', { hasText: 'AUD-99120' }).click();
  await page.waitForURL(/#audit\/AUD-99120$/);
  await page.waitForSelector('#auditDetailPanel .ops-dl');
  await expect(page.locator('#auditDetailPanel')).toContainText('Carding bot swarm confirmed');
  await page.locator('#auditDetailPanel a.ops-link', { hasText: 'ALT-8919' }).click();
  await page.waitForURL(/#queue\/ALT-8919$/);
  await expect(page.locator('#evidenceAlertId')).toHaveText('ALT-8919');

  await open(page, 'audit.html');
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#auditExportBtn').click();
  expect((await downloadPromise).suggestedFilename()).toBe('sentry-audit-ledger.csv');

  await page.locator('#verifyAuditBtn').click();
  await page.waitForSelector('#opsAuditRoot .ops-integrity-title:has-text("Chain verified")');

  await open(page, 'index.html#audit/AUD-00000');
  await expect(page.locator('[data-not-found="Audit entry"]')).toBeVisible();
  expect(errors).toEqual([]);
});

test('queue load failure shows a recoverable error', async ({ page }) => {
  const errors = watchConsole(page);
  await open(page, 'index.html?demo=1#queue/ALT-8921');
  await armFailure(page);
  await page.locator('#queueRefresh').click();
  await page.waitForSelector('#queueRetry');
  await expect(page.locator('#alertQueueList')).toContainText('Queue failed to load');
  await page.locator('#queueRetry').click();
  await page.waitForSelector('.queue-alert-card');
  expect(errors).toEqual([]);
});

test('reset demo data restores the seed', async ({ page }) => {
  const errors = watchConsole(page);
  await open(page, 'index.html?demo=1#queue/ALT-8921');
  await page.locator('#btnAssignAlert').click();
  await page.waitForSelector('#btnAssignAlert:has-text("Assigned to you")');
  await reloadReady(page);
  await expect(page.locator('#evidenceAssignee')).toHaveText('Assignee: Hannah Cole');

  await page.locator('#demoMenuButton').click();
  await page.locator('#demoResetButton').click();
  await page.locator('#demoResetConfirm').click();
  await page.waitForLoadState('domcontentloaded');
  try { await ready(page); } catch (error) { await reloadReady(page); }
  await ready(page);
  await expect(page.locator('#evidenceAssignee')).toHaveText('Unassigned');
  await expect(page.locator('#sentryToast')).toContainText('Demo data reset');
  const stored = await page.evaluate(() => JSON.parse(sessionStorage.getItem('sentry.demo.state.v1')).alerts[0].assignee);
  expect(stored).toBeNull();
  expect(errors).toEqual([]);
});

const PRODUCT_PAGES = ['index.html', 'cases.html', 'rules.html', 'customers.html', 'analytics.html', 'audit.html', ...DETAIL_ROUTES];
const PROTOTYPE_WORDS = /prototype|demo data|sandbox|simulat|fictional|state lab|portfolio review/i;
const DOC_LINK = /(design-lens|recruiter-state-lab|design-system|component-states|state-matrix|prototype|sitemap|user-flow|recovery-scenario)\.html/;

test('product pages carry no prototype wording and hide demo tools unless ?demo=1', async ({ page }) => {
  test.setTimeout(240000);
  const errors = watchConsole(page);
  for (const route of PRODUCT_PAGES) {
    await open(page, route);
    await page.waitForTimeout(200);
    const text = await page.evaluate(() => document.body.innerText);
    expect(text.match(PROTOTYPE_WORDS), `${route} shows prototype wording`).toBeNull();
    await expect(page.locator('#demoMenuButton')).toHaveCount(0);
    await expect(page.locator('[data-sentry-state-lab-launcher]')).toHaveCount(0);
    await expect(page.locator('.sentry-footer')).toHaveText('Concept product designed by Đỗ Anh Nghĩa.');
    const hrefs = await page.evaluate(() => [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href')));
    expect(hrefs.filter(href => DOC_LINK.test(href)), `${route} links to documentation pages`).toEqual([]);
  }

  await open(page, 'index.html?demo=1');
  await expect(page.locator('#demoMenuButton')).toBeVisible();
  await expect(page.locator('#demoMenuButton')).toHaveText(/Demo tools/);
  await page.locator('#demoMenuButton').click();
  await expect(page.locator('#demoFailToggle')).toBeVisible();
  await expect(page.locator('#demoResetButton')).toBeVisible();
  // The flag stays on for the tab, and ?demo=0 turns it off.
  await open(page, 'rules.html');
  await expect(page.locator('#demoMenuButton')).toBeVisible();
  await open(page, 'index.html?demo=0');
  await expect(page.locator('#demoMenuButton')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('opens signed in; sign out shows the sign-in screen; both sign-in paths work', async ({ page }) => {
  const errors = watchConsole(page);
  await open(page, '');
  await expect(page.locator('#view-queue')).toHaveClass(/active/);
  await expect(page.locator('#accountMenuButton')).toContainText('Hannah Cole');
  await expect(page.locator('#sentrySignIn')).toHaveCount(0);

  await page.locator('#accountMenuButton').click();
  await page.locator('#signOutButton').click();
  const screen = page.locator('#sentrySignIn');
  await expect(screen).toBeVisible();
  await expect(screen).toContainText('Continue as Hannah Cole');
  await expect(screen).toContainText('Concept product designed by Đỗ Anh Nghĩa.');
  // Console hotkeys stay inert behind the sign-in screen.
  await page.keyboard.press('b');
  await expect(page.locator('#decisionConfirmPanel')).toBeHidden();

  // Still signed out after a reload.
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(screen).toBeVisible();

  await page.locator('#signInEmail').fill('hannah.cole@sentryrisk.app');
  await page.locator('#signInPassword').fill('wrong-password');
  await page.locator('#signInForm button[type="submit"]').click();
  await expect(page.locator('#signInError')).toContainText('not recognised');
  await page.locator('#signInPassword').fill('Sentry-2026');
  await page.locator('#signInForm button[type="submit"]').click();
  await expect(screen).toHaveCount(0);

  await page.locator('#accountMenuButton').click();
  await page.locator('#signOutButton').click();
  await page.locator('#signInContinue').click();
  await expect(screen).toHaveCount(0);
  await expect(page.locator('#view-queue')).toHaveClass(/active/);
  expect(errors).toEqual([]);
});
