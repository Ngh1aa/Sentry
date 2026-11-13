// SENTRY control inventory
// Lists every interactive control on the app pages, activates each one on a
// freshly seeded page and records whether something meaningful happened:
//   NAVIGATED   URL or hash changed, or a new page opened
//   DOWNLOAD    a file download started
//   DOM_CHANGE  the visible workspace changed (excluding the toast)
//   INPUT_OK    a form field accepted a value
//   TOAST_ONLY  only a toast appeared (weak: treated as dead)
//   DISABLED    control is disabled in the seeded state (state-dependent)
//   CURRENT     control already represents the current state (active tab or filter)
//   DEAD        nothing happened
//   LOAD_FAILED the dev server refused the page five times (infrastructure, rerun)
// Also fails on any href="#".
//
// Usage: BASE_URL=http://127.0.0.1:8922 node qa/control-inventory.mjs [--out file.json]
import { chromium } from 'playwright';
import fs from 'node:fs';

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:8922';
const outIndex = process.argv.indexOf('--out');
const outFile = outIndex > -1 ? process.argv[outIndex + 1] : 'qa-artifacts/control-inventory.json';

const ROUTES = [
  'index.html#queue/ALT-8921',
  'cases.html',
  'index.html#cases/CASE-4401',
  'rules.html',
  'index.html#rules/RULE-402',
  'customers.html',
  'index.html#customers/CUST-90412',
  'analytics.html',
  'audit.html',
  'index.html#audit/AUD-99120',
  'recovery-scenario.html'
];

const CONTROL_SELECTOR = 'a[href], button, input, select, textarea, [role="button"], [role="option"], [tabindex]:not([tabindex="-1"])';

async function waitReady(page) {
  await page.waitForFunction(() => {
    if (/recovery-scenario/.test(location.pathname)) return document.readyState === 'complete';
    if (!document.querySelector('.console-view')) return false; // route wrappers are still loading the shell
    const active = document.querySelector('.console-view.active');
    if (!active) return false;
    if (active.id === 'view-queue') return document.querySelectorAll('.queue-alert-card').length > 0;
    // Older builds without async states are ready once the workspace has content.
    return active.querySelector('[data-state="ready"]') !== null || (!active.querySelector('[data-state]') && active.querySelector('.ops-shell > *') !== null);
  }, null, { timeout: 10000 });
}

async function freshPage(context, route) {
  // A new page has its own empty sessionStorage, so every probe starts from the seed.
  // Python's http.server on Windows occasionally refuses a burst of requests;
  // retry the load instead of reporting a false dead control.
  const page = await context.newPage();
  for (let attempt = 1; ; attempt++) {
    await page.goto(`${baseURL}/${route}`, { waitUntil: 'domcontentloaded' });
    try { await waitReady(page); return page; } catch (error) { if (attempt >= 5) { await page.close(); throw error; } await page.waitForTimeout(500 * attempt); }
  }
}

function collect(page) {
  return page.evaluate(selector => {
    const scope = document.querySelector('.console-view') ? [document.querySelector('.sentry-top-bar'), document.querySelector('.console-view.active')] : [document.body];
    const seen = new Set();
    const out = [];
    const visible = el => {
      const r = el.getBoundingClientRect();
      const st = getComputedStyle(el);
      if (el.type === 'file') return true; // visually hidden file inputs are driven by a label
      return r.width > 0 && r.height > 0 && st.visibility !== 'hidden' && st.display !== 'none';
    };
    scope.filter(Boolean).forEach(root => root.querySelectorAll(selector).forEach(el => {
      if (seen.has(el) || !visible(el)) return;
      seen.add(el);
      const text = (el.getAttribute('aria-label') || el.innerText || el.value || el.placeholder || '').replace(/\s+/g, ' ').trim().slice(0, 60);
      out.push({ index: out.length, tag: el.tagName.toLowerCase(), type: el.type || '', id: el.id || '', text, href: el.getAttribute('href'), disabled: el.disabled === true || el.getAttribute('aria-disabled') === 'true' });
    }));
    document.querySelectorAll(selector).forEach(el => { if (seen.has(el)) el.dataset.inventoryIndex = [...seen].indexOf(el); });
    return out;
  }, CONTROL_SELECTOR);
}

function snapshot(page) {
  return page.evaluate(() => {
    const clone = document.body.cloneNode(true);
    clone.querySelectorAll('#sentryToast, #alertSelectionStatus').forEach(n => n.remove());
    clone.querySelectorAll('[data-inventory-index]').forEach(n => n.removeAttribute('data-inventory-index'));
    const fields = [...document.querySelectorAll('input, textarea, select')].map(el => (el.type === 'checkbox' ? String(el.checked) : el.value)).join('|');
    return { url: location.href, html: clone.innerHTML.length + ':' + clone.innerHTML.slice(0, 200000).split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0), fields, toast: document.querySelector('#sentryToast.show')?.textContent || '' };
  });
}

async function probe(context, route, control) {
  let page;
  try { page = await freshPage(context, route); } catch (error) { return { result: 'LOAD_FAILED', note: 'dev server refused the page load 5 times' }; }
  const list = await collect(page);
  const match = list[control.index];
  if (!match || match.text !== control.text || match.tag !== control.tag) {
    await page.close();
    return { result: 'SKIPPED', note: 'control list changed between loads' };
  }
  if (match.disabled) { await page.close(); return { result: 'DISABLED' }; }
  const handle = page.locator(`[data-inventory-index="${control.index}"]`).first();
  const alreadyCurrent = await handle.evaluate(el => el.getAttribute('aria-current') === 'page' || el.getAttribute('aria-pressed') === 'true' || el.getAttribute('aria-selected') === 'true');
  // Count visible DOM mutations during the probe window, so transient states
  // (loading skeletons, busy buttons) count even when the end state is identical.
  await page.evaluate(() => {
    window.__inventoryMutations = 0;
    const ignore = node => (node.nodeType === 1 ? node : node.parentElement)?.closest?.('#sentryToast, #alertSelectionStatus');
    window.__inventoryObserver = new MutationObserver(records => {
      records.forEach(r => {
        if (r.attributeName === 'data-inventory-index' || ignore(r.target)) return;
        // The toast element itself being inserted does not count as a change.
        const nodes = r.type === 'childList' ? [...r.addedNodes, ...r.removedNodes] : [];
        if (nodes.length && nodes.every(n => n.id === 'sentryToast' || ignore(n))) return;
        window.__inventoryMutations++;
      });
    });
    window.__inventoryObserver.observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true });
  });
  const before = await snapshot(page);
  let download = false;
  let popup = false;
  page.on('download', () => { download = true; });
  context.once('page', () => { popup = true; });
  page.on('dialog', dialog => dialog.dismiss());
  try {
    if (match.tag === 'select') {
      const values = await handle.evaluate(el => [...el.options].map(o => o.value));
      const current = await handle.inputValue();
      await handle.selectOption(values.find(v => v !== current) ?? values[0]);
    } else if (match.tag === 'input' && match.type === 'file') {
      await handle.setInputFiles({ name: 'inventory-probe.pdf', mimeType: 'application/pdf', buffer: Buffer.from('probe') });
    } else if (match.tag === 'input' && (match.type === 'checkbox' || match.type === 'radio')) {
      await handle.click({ timeout: 3000 });
    } else if (match.tag === 'input' && match.type === 'date') {
      await handle.fill('2026-09-01');
    } else if (match.tag === 'input' || match.tag === 'textarea') {
      await handle.fill('Inventory probe text 12345');
    } else {
      await handle.click({ timeout: 3000 });
    }
  } catch (error) {
    await page.close();
    return { result: 'ERROR', note: String(error.message).split('\n')[0] };
  }
  await page.waitForTimeout(700);
  const after = page.isClosed() ? before : await snapshot(page);
  const mutations = page.isClosed() ? 0 : await page.evaluate(() => { window.__inventoryObserver?.disconnect(); return window.__inventoryMutations || 0; }).catch(() => 0);
  let result = 'DEAD';
  if (popup || after.url !== before.url) result = 'NAVIGATED';
  else if (download) result = 'DOWNLOAD';
  else if (after.html !== before.html || mutations > 0) result = 'DOM_CHANGE';
  else if (after.fields !== before.fields) result = 'INPUT_OK';
  else if (after.toast && after.toast !== before.toast) result = 'TOAST_ONLY';
  else if (alreadyCurrent) result = 'CURRENT';
  const navNote = result === 'NAVIGATED' ? `to ${popup ? 'new page' : after.url.replace(baseURL, '')}` : '';
  const note = navNote || (after.toast && after.toast !== before.toast ? `toast: ${after.toast.slice(0, 90)}` : '');
  await page.close();
  return { result, note };
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true, reducedMotion: 'reduce' });
// Web fonts are irrelevant to control behaviour; skipping them keeps the run independent of network speed.
await context.route(/fonts.(googleapis|gstatic).com/, route => route.abort());
const report = { baseURL, generatedAt: new Date().toISOString(), routes: [], hashLinks: [], totals: {} };

const selectedRoutes = process.env.INVENTORY_ROUTES ? process.env.INVENTORY_ROUTES.split(',') : ROUTES;
for (const route of selectedRoutes) {
  const page = await freshPage(context, route);
  const controls = await collect(page);
  const hashLinks = await page.evaluate(() => [...document.querySelectorAll('a[href="#"]')].map(a => a.outerHTML.slice(0, 120)));
  await page.close();
  hashLinks.forEach(link => report.hashLinks.push({ route, link }));
  const entries = [];
  for (const control of controls) {
    const outcome = await probe(context, route, control);
    entries.push({ ...control, ...outcome });
    report.totals[outcome.result] = (report.totals[outcome.result] || 0) + 1;
  }
  report.routes.push({ route, controls: entries });
  const summary = entries.reduce((acc, e) => { acc[e.result] = (acc[e.result] || 0) + 1; return acc; }, {});
  console.log(`${route}: ${entries.length} controls ${JSON.stringify(summary)}`);
  entries.filter(e => ['DEAD', 'TOAST_ONLY', 'ERROR', 'LOAD_FAILED'].includes(e.result) || process.env.INVENTORY_VERBOSE).forEach(e => console.log(`  ${e.result.padEnd(10)} <${e.tag}${e.id ? `#${e.id}` : ''}> "${e.text}" ${e.note || ''}`));
}

await browser.close();
fs.mkdirSync(outFile.split('/').slice(0, -1).join('/') || '.', { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
const dead = (report.totals.DEAD || 0) + (report.totals.TOAST_ONLY || 0) + (report.totals.ERROR || 0) + (report.totals.LOAD_FAILED || 0);
const total = Object.values(report.totals).reduce((a, b) => a + b, 0);
console.log(`\nTotal controls: ${total} ${JSON.stringify(report.totals)}`);
console.log(`href="#" links: ${report.hashLinks.length}`);
console.log(`Report: ${outFile}`);
if (dead || report.hashLinks.length) process.exit(1);
