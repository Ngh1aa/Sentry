import { chromium } from 'playwright';

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({ headless: true });
let failed = false;

async function run(name, fn) {
  try {
    await fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    failed = true;
    console.error(`FAIL ${name}`);
    console.error(error);
  }
}

await run('audit failure preserves rationale and retry records decision', async () => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${baseURL}/recovery-scenario.html`, { waitUntil: 'domcontentloaded' });
  const rationale = page.locator('#rationale');
  const original = await rationale.inputValue();
  if (!original.includes('Device mismatch')) throw new Error('Expected seeded rationale');

  await page.locator('#saveDecision').click();
  await page.getByText('Audit write failed', { exact: true }).waitFor({ state: 'visible' });
  if ((await rationale.inputValue()) !== original) throw new Error('Rationale changed after failed audit write');
  if (!(await page.locator('#saveDecision').isDisabled())) throw new Error('Main save action should remain disabled while recovery choice is pending');

  await page.locator('#retrySave').click();
  await page.getByText('Decision recorded after retry', { exact: true }).waitFor({ state: 'visible' });
  if ((await page.locator('#savedRationale').textContent()) !== original) throw new Error('Recovered audit record lost rationale');
  if (!(await page.locator('#auditRecord').evaluate(el => el.classList.contains('show')))) throw new Error('Recovered audit record is not visible');
  await page.close();
});

await run('review path restores editing without clearing work', async () => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${baseURL}/recovery-scenario.html`, { waitUntil: 'domcontentloaded' });
  const rationale = page.locator('#rationale');
  const edited = '[ATO] Preserve this analyst rationale across failure.';
  await rationale.fill(edited);
  await page.locator('#saveDecision').click();
  await page.getByText('Audit write failed', { exact: true }).waitFor({ state: 'visible' });
  await page.locator('#cancelRetry').click();
  if ((await rationale.inputValue()) !== edited) throw new Error('Review path cleared rationale');
  if (await rationale.isDisabled()) throw new Error('Rationale should be editable after Review decision');
  await page.close();
});

await run('mobile recovery route has no horizontal overflow', async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(`${baseURL}/recovery-scenario.html`, { waitUntil: 'domcontentloaded' });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow > 1) throw new Error(`Horizontal overflow: ${overflow}px`);
  if (!(await page.locator('#saveDecision').isVisible())) throw new Error('Decision action not visible on mobile');
  await page.close();
});

await browser.close();
if (failed) process.exit(1);
