from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)


# 1) Make the always-visible KPI strip evidence-safe.
index_path = ROOT / "index.html"
index = index_path.read_text(encoding="utf-8")
index = replace_once(
    index,
    '<aside class="sentry-kpi-strip" aria-label="Operational Telemetry">',
    '<aside class="sentry-kpi-strip" aria-label="Prototype operational telemetry — synthetic scenario data">',
    "kpi aria label",
)
index = replace_once(
    index,
    '      <span class="kpi-lbl">Mean Time to Decide (MTTD):</span>\n      <span class="kpi-val">3.4 min</span>',
    '      <span class="kpi-lbl">Decision Time Evidence:</span>\n      <span class="kpi-val text-warning">Not measured · Round 01 pending</span>',
    "decision time KPI",
)
index = replace_once(
    index,
    '      <span class="kpi-lbl">False Positive Rate:</span>\n      <span class="kpi-val text-clean">2.1% (Target &lt; 3.0%)</span>',
    '      <span class="kpi-lbl">False Positive Evidence:</span>\n      <span class="kpi-val text-warning">Not measured · 0 verified sessions</span>',
    "false positive KPI",
)
index = replace_once(
    index,
    '      <span class="kpi-lbl">Autonomous Intercepts Today:</span>\n      <span class="kpi-val">1,840 Transactions</span>',
    '      <span class="kpi-lbl">Autonomous Intercepts:</span>\n      <span class="kpi-val">Illustrative scenario data</span>',
    "autonomous intercept KPI",
)
index_path.write_text(index, encoding="utf-8")


# 2) Replace unverified outcome claims in the Analytics renderer.
app_path = ROOT / "js" / "app.js"
app = app_path.read_text(encoding="utf-8")
pattern = re.compile(r"  renderAnalytics\(\) \{.*?\n  \}\n\n  renderCustomers\(\) \{", re.S)
replacement = '''  renderAnalytics() {
    const container = document.getElementById('analyticsMetrics');
    if (!container) return;

    // P0-B evidence boundary: these cards describe what the product would measure.
    // They must not present simulated scenario values as validated product outcomes
    // until compatible post-change DIRECT_USER / PROXY or operational evidence exists.
    container.innerHTML = `
      <div class="analytics-stat-card">
        <div class="analytics-lbl">EVIDENCE STATUS</div>
        <div class="analytics-val mono text-warning">NOT MEASURED</div>
        <div class="analytics-sub mono">0 verified DIRECT_USER · 0 verified PROXY sessions</div>
      </div>
      <div class="analytics-stat-card">
        <div class="analytics-lbl">PREVENTED FRAUD LOSS</div>
        <div class="analytics-val mono">NOT MEASURED</div>
        <div class="analytics-sub mono">Requires compatible post-change operational evidence</div>
      </div>
      <div class="analytics-stat-card">
        <div class="analytics-lbl">FALSE POSITIVE RATE</div>
        <div class="analytics-val mono">NOT MEASURED</div>
        <div class="analytics-sub mono">Prototype dataset values are scenario-only, not validated outcomes</div>
      </div>
      <div class="analytics-stat-card">
        <div class="analytics-lbl">MEAN TIME TO DECIDE</div>
        <div class="analytics-val mono">NOT MEASURED</div>
        <div class="analytics-sub mono">No validated baseline or post-change timing evidence yet</div>
      </div>
      <div class="analytics-stat-card">
        <div class="analytics-lbl">RULE CONFLICT INCIDENCE</div>
        <div class="analytics-val mono text-warning">SCENARIO ONLY</div>
        <div class="analytics-sub mono">Synthetic dataset for prototype stress testing · not production telemetry</div>
      </div>
    `;
  }

  renderCustomers() {'''
app, count = pattern.subn(replacement, app, count=1)
if count != 1:
    raise SystemExit(f"renderAnalytics: expected exactly one function, found {count}")
app_path.write_text(app, encoding="utf-8")


# 3) Add a regression test so unverified outcome claims cannot silently return.
qa_path = ROOT / "qa" / "evidence-lens.spec.mjs"
qa = qa_path.read_text(encoding="utf-8")
marker = "test('Sentry research truth gate remains planned until real sessions exist', async () => {"
if marker not in qa:
    raise SystemExit("QA marker not found")
new_test = '''test('Sentry analytics keeps simulated outcomes inside the evidence boundary', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${baseURL}/analytics.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.documentElement.dataset.sentryReady === 'analytics');

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

'''
qa = qa.replace(marker, new_test + marker, 1)
qa_path.write_text(qa, encoding="utf-8")

print("P0-B truthful metrics patch applied")
