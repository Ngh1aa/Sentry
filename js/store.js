// SENTRY // Demo data store
// There is no backend. Every workflow reads and writes this store, which is
// seeded once from js/data.js (SENTRY_DATA) and persisted to sessionStorage so
// user changes survive navigation and reload within the same browser tab.
// Mutations go through request(), which simulates network latency and can be
// armed to fail once so recoverable-error states can be exercised on demand.

(() => {
  'use strict';
  if (window.SentryStore) return;

  const STATE_KEY = 'sentry.demo.state.v1';
  const FAIL_KEY = 'sentry.demo.failNext';
  const LATENCY_MS = 320;
  const clone = value => JSON.parse(JSON.stringify(value));

  const storage = {
    get(key) { try { return window.sessionStorage.getItem(key); } catch (error) { return null; } },
    set(key, value) { try { window.sessionStorage.setItem(key, value); return true; } catch (error) { return false; } },
    remove(key) { try { window.sessionStorage.removeItem(key); } catch (error) { /* storage unavailable */ } }
  };

  function seedCustomers(data) {
    const fromAlerts = data.alerts.map(alert => ({
      id: alert.customer.id,
      name: alert.customer.name,
      email: alert.customer.email,
      trustTier: alert.customer.trustTier,
      accountAge: alert.customer.accountAge,
      lifetimeVolume: alert.customer.lifetimeVolume,
      disputes: alert.customer.priorDisputes,
      risk: alert.riskSpectrum.totalScore,
      segment: alert.customer.trustTier.includes('VIP') ? 'Private Wealth' : 'Consumer',
      status: alert.status === 'FROZEN' ? 'RESTRICTED' : (alert.riskSpectrum.totalScore >= 75 ? 'REVIEW' : 'MONITOR'),
      devices: alert.customer.activeCards,
      home: alert.customer.homeLocation
    }));
    return [...fromAlerts, ...clone(data.extraCustomers || [])].map(customer => ({
      ...customer,
      accountStatus: customer.status === 'RESTRICTED' ? 'FROZEN' : 'ACTIVE',
      watchlist: false,
      watchNotes: [],
      eddRequested: false
    }));
  }

  function seed() {
    const data = clone(window.SENTRY_DATA || SENTRY_DATA);
    data.alerts.forEach(alert => { alert.assignee = alert.assignee || null; });
    data.rulesInventory.forEach(rule => { rule.lastTest = null; });
    return {
      version: 1,
      seededAt: new Date().toISOString(),
      alerts: data.alerts,
      auditLog: data.auditLog,
      cases: data.cases,
      rules: data.rulesInventory,
      customers: seedCustomers(data),
      seq: { case: 4410, rule: 600, audit: 99200, note: 100, evidence: 100 }
    };
  }

  function load() {
    const raw = storage.get(STATE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.version === 1 && Array.isArray(parsed.alerts)) return parsed;
      } catch (error) { /* corrupted state falls back to seed */ }
    }
    const fresh = seed();
    storage.set(STATE_KEY, JSON.stringify(fresh));
    return fresh;
  }

  const state = load();

  function save() {
    storage.set(STATE_KEY, JSON.stringify(state));
  }

  function emit(detail) {
    document.dispatchEvent(new CustomEvent('sentry:store', { detail }));
  }

  function nowStamp() {
    return new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  }

  function nextId(kind, prefix) {
    state.seq[kind] = (state.seq[kind] || 100) + 1;
    return `${prefix}${state.seq[kind]}`;
  }

  function analyst() {
    const metrics = (window.SENTRY_DATA || SENTRY_DATA).systemMetrics;
    return { name: metrics.analyst, actor: `${metrics.analyst} (${metrics.analystRole})` };
  }

  function audit({ entity, action, rationale, verdict, riskScoreAfter = null }) {
    const entry = {
      id: nextId('audit', 'AUD-'),
      timestamp: nowStamp(),
      actor: analyst().actor,
      entity,
      action,
      rationale,
      verdict,
      riskScoreAfter
    };
    state.auditLog.unshift(entry);
    return entry;
  }

  function isFailArmed() {
    return storage.get(FAIL_KEY) === '1';
  }

  function setFailNext(armed) {
    if (armed) storage.set(FAIL_KEY, '1');
    else storage.remove(FAIL_KEY);
    document.dispatchEvent(new CustomEvent('sentry:fail-armed', { detail: { armed: Boolean(armed) } }));
  }

  // Simulated request. `mutate` runs only when the request succeeds, so a
  // failed request never leaves partial changes behind.
  function request(label, mutate, { delay = LATENCY_MS } = {}) {
    return new Promise((resolve, reject) => {
      window.setTimeout(() => {
        if (isFailArmed()) {
          setFailNext(false);
          const error = new Error(`${label} failed: the risk service returned 503 (simulated). Nothing was saved.`);
          error.simulated = true;
          reject(error);
          return;
        }
        try {
          const result = typeof mutate === 'function' ? mutate(state) : undefined;
          if (typeof mutate === 'function') {
            save();
            emit({ label });
          }
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  }

  function reset() {
    storage.remove(STATE_KEY);
    storage.remove(FAIL_KEY);
    try { window.sessionStorage.setItem('sentry.demo.resetNotice', '1'); } catch (error) { /* ignore */ }
    window.location.reload();
  }

  function consumeResetNotice() {
    const flag = storage.get('sentry.demo.resetNotice') === '1';
    if (flag) storage.remove('sentry.demo.resetNotice');
    return flag;
  }

  function downloadCSV(filename, header, rows) {
    const escape = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const csv = [header, ...rows].map(row => row.map(escape).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    return rows.length;
  }

  // Header control: demo data menu (reset + failure simulation).
  function mountControls() {
    const host = document.querySelector('.header-right');
    if (!host || document.getElementById('demoMenuButton')) return;

    const wrap = document.createElement('div');
    wrap.className = 'demo-menu';
    wrap.innerHTML = `
      <button type="button" class="demo-menu-button" id="demoMenuButton" aria-haspopup="true" aria-expanded="false" aria-controls="demoMenuPanel">
        Demo data<span class="demo-fail-flag" id="demoFailFlag" hidden>Fail armed</span>
      </button>
      <div class="demo-menu-panel" id="demoMenuPanel" role="group" aria-label="Demo data controls" hidden>
        <p class="demo-menu-copy">Changes are kept in this tab only (sessionStorage). No backend is connected.</p>
        <label class="demo-menu-row" for="demoFailToggle">
          <input type="checkbox" id="demoFailToggle">
          <span>Fail the next request</span>
        </label>
        <div class="demo-menu-actions">
          <button type="button" class="demo-menu-action" id="demoResetButton">Reset demo data</button>
          <button type="button" class="demo-menu-action danger" id="demoResetConfirm" hidden>Confirm reset</button>
        </div>
      </div>`;
    host.prepend(wrap);

    const button = wrap.querySelector('#demoMenuButton');
    const panel = wrap.querySelector('#demoMenuPanel');
    const toggle = wrap.querySelector('#demoFailToggle');
    const flag = wrap.querySelector('#demoFailFlag');
    const resetButton = wrap.querySelector('#demoResetButton');
    const confirmButton = wrap.querySelector('#demoResetConfirm');

    const syncFlag = () => {
      const armed = isFailArmed();
      toggle.checked = armed;
      flag.hidden = !armed;
    };
    const close = () => {
      panel.hidden = true;
      button.setAttribute('aria-expanded', 'false');
      confirmButton.hidden = true;
      resetButton.textContent = 'Reset demo data';
    };

    button.addEventListener('click', () => {
      const open = panel.hidden;
      panel.hidden = !open;
      button.setAttribute('aria-expanded', String(open));
      if (!open) close();
    });
    toggle.addEventListener('change', () => setFailNext(toggle.checked));
    resetButton.addEventListener('click', () => {
      confirmButton.hidden = false;
      resetButton.textContent = 'Keep my changes';
      if (resetButton.dataset.armed === '1') {
        resetButton.dataset.armed = '';
        confirmButton.hidden = true;
        resetButton.textContent = 'Reset demo data';
        return;
      }
      resetButton.dataset.armed = '1';
      confirmButton.focus();
    });
    confirmButton.addEventListener('click', reset);
    document.addEventListener('click', event => { if (!wrap.contains(event.target)) close(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && !panel.hidden) { close(); button.focus(); } });
    document.addEventListener('sentry:fail-armed', syncFlag);
    syncFlag();
  }

  window.SentryStore = {
    state,
    save,
    request,
    audit,
    nowStamp,
    nextId,
    analyst,
    reset,
    consumeResetNotice,
    isFailArmed,
    setFailNext,
    downloadCSV,
    mountControls
  };
})();
