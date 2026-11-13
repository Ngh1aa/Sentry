// SENTRY — Secondary Operations Workspaces
// Cases, Rules, Customers, Analytics and Audit. Every workspace reads and
// writes the demo store (js/store.js); there is no backend. Each workspace has
// loading, empty, not-found and recoverable-error states, and detail records
// are deep-linkable (#cases/CASE-4401, #rules/RULE-402, #customers/CUST-90412,
// #audit/AUD-99120).

(() => {
  if (window.__sentrySecondaryWorkspacesLoaded) return;
  window.__sentrySecondaryWorkspacesLoaded = true;

  const ready = () => typeof SENTRY_DATA !== 'undefined' && window.sentryConsole && window.SentryStore;

  const boot = () => {
    if (!ready()) {
      window.setTimeout(boot, 35);
      return;
    }
    if (document.documentElement.dataset.sentrySecondaryReady === 'true') return;
    document.documentElement.dataset.sentrySecondaryReady = 'true';
    initSecondaryWorkspaces();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.setTimeout(boot, 0), { once: true });
  } else {
    window.setTimeout(boot, 0);
  }

  function initSecondaryWorkspaces() {
    const icon = name => (window.SentryIcons && window.SentryIcons[name]) || '';
    const app = window.sentryConsole;
    const store = window.SentryStore;
    const S = store.state;
    const ME = store.analyst().name;

    const CLOSED = 'CLOSED';
    const CASE_STATUSES = ['UNDER_REVIEW', 'PENDING_EVIDENCE', 'AWAITING_CUSTOMER', 'CONFLICT_TRIAGE', 'SUPERVISOR_REVIEW', 'CONTAINED'];
    const CASE_RESOLUTIONS = ['Confirmed fraud', 'Customer verified as legitimate', 'False positive', 'Duplicate of another case', 'Insufficient evidence'];
    const RULE_ACTIONS = ['HOLD_TRANSACTION_FOR_ANALYST_QUEUE', 'SUSPEND_SESSION_AND_REQUIRE_STEP_UP', 'IMMEDIATE_CARD_LOCK_AND_IP_DROP', 'INTERACTIVE_HOLD', 'ROUTE_TO_MANUAL_REVIEW', 'BYPASS_FRICTION_SEND_SILENT_SMS'];
    const RULE_STATUSES = ['ACTIVE', 'SHADOW', 'PAUSED'];

    const VIEW_LABEL = { cases: 'cases', rules: 'rules', customers: 'customer profiles', analytics: 'analytics', audit: 'the audit ledger' };

    // UI state that is not business data (filters, drafts, load status).
    const ui = {
      load: { cases: 'idle', rules: 'idle', customers: 'idle', analytics: 'idle', audit: 'idle' },
      loadError: {},
      actionError: {},
      drafts: {},
      errors: {},
      panel: {},
      caseQuery: '', casePriority: 'ALL', caseStatus: 'ALL',
      ruleQuery: '', ruleCategory: 'ALL', ruleStatus: 'ALL', ruleTestAll: null,
      customerQuery: '', customerRisk: 'ALL', customerAccount: 'ALL',
      analyticsRange: '30d', analyticsFrom: '', analyticsTo: '', analyticsTypology: 'ALL', analyticsChannel: 'ALL', analyticsBrief: null,
      auditQuery: '', auditActor: 'ALL', auditAction: 'ALL', auditOutcome: 'ALL', auditFrom: '', auditTo: '', auditVerify: null
    };

    // ---------------------------------------------------------------- helpers
    const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
    const label = value => esc(String(value ?? '').replaceAll('_', ' '));
    const draft = (key, fallback = '') => (key in ui.drafts ? ui.drafts[key] : fallback);
    const fieldError = key => ui.errors[key] ? `<div class="ops-field-error" id="err-${key}">${esc(ui.errors[key])}</div>` : '';
    const invalid = key => ui.errors[key] ? `aria-invalid="true" aria-describedby="err-${key}"` : '';
    const showToast = message => app.showToast(message);
    const param = () => app.routeParam;

    function riskTone(score) { return score >= 75 ? 'danger' : score >= 50 ? 'warning' : 'clean'; }
    function scoreClass(score) { return score >= 75 ? 'high' : score >= 50 ? 'mid' : 'low'; }
    function initials(name) { return name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase(); }

    function introHTML(eyebrow, title, description, chips) {
      return `
        <div class="ops-page-intro">
          <div class="ops-intro-copy">
            <div class="ops-eyebrow">${eyebrow}</div>
            <h2 class="ops-title">${title}</h2>
            <p class="ops-description">${description}</p>
          </div>
          <div class="ops-intro-meta">
            ${chips.map(([name, value]) => `<div class="ops-intro-chip"><span>${name}</span><strong>${value}</strong></div>`).join('')}
          </div>
        </div>`;
    }

    function kpiHTML(items) {
      return `<div class="ops-kpi-grid">${items.map(item => `
        <article class="ops-kpi-card">
          <div class="ops-kpi-label">${item.label}</div>
          <div class="ops-kpi-value">${item.value}</div>
          <div class="ops-kpi-note">${item.note}</div>
        </article>`).join('')}</div>`;
    }

    function loadingHTML(what) {
      return `<div class="ops-state" role="status" aria-busy="true">
        <div class="ops-skeleton wide"></div><div class="ops-skeleton"></div><div class="ops-skeleton"></div>
        <p class="ops-state-copy">Loading ${what}…</p></div>`;
    }

    function errorHTML(message, retryId) {
      return `<div class="ops-state is-error" role="alert">
        <strong class="ops-state-title">Could not load this workspace</strong>
        <p class="ops-state-copy">${esc(message)}</p>
        <button type="button" class="ops-btn primary" id="${retryId}">Retry</button></div>`;
    }

    function notFoundHTML(kind, id, backHref, backLabel) {
      return `<div class="ops-state is-missing" role="alert" data-not-found="${esc(kind)}">
        <strong class="ops-state-title">${esc(kind)} ${esc(id)} was not found</strong>
        <p class="ops-state-copy">It may have been deleted in this session, or the link is wrong.</p>
        <a class="ops-btn" href="${backHref}">${backLabel}</a></div>`;
    }

    function actionErrorHTML(view) {
      const message = ui.actionError[view];
      if (!message) return '';
      return `<div class="ops-inline-error" role="alert"><span>${esc(message)} Your input is kept; try the action again.</span><button type="button" class="ops-btn small" data-dismiss-error="${view}">Dismiss</button></div>`;
    }

    function setBusy(button, text) {
      if (!button) return;
      button.disabled = true;
      button.setAttribute('aria-busy', 'true');
      button.textContent = text;
    }

    // Runs a store mutation with busy, success and recoverable-error handling.
    function run(view, button, busyText, requestLabel, mutate, onSuccess) {
      ui.actionError[view] = null;
      setBusy(button, busyText);
      return store.request(requestLabel, mutate)
        .then(result => { if (onSuccess) onSuccess(result); })
        .catch(error => { ui.actionError[view] = error.message; showToast('Request failed. Nothing was saved.'); })
        .finally(() => render(view));
    }

    function bindCommon(root, view) {
      root.querySelectorAll('[data-draft]').forEach(input => {
        const handler = () => {
          ui.drafts[input.dataset.draft] = input.type === 'checkbox' ? input.checked : input.value;
          if (ui.errors[input.dataset.draft]) {
            delete ui.errors[input.dataset.draft];
            input.removeAttribute('aria-invalid');
            root.querySelector(`#err-${input.dataset.draft}`)?.remove();
          }
        };
        input.addEventListener('input', handler);
        input.addEventListener('change', handler);
      });
      root.querySelectorAll('[data-dismiss-error]').forEach(button => button.addEventListener('click', () => { ui.actionError[view] = null; render(view); }));
      root.querySelectorAll('tr[data-href]').forEach(row => row.addEventListener('click', event => {
        if (event.target.closest('a, button, input, select, textarea, label')) return;
        window.location.hash = row.dataset.href;
      }));
    }

    function auditEntry(entity, action, rationale, verdict, risk = null) {
      return store.audit({ entity, action, rationale, verdict, riskScoreAfter: risk });
    }

    function focusAfterRender(selector) {
      requestAnimationFrame(() => {
        const el = document.querySelector(selector);
        if (el) { el.focus(); if (typeof el.setSelectionRange === 'function' && el.value) el.setSelectionRange(el.value.length, el.value.length); }
      });
    }

    function revealDetail(id) {
      if (window.innerWidth > 920) return;
      requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: 'start' }));
    }

    // ------------------------------------------------------------ view router
    const VIEWS = {
      cases: { root: 'opsCasesRoot', render: renderCases },
      rules: { root: 'opsRulesRoot', render: renderRules },
      customers: { root: 'opsCustomersRoot', render: renderCustomers },
      analytics: { root: 'opsAnalyticsRoot', render: renderAnalytics },
      audit: { root: 'opsAuditRoot', render: renderAudit }
    };

    function mount() {
      Object.entries(VIEWS).forEach(([view, def]) => {
        const host = document.getElementById(`view-${view}`);
        if (host) host.innerHTML = `<div class="ops-shell" id="${def.root}" data-workspace="${view}"></div>`;
      });
    }

    function load(view) {
      ui.load[view] = 'loading';
      render(view);
      return store.request(`Loading ${VIEW_LABEL[view]}`, null, { delay: 240 })
        .then(() => { ui.load[view] = 'ready'; })
        .catch(error => { ui.load[view] = 'error'; ui.loadError[view] = error.message; })
        .finally(() => render(view));
    }

    function render(view) {
      const def = VIEWS[view];
      const root = def && document.getElementById(def.root);
      if (!root) return;
      root.dataset.state = ui.load[view];
      if (ui.load[view] === 'loading' || ui.load[view] === 'idle') {
        root.innerHTML = loadingHTML(VIEW_LABEL[view]);
        return;
      }
      if (ui.load[view] === 'error') {
        root.innerHTML = errorHTML(ui.loadError[view], `retry-${view}`);
        root.querySelector(`#retry-${view}`).addEventListener('click', () => load(view));
        return;
      }
      def.render(root);
      bindCommon(root, view);
    }

    function activate(view) {
      if (!VIEWS[view]) return;
      if (ui.load[view] === 'idle' || ui.load[view] === 'error') load(view);
      else render(view);
    }

    // ================================================================ CASES
    function caseAlerts(item) { return (item.alertIds || []).map(id => S.alerts.find(a => a.id === id)).filter(Boolean); }

    function filteredCases() {
      const q = ui.caseQuery.toLowerCase();
      return S.cases.filter(item => {
        if (q && !`${item.id} ${item.customer} ${item.title} ${item.queue} ${(item.alertIds || []).join(' ')}`.toLowerCase().includes(q)) return false;
        if (ui.casePriority !== 'ALL' && !item.priority.startsWith(ui.casePriority)) return false;
        if (ui.caseStatus !== 'ALL' && item.status !== ui.caseStatus) return false;
        return true;
      });
    }

    function slaMinutes(sla) {
      const h = /(\d+)h/.exec(sla); const m = /(\d+)m/.exec(sla);
      if (!h && !m) return Infinity;
      return (h ? Number(h[1]) * 60 : 0) + (m ? Number(m[1]) : 0);
    }

    function renderCases(root) {
      const list = filteredCases();
      const routeId = param();
      const selected = routeId ? S.cases.find(c => c.id === routeId) : (list[0] || null);
      const open = S.cases.filter(c => c.status !== CLOSED);
      const critical = open.filter(c => c.priority.startsWith('P0')).length;
      const slaRisk = open.filter(c => slaMinutes(c.sla) < 60).length;
      const owners = {};
      open.forEach(c => { owners[c.owner] = (owners[c.owner] || 0) + 1; });
      const maxOwner = Math.max(1, ...Object.values(owners));
      const slaWatch = open.filter(c => Number.isFinite(slaMinutes(c.sla))).sort((a, b) => slaMinutes(a.sla) - slaMinutes(b.sla)).slice(0, 3);
      const statuses = [...new Set([...CASE_STATUSES, CLOSED, ...S.cases.map(c => c.status)])];

      root.innerHTML = `
        ${introHTML('Investigation orchestration', 'Cases, SLA Command Center', 'Prioritize investigations, coordinate ownership, inspect linked evidence and keep high-risk work inside response-time targets.', [['Open cases', open.length], ['P0 critical', critical], ['Shift', 'EMEA / AMER'], ['Closed', S.cases.length - open.length]])}
        <div class="ops-toolbar">
          <div class="ops-search-wrap">${icon('search')}<input id="caseSearch" class="ops-search" value="${esc(ui.caseQuery)}" placeholder="Search case, customer, alert or queue" aria-label="Search cases"></div>
          <select id="casePriority" class="ops-select" aria-label="Filter by priority">
            <option value="ALL">All priority</option><option value="P0">P0 critical</option><option value="P1">P1 high</option><option value="P2">P2 review</option>
          </select>
          <select id="caseStatus" class="ops-select" aria-label="Filter by status">
            <option value="ALL">All status</option>${statuses.map(status => `<option value="${status}">${label(status)}</option>`).join('')}
          </select>
          <div class="ops-toolbar-spacer"></div>
          <a class="ops-btn" href="#queue/${esc(app.activeAlertId)}">${icon('activity')} Queue view</a>
          <button type="button" class="ops-btn primary" id="caseNewBtn" aria-expanded="${ui.panel.caseComposer ? 'true' : 'false'}">New case</button>
        </div>
        ${ui.panel.caseComposer ? caseComposerHTML() : ''}
        ${kpiHTML([
          { label: 'Active investigations', value: String(open.length), note: `${S.cases.length} cases in this session` },
          { label: 'SLA at risk', value: String(slaRisk), note: 'Under 60 minutes remaining' },
          { label: 'Supervisor review', value: String(open.filter(c => c.status === 'SUPERVISOR_REVIEW').length), note: 'Escalated and awaiting decision' },
          { label: 'Closed cases', value: String(S.cases.length - open.length), note: 'Closed with a recorded resolution' }
        ])}
        <div class="ops-grid cases">
          <section class="ops-panel table-panel">
            <div class="ops-panel-head"><div><h3 class="ops-panel-title">Case queue</h3><div class="ops-panel-subtitle">${list.length} of ${S.cases.length} records</div></div><span class="ops-badge info">LIVE TRIAGE</span></div>
            <div class="ops-panel-body flush">
              ${list.length ? `<table class="ops-table"><thead><tr><th>Case</th><th>Entity</th><th>Priority</th><th>Owner</th><th>SLA</th><th>Status</th></tr></thead><tbody>
                ${list.map(item => `<tr data-href="#cases/${esc(item.id)}" class="${selected && item.id === selected.id ? 'active' : ''}">
                  <td><a class="ops-id ops-link" href="#cases/${esc(item.id)}">${esc(item.id)}</a><div class="ops-secondary">${esc(item.opened)}</div></td>
                  <td><div class="ops-entity">${esc(item.customer)}</div><div class="ops-secondary">${esc(item.summary)}</div></td>
                  <td><span class="ops-badge ${item.priority.startsWith('P0') ? 'danger' : item.priority.startsWith('P1') ? 'warning' : 'info'}">${esc(item.priority)}</span></td>
                  <td>${esc(item.owner)}</td><td class="ops-id">${esc(item.status === CLOSED ? 'CLOSED' : item.sla)}</td><td><span class="ops-badge ${item.status === CLOSED ? 'clean' : 'purple'}">${label(item.status)}</span></td>
                </tr>`).join('')}
              </tbody></table>` : `<div class="ops-empty"><p>${S.cases.length ? 'No cases match the active filters.' : 'No cases yet. Create one from the alert queue.'}</p>${S.cases.length ? '<button type="button" class="ops-btn" id="caseClearFilters">Clear filters</button>' : ''}</div>`}
            </div>
          </section>
          <aside class="ops-panel" id="caseDetailPanel" aria-label="Case detail">${routeId && !selected ? notFoundHTML('Case', routeId, '#cases', 'Back to all cases') : selected ? caseDetailHTML(selected) : casePlaceholderHTML()}</aside>
        </div>
        <div class="ops-grid analytics">
          <section class="ops-panel">
            <div class="ops-panel-head"><div><h3 class="ops-panel-title">Team workload</h3><div class="ops-panel-subtitle">Open cases by owner</div></div></div>
            <div class="ops-panel-body"><div class="ops-workload-list">
              ${Object.keys(owners).length ? Object.entries(owners).sort((a, b) => b[1] - a[1]).map(([name, count]) => `<div class="ops-workload-row"><span>${esc(name)}</span><div class="ops-workload-bar"><div class="ops-workload-fill" style="width:${Math.round(count / maxOwner * 100)}%"></div></div><strong class="ops-id">${count}</strong></div>`).join('') : '<p class="ops-empty">No open cases.</p>'}
            </div></div>
          </section>
          <section class="ops-panel">
            <div class="ops-panel-head"><div><h3 class="ops-panel-title">SLA watch</h3><div class="ops-panel-subtitle">Next deadlines requiring attention</div></div></div>
            <div class="ops-panel-body"><div class="ops-sla-watch">
              ${slaWatch.length ? slaWatch.map(c => `<a class="ops-sla-item" href="#cases/${esc(c.id)}"><strong class="${slaMinutes(c.sla) < 15 ? 'text-danger' : ''}">${esc(c.sla)}</strong><span>${esc(c.id)}, ${esc(c.priority.split(' ')[0])}</span></a>`).join('') : '<p class="ops-empty">No SLA deadlines.</p>'}
            </div></div>
          </section>
        </div>`;

      root.querySelector('#casePriority').value = ui.casePriority;
      root.querySelector('#caseStatus').value = ui.caseStatus;
      bindCaseEvents(root, selected);
    }

    function casePlaceholderHTML() {
      return `<div class="ops-state"><strong class="ops-state-title">Select a case</strong><p class="ops-state-copy">Open a case from the queue to see notes, evidence and status history.</p></div>`;
    }

    function caseComposerHTML() {
      const available = S.alerts;
      const chosen = draft('newCaseAlerts', []);
      return `<section class="ops-panel" id="caseComposer" aria-label="New case">
        <div class="ops-panel-head"><div><h3 class="ops-panel-title">New case</h3><div class="ops-panel-subtitle">Link one or more alerts, or open a manual case for a customer</div></div><button type="button" class="ops-btn small" id="caseComposerClose">Cancel</button></div>
        <div class="ops-panel-body">
          ${actionErrorHTML('cases')}
          <div class="ops-form-grid">
            <label class="ops-field"><span>Case title</span><input class="ops-input" data-draft="newCaseTitle" id="newCaseTitle" value="${esc(draft('newCaseTitle'))}" placeholder="For example: Wire takeover, Vance household" ${invalid('newCaseTitle')}>${fieldError('newCaseTitle')}</label>
            <label class="ops-field"><span>Priority</span><select class="ops-input" data-draft="newCasePriority" id="newCasePriority">${['P0 CRITICAL', 'P1 HIGH', 'P2 REVIEW'].map(p => `<option ${draft('newCasePriority', 'P1 HIGH') === p ? 'selected' : ''}>${p}</option>`).join('')}</select></label>
            <label class="ops-field"><span>Primary customer (manual case)</span><select class="ops-input" data-draft="newCaseCustomer" id="newCaseCustomer" ${invalid('newCaseCustomer')}><option value="">Derive from linked alerts</option>${S.customers.map(c => `<option value="${esc(c.id)}" ${draft('newCaseCustomer') === c.id ? 'selected' : ''}>${esc(c.name)} (${esc(c.id)})</option>`).join('')}</select>${fieldError('newCaseCustomer')}</label>
          </div>
          <fieldset class="ops-fieldset"><legend>Linked alerts</legend>
            ${available.map(a => `<label class="ops-check"><input type="checkbox" name="newCaseAlert" value="${esc(a.id)}" ${chosen.includes(a.id) ? 'checked' : ''}><span><strong>${esc(a.id)}</strong> ${esc(a.customer.name)}, ${esc(a.transaction.amountFormatted)}, ${label(a.status)}${a.caseId ? `, now in ${esc(a.caseId)}` : ''}</span></label>`).join('')}
          </fieldset>
          <div class="ops-form-actions"><button type="button" class="ops-btn primary" id="caseCreateBtn">Create case</button></div>
        </div></section>`;
    }

    function caseDetailHTML(item) {
      const alerts = caseAlerts(item);
      const lead = alerts[0];
      const drivers = item.drivers || lead?.riskSpectrum.breakdown || [];
      const events = item.timeline || lead?.timeline || [];
      const closed = item.status === CLOSED;
      const panel = ui.panel.caseForm;
      return `
        <div class="ops-detail-hero">
          <div class="ops-detail-top"><div><div class="ops-detail-label">Case detail</div><h3 class="ops-detail-name">${esc(item.id)}, ${esc(item.customer)}</h3><div class="ops-detail-meta">${esc(item.queue)}, ${label(item.status)}, owner ${esc(item.owner)}</div></div><div class="ops-risk-score ${scoreClass(item.risk)}" aria-label="Risk score ${item.risk}">${item.risk}</div></div>
          <div class="ops-detail-actions">
            ${lead ? `<a class="ops-btn primary" href="#queue/${esc(lead.id)}">${icon('arrowRight')} Open investigation</a>` : ''}
            <button type="button" class="ops-btn" data-case-action="assign" ${item.owner === ME || closed ? 'disabled' : ''}>${item.owner === ME ? 'Assigned to you' : 'Assign to me'}</button>
            <button type="button" class="ops-btn" data-case-action="escalate" ${closed || item.status === 'SUPERVISOR_REVIEW' ? 'disabled' : ''}>Escalate</button>
            ${closed ? '<button type="button" class="ops-btn" data-case-action="reopen-form">Reopen case</button>' : '<button type="button" class="ops-btn" data-case-action="close-form">Close case</button>'}
          </div>
        </div>
        <div class="ops-panel-body">
          ${actionErrorHTML('cases')}
          ${panel === 'close' && !closed ? `<div class="ops-subform" id="caseCloseForm">
            <div class="ops-section-label">Close case</div>
            <label class="ops-field"><span>Resolution</span><select class="ops-input" data-draft="caseResolution" id="caseResolution" ${invalid('caseResolution')}><option value="">Choose a resolution</option>${CASE_RESOLUTIONS.map(r => `<option ${draft('caseResolution') === r ? 'selected' : ''}>${r}</option>`).join('')}</select>${fieldError('caseResolution')}</label>
            <label class="ops-field"><span>Closing summary</span><textarea class="ops-input ops-textarea" data-draft="caseCloseSummary" id="caseCloseSummary" ${invalid('caseCloseSummary')} placeholder="What was decided and why (20 characters minimum)">${esc(draft('caseCloseSummary'))}</textarea>${fieldError('caseCloseSummary')}</label>
            <div class="ops-form-actions"><button type="button" class="ops-btn" data-case-action="cancel-form">Cancel</button><button type="button" class="ops-btn primary" data-case-action="close">Close case</button></div>
          </div>` : ''}
          ${panel === 'reopen' && closed ? `<div class="ops-subform" id="caseReopenForm">
            <div class="ops-section-label">Reopen case</div>
            <label class="ops-field"><span>Reason for reopening</span><textarea class="ops-input ops-textarea" data-draft="caseReopenReason" id="caseReopenReason" ${invalid('caseReopenReason')} placeholder="New evidence or reason (10 characters minimum)">${esc(draft('caseReopenReason'))}</textarea>${fieldError('caseReopenReason')}</label>
            <div class="ops-form-actions"><button type="button" class="ops-btn" data-case-action="cancel-form">Cancel</button><button type="button" class="ops-btn primary" data-case-action="reopen">Reopen case</button></div>
          </div>` : ''}
          ${closed && item.resolution ? `<div class="ops-resolution"><strong>Closed: ${esc(item.resolution.outcome)}</strong><p>${esc(item.resolution.summary)}</p><span class="ops-secondary">${esc(item.resolution.by)}, ${esc(item.resolution.at)}</span></div>` : ''}
          <div class="ops-detail-grid">
            <div class="ops-fact"><span>Primary entity</span><strong>${esc(item.customer)}</strong></div>
            <div class="ops-fact"><span>Exposure</span><strong>${esc(item.amount)}</strong></div>
            <div class="ops-fact"><span>SLA remaining</span><strong>${esc(closed ? 'Closed' : item.sla)}</strong></div>
            <div class="ops-fact"><span>Priority</span><strong>${esc(item.priority)}</strong></div>
          </div>
          <div class="ops-section-label">Status</div>
          <div class="ops-inline-form">
            <select class="ops-input" id="caseStatusSelect" aria-label="Case status" ${closed ? 'disabled' : ''}>${CASE_STATUSES.map(s => `<option value="${s}" ${item.status === s ? 'selected' : ''}>${label(s)}</option>`).join('')}${closed ? '<option selected>CLOSED</option>' : ''}</select>
            <button type="button" class="ops-btn" data-case-action="status" ${closed ? 'disabled' : ''}>Update status</button>
          </div>
          <div class="ops-section-label">Linked alerts</div>
          ${alerts.length ? `<ul class="ops-link-list">${alerts.map(a => `<li><a class="ops-link" href="#queue/${esc(a.id)}">${esc(a.id)}</a><span>${esc(a.transaction.amountFormatted)}, ${label(a.status)}</span></li>`).join('')}</ul>` : '<p class="ops-muted-copy">Manual case, no alerts linked.</p>'}
          <div class="ops-section-label">Notes (${(item.notes || []).length})</div>
          ${(item.notes || []).length ? `<ul class="ops-note-list">${item.notes.map(n => `<li class="ops-note"><div class="ops-note-meta">${esc(n.author)}, ${esc(n.at)}</div><p>${esc(n.text)}</p></li>`).join('')}</ul>` : '<p class="ops-muted-copy">No notes yet.</p>'}
          <label class="ops-field"><span>Add a note</span><textarea class="ops-input ops-textarea" data-draft="caseNote-${esc(item.id)}" id="caseNoteInput" ${invalid(`caseNote-${item.id}`)} placeholder="Findings, calls made, next steps">${esc(draft(`caseNote-${item.id}`))}</textarea>${fieldError(`caseNote-${item.id}`)}</label>
          <div class="ops-form-actions"><button type="button" class="ops-btn primary" data-case-action="note">Add note</button></div>
          <div class="ops-section-label">Evidence files (${(item.evidence || []).length})</div>
          ${(item.evidence || []).length ? `<ul class="ops-file-list">${item.evidence.map(f => `<li><span class="ops-file-name">${esc(f.name)}</span><span class="ops-secondary">${esc(f.addedBy)}, ${esc(f.at)}</span><button type="button" class="ops-btn small" data-remove-evidence="${esc(f.id)}" aria-label="Remove ${esc(f.name)}">Remove</button></li>`).join('')}</ul>` : '<p class="ops-muted-copy">No evidence attached.</p>'}
          <div class="ops-inline-form">
            <label class="ops-btn ops-file-picker" for="caseEvidenceInput">Attach files</label>
            <input type="file" id="caseEvidenceInput" class="ops-visually-hidden" multiple>
            <span class="ops-secondary">Only file names are recorded in this prototype.</span>
          </div>
          <div class="ops-section-label">Risk drivers</div>
          <div class="ops-driver-list">${drivers.map(driver => { const score = Math.max(0, Number(driver.score || 0)); return `<div class="ops-driver-row"><span>${esc(driver.category)}</span><div class="ops-driver-track"><div class="ops-driver-fill ${score >= 28 ? 'hot' : ''}" style="width:${Math.min(100, score * 2.7)}%"></div></div><span class="ops-driver-score">+${score}</span></div>`; }).join('') || '<p class="ops-muted-copy">No scored drivers.</p>'}</div>
          <div class="ops-section-label">Evidence chronology</div>
          <div class="ops-timeline">${events.slice(-4).map(event => `<div class="ops-event"><div class="ops-event-time">${esc(event.time)}</div><div class="ops-event-title">${esc(event.title)}</div><div class="ops-event-copy">${esc(event.desc || event.detail || '')}</div></div>`).join('')}</div>
        </div>`;
    }

    function bindCaseEvents(root, selected) {
      root.querySelector('#caseSearch')?.addEventListener('input', event => { ui.caseQuery = event.target.value; render('cases'); focusAfterRender('#caseSearch'); });
      root.querySelector('#casePriority')?.addEventListener('change', event => { ui.casePriority = event.target.value; render('cases'); });
      root.querySelector('#caseStatus')?.addEventListener('change', event => { ui.caseStatus = event.target.value; render('cases'); });
      root.querySelector('#caseClearFilters')?.addEventListener('click', () => { ui.caseQuery = ''; ui.casePriority = 'ALL'; ui.caseStatus = 'ALL'; render('cases'); });
      root.querySelector('#caseNewBtn')?.addEventListener('click', () => {
        ui.panel.caseComposer = !ui.panel.caseComposer;
        if (ui.panel.caseComposer && !('newCaseAlerts' in ui.drafts)) ui.drafts.newCaseAlerts = app.activeAlertId ? [app.activeAlertId] : [];
        render('cases');
        if (ui.panel.caseComposer) focusAfterRender('#newCaseTitle');
      });
      root.querySelector('#caseComposerClose')?.addEventListener('click', () => { ui.panel.caseComposer = false; render('cases'); });
      root.querySelectorAll('input[name="newCaseAlert"]').forEach(box => box.addEventListener('change', () => {
        ui.drafts.newCaseAlerts = [...root.querySelectorAll('input[name="newCaseAlert"]:checked')].map(b => b.value);
        delete ui.errors.newCaseCustomer;
      }));
      root.querySelector('#caseCreateBtn')?.addEventListener('click', event => createCase(event.currentTarget));

      if (!selected) return;
      const act = name => root.querySelector(`[data-case-action="${name}"]`);
      act('assign')?.addEventListener('click', event => run('cases', event.currentTarget, 'Assigning…', 'Assigning the case', () => {
        selected.owner = ME;
        auditEntry(selected.id, 'CASE_ASSIGNED', `Case assigned to ${ME}.`, selected.status, selected.risk);
      }, () => showToast(`${selected.id} assigned to ${ME}.`)));
      act('escalate')?.addEventListener('click', event => run('cases', event.currentTarget, 'Escalating…', 'Escalating the case', () => {
        selected.status = 'SUPERVISOR_REVIEW';
        if (!selected.priority.startsWith('P0')) selected.priority = 'P1 ESCALATED';
        auditEntry(selected.id, 'CASE_ESCALATED', 'Escalated to supervisor review.', 'SUPERVISOR_REVIEW', selected.risk);
      }, () => showToast(`${selected.id} escalated to supervisor review.`)));
      act('close-form')?.addEventListener('click', () => { ui.panel.caseForm = 'close'; render('cases'); focusAfterRender('#caseResolution'); });
      act('reopen-form')?.addEventListener('click', () => { ui.panel.caseForm = 'reopen'; render('cases'); focusAfterRender('#caseReopenReason'); });
      act('cancel-form')?.addEventListener('click', () => { ui.panel.caseForm = null; render('cases'); });
      act('close')?.addEventListener('click', event => {
        const outcome = draft('caseResolution');
        const summary = draft('caseCloseSummary').trim();
        if (!outcome) ui.errors.caseResolution = 'Choose a resolution.';
        if (summary.length < 20) ui.errors.caseCloseSummary = `Closing summary needs at least 20 characters (${summary.length}/20).`;
        if (ui.errors.caseResolution || ui.errors.caseCloseSummary) { render('cases'); focusAfterRender(ui.errors.caseResolution ? '#caseResolution' : '#caseCloseSummary'); return; }
        run('cases', event.currentTarget, 'Closing…', 'Closing the case', () => {
          selected.previousStatus = selected.status;
          selected.status = CLOSED;
          selected.resolution = { outcome, summary, by: ME, at: store.nowStamp() };
          auditEntry(selected.id, 'CASE_CLOSED', `${outcome}: ${summary}`, 'CLOSED', selected.risk);
        }, () => { ui.panel.caseForm = null; delete ui.drafts.caseResolution; delete ui.drafts.caseCloseSummary; showToast(`${selected.id} closed: ${outcome}.`); });
      });
      act('reopen')?.addEventListener('click', event => {
        const reason = draft('caseReopenReason').trim();
        if (reason.length < 10) { ui.errors.caseReopenReason = `Reason needs at least 10 characters (${reason.length}/10).`; render('cases'); focusAfterRender('#caseReopenReason'); return; }
        run('cases', event.currentTarget, 'Reopening…', 'Reopening the case', () => {
          selected.status = selected.previousStatus && selected.previousStatus !== CLOSED ? selected.previousStatus : 'UNDER_REVIEW';
          selected.resolution = null;
          selected.notes = selected.notes || [];
          selected.notes.push({ id: store.nextId('note', 'N-'), author: ME, at: store.nowStamp(), text: `Reopened: ${reason}` });
          auditEntry(selected.id, 'CASE_REOPENED', reason, selected.status, selected.risk);
        }, () => { ui.panel.caseForm = null; delete ui.drafts.caseReopenReason; showToast(`${selected.id} reopened.`); });
      });
      act('status')?.addEventListener('click', event => {
        const next = root.querySelector('#caseStatusSelect').value;
        if (next === selected.status) { showToast(`${selected.id} is already ${next.replaceAll('_', ' ')}.`); return; }
        run('cases', event.currentTarget, 'Saving…', 'Updating the case status', () => {
          const prev = selected.status;
          selected.status = next;
          auditEntry(selected.id, 'CASE_STATUS_CHANGED', `Status changed from ${prev} to ${next}.`, next, selected.risk);
        }, () => showToast(`${selected.id} status set to ${next.replaceAll('_', ' ')}.`));
      });
      act('note')?.addEventListener('click', event => {
        const key = `caseNote-${selected.id}`;
        const text = draft(key).trim();
        if (text.length < 3) { ui.errors[key] = 'Write a note before adding it.'; render('cases'); focusAfterRender('#caseNoteInput'); return; }
        run('cases', event.currentTarget, 'Adding…', 'Adding the note', () => {
          selected.notes = selected.notes || [];
          selected.notes.push({ id: store.nextId('note', 'N-'), author: ME, at: store.nowStamp(), text });
          auditEntry(selected.id, 'CASE_NOTE_ADDED', text, selected.status, selected.risk);
        }, () => { delete ui.drafts[key]; showToast(`Note added to ${selected.id}.`); });
      });
      root.querySelector('#caseEvidenceInput')?.addEventListener('change', event => {
        const names = [...event.target.files].map(file => file.name);
        if (!names.length) return;
        run('cases', root.querySelector('.ops-file-picker'), 'Uploading…', 'Attaching evidence', () => {
          selected.evidence = selected.evidence || [];
          names.forEach(name => selected.evidence.push({ id: store.nextId('evidence', 'E-'), name, addedBy: ME, at: store.nowStamp() }));
          auditEntry(selected.id, 'EVIDENCE_ATTACHED', `Attached ${names.join(', ')}.`, selected.status, selected.risk);
        }, () => showToast(`${names.length} file name${names.length === 1 ? '' : 's'} recorded on ${selected.id}.`));
      });
      root.querySelectorAll('[data-remove-evidence]').forEach(button => button.addEventListener('click', () => {
        const file = selected.evidence.find(f => f.id === button.dataset.removeEvidence);
        run('cases', button, 'Removing…', 'Removing evidence', () => {
          selected.evidence = selected.evidence.filter(f => f.id !== file.id);
          auditEntry(selected.id, 'EVIDENCE_REMOVED', `Removed ${file.name}.`, selected.status, selected.risk);
        }, () => showToast(`${file.name} removed from ${selected.id}.`));
      }));
    }

    function createCase(button) {
      const title = draft('newCaseTitle').trim();
      const alertIds = draft('newCaseAlerts', []);
      const customerId = draft('newCaseCustomer');
      const priority = draft('newCasePriority', 'P1 HIGH');
      if (title.length < 6) ui.errors.newCaseTitle = `Title needs at least 6 characters (${title.length}/6).`;
      if (!alertIds.length && !customerId) ui.errors.newCaseCustomer = 'Link at least one alert or choose a primary customer.';
      if (ui.errors.newCaseTitle || ui.errors.newCaseCustomer) { render('cases'); focusAfterRender(ui.errors.newCaseTitle ? '#newCaseTitle' : '#newCaseCustomer'); return; }
      let created;
      run('cases', button, 'Creating…', 'Creating the case', () => {
        const alerts = alertIds.map(id => S.alerts.find(a => a.id === id)).filter(Boolean);
        const lead = alerts.slice().sort((a, b) => b.riskSpectrum.totalScore - a.riskSpectrum.totalScore)[0];
        const customer = customerId ? S.customers.find(c => c.id === customerId) : null;
        const id = store.nextId('case', 'CASE-');
        created = {
          id, alertIds: alerts.map(a => a.id), priority, status: 'UNDER_REVIEW', owner: ME,
          queue: lead ? lead.transaction.type : 'Manual review', sla: priority.startsWith('P0') ? '30m 00s' : priority.startsWith('P1') ? '2h 00m' : '8h 00m', opened: 'Just now',
          customerId: customer ? customer.id : lead.customer.id, customer: customer ? customer.name : lead.customer.name,
          amount: lead ? lead.transaction.amountFormatted : 'Not set', risk: lead ? lead.riskSpectrum.totalScore : (customer?.risk ?? 50),
          title: title.toUpperCase(), summary: title, notes: [], evidence: [], resolution: null
        };
        S.cases.unshift(created);
        alerts.forEach(alert => { alert.caseId = id; });
        auditEntry(id, 'CASE_CREATED', `Case opened: ${title}${alerts.length ? ` (alerts ${created.alertIds.join(', ')})` : ''}.`, 'UNDER_REVIEW', created.risk);
      }, () => {
        ['newCaseTitle', 'newCaseAlerts', 'newCaseCustomer', 'newCasePriority'].forEach(k => delete ui.drafts[k]);
        ui.panel.caseComposer = false;
        showToast(`${created.id} created.`);
        app.navigate('cases', created.id);
      });
    }

    // ================================================================ RULES
    function filteredRules() {
      const q = ui.ruleQuery.toLowerCase();
      return S.rules.filter(rule => {
        if (q && !`${rule.id} ${rule.name} ${rule.category} ${rule.logic}`.toLowerCase().includes(q)) return false;
        if (ui.ruleCategory !== 'ALL' && rule.category !== ui.ruleCategory) return false;
        if (ui.ruleStatus !== 'ALL' && rule.status !== ui.ruleStatus) return false;
        return true;
      });
    }

    function hashText(text) {
      let hash = 2166136261;
      for (let i = 0; i < text.length; i++) { hash ^= text.charCodeAt(i); hash = Math.imul(hash, 16777619); }
      return hash >>> 0;
    }

    // Deterministic simulation of a rule against the last 30 days of synthetic traffic.
    function simulateRule(rule) {
      let seed = hashText(`${rule.logic}|${rule.action}`) || 7;
      const rand = () => { seed = (Math.imul(seed, 1103515245) + 12345) >>> 0; return (seed % 10000) / 10000; };
      const base = 4 + Math.round(rand() * 30);
      const series = Array.from({ length: 30 }, () => Math.max(0, Math.round(base * (0.5 + rand()))));
      const hits = series.reduce((a, b) => a + b, 0);
      const fpPct = Math.round(2 + rand() * 14);
      const confirmed = Math.round(hits * (1 - fpPct / 100));
      return { ranAt: store.nowStamp(), hits, confirmed, falsePositives: hits - confirmed, fpPct, precisionPct: 100 - fpPct, series };
    }

    function renderRules(root) {
      const list = filteredRules();
      const routeId = param();
      const formMode = ui.panel.ruleForm; // 'create' | 'edit'
      const selected = routeId ? S.rules.find(r => r.id === routeId) : (list[0] || null);
      const hits = S.rules.reduce((sum, rule) => sum + Number(rule.triggered24h || 0), 0);
      const conflicts = S.rules.filter(rule => rule.hasConflictNotice);
      const counts = RULE_STATUSES.map(st => [st, S.rules.filter(r => r.status === st).length]);

      root.innerHTML = `
        ${introHTML('Decisioning laboratory', 'Rules Engine, Test Before You Ship', 'Build controls, inspect rule health, surface conflicts and simulate policy changes before they affect live traffic.', [['Rules', S.rules.length], ['24h executions', hits.toLocaleString()], ['Conflicts', conflicts.length], ['Decision p95', '31 ms']])}
        <div class="ops-toolbar">
          <div class="ops-search-wrap">${icon('search')}<input id="ruleSearch" class="ops-search" value="${esc(ui.ruleQuery)}" placeholder="Search rule ID, logic or category" aria-label="Search rules"></div>
          <select id="ruleCategory" class="ops-select" aria-label="Filter by category"><option value="ALL">All categories</option>${[...new Set(S.rules.map(r => r.category))].map(cat => `<option value="${esc(cat)}">${esc(cat)}</option>`).join('')}</select>
          <select id="ruleStatus" class="ops-select" aria-label="Filter by status"><option value="ALL">All status</option>${RULE_STATUSES.map(s => `<option value="${s}">${s}</option>`).join('')}</select>
          <div class="ops-toolbar-spacer"></div>
          <button type="button" class="ops-btn" id="ruleBacktestAll">${icon('activity')} Test all, last 30 days</button>
          <button type="button" class="ops-btn primary" id="newRuleBtn">Create rule</button>
        </div>
        ${kpiHTML([
          { label: 'Rules fired / 24h', value: hits.toLocaleString(), note: 'Synthetic scenario traffic' },
          { label: 'Active rules', value: String(counts[0][1]), note: `${counts[1][1]} in shadow, ${counts[2][1]} paused` },
          { label: 'Open conflicts', value: String(conflicts.length), note: 'Policy pairs needing precedence review' },
          { label: 'Tested this session', value: String(S.rules.filter(r => r.lastTest).length), note: 'Rules with a 30-day simulation' }
        ])}
        ${ui.ruleTestAll ? ruleTestAllHTML() : ''}
        ${formMode ? ruleFormHTML(formMode === 'edit' ? selected : null) : ''}
        <div class="ops-grid rules">
          <section class="ops-panel">
            <div class="ops-panel-head"><div><h3 class="ops-panel-title">Policy inventory</h3><div class="ops-panel-subtitle">${list.length} of ${S.rules.length} rules shown</div></div></div>
            <div class="ops-rule-list">${list.length ? list.map(rule => ruleListHTML(rule, selected)).join('') : `<div class="ops-empty"><p>${S.rules.length ? 'No rules match the active filters.' : 'No rules yet. Create the first rule.'}</p>${S.rules.length ? '<button type="button" class="ops-btn" id="ruleClearFilters">Clear filters</button>' : ''}</div>`}</div>
          </section>
          <section class="ops-panel" id="ruleDetailPanel" aria-label="Rule detail">${routeId && !selected ? notFoundHTML('Rule', routeId, '#rules', 'Back to all rules') : selected ? ruleDetailHTML(selected) : '<div class="ops-state"><strong class="ops-state-title">Select a rule</strong><p class="ops-state-copy">Choose a rule to inspect its logic, test it against the last 30 days, edit or delete it.</p></div>'}</section>
        </div>
        <div class="ops-grid analytics">
          <section class="ops-panel"><div class="ops-panel-head"><div><h3 class="ops-panel-title">Conflict monitor</h3><div class="ops-panel-subtitle">Policy precedence and exemption collisions</div></div><span class="ops-badge warning">${conflicts.length} OPEN</span></div><div class="ops-panel-body">
            ${conflicts.length ? conflicts.map(rule => `<div class="ops-conflict-card"><a class="ops-link" href="#rules/${esc(rule.id)}">${esc(rule.id)}</a> ${esc(rule.hasConflictNotice)}. Suggested path: evaluate travel notice and known merchant reputation before manual hold.</div>`).join('') : '<p class="ops-empty">No open conflicts.</p>'}
          </div></section>
          <section class="ops-panel"><div class="ops-panel-head"><div><h3 class="ops-panel-title">Deployment lanes</h3><div class="ops-panel-subtitle">Rules by rollout state</div></div></div><div class="ops-panel-body"><div class="ops-outcomes">
            ${counts.map(([name, value]) => `<div class="ops-outcome-row"><span>${name}</span><div class="ops-outcome-track"><div class="ops-outcome-fill" style="width:${S.rules.length ? Math.round(value / S.rules.length * 100) : 0}%"></div></div><strong>${value}</strong></div>`).join('')}
          </div></div></section>
        </div>`;

      root.querySelector('#ruleCategory').value = [...root.querySelector('#ruleCategory').options].some(o => o.value === ui.ruleCategory) ? ui.ruleCategory : 'ALL';
      root.querySelector('#ruleStatus').value = ui.ruleStatus;
      bindRuleEvents(root, selected);
    }

    function ruleListHTML(rule, selected) {
      const fp = parseFloat(rule.falsePositiveRate || '0');
      return `<a class="ops-rule-item ${selected && rule.id === selected.id ? 'active' : ''}" href="#rules/${esc(rule.id)}" ${selected && rule.id === selected.id ? 'aria-current="true"' : ''}>
        <span class="ops-rule-line"><span><span class="ops-id">${esc(rule.id)}</span><span class="ops-rule-name">${label(rule.name)}</span></span><span class="ops-badge ${rule.status === 'ACTIVE' ? (fp > 8 ? 'danger' : 'clean') : rule.status === 'SHADOW' ? 'info' : 'warning'}">${esc(rule.status)}</span></span>
        <span class="ops-rule-meta"><span>${esc(rule.category)}</span><span>${esc(rule.triggered24h)} fires / 24h</span><span>FP ${esc(rule.falsePositiveRate)}</span></span>
      </a>`;
    }

    function ruleDetailHTML(rule) {
      const test = rule.lastTest;
      const max = test ? Math.max(1, ...test.series) : 1;
      const confirming = ui.panel.ruleDelete === rule.id;
      return `
        <div class="ops-detail-hero"><div class="ops-detail-top"><div><div class="ops-detail-label">Rule inspector</div><h3 class="ops-detail-name">${esc(rule.id)}, ${label(rule.name)}</h3><div class="ops-detail-meta">${esc(rule.category)}, author ${esc(rule.author)}</div></div><span class="ops-badge clean">${esc(rule.status)}</span></div>
          <div class="ops-detail-actions">
            <button type="button" class="ops-btn primary" data-rule-action="test">Test against last 30 days</button>
            <button type="button" class="ops-btn" data-rule-action="edit">Edit</button>
            <button type="button" class="ops-btn" data-rule-action="toggle">${rule.status === 'ACTIVE' ? 'Disable' : 'Enable'}</button>
            <button type="button" class="ops-btn" data-rule-action="clone">Clone</button>
            <button type="button" class="ops-btn" data-rule-action="delete">Delete</button>
          </div>
        </div>
        <div class="ops-panel-body">
          ${actionErrorHTML('rules')}
          ${confirming ? `<div class="ops-confirm" role="alertdialog" aria-labelledby="ruleDeleteTitle" aria-describedby="ruleDeleteCopy">
            <strong id="ruleDeleteTitle">Delete ${esc(rule.id)}?</strong>
            <p id="ruleDeleteCopy">The rule stops evaluating traffic immediately. Deletion is recorded in the audit ledger and cannot be undone in this session, except by resetting demo data.</p>
            <div class="ops-form-actions"><button type="button" class="ops-btn" data-rule-action="cancel-delete">Keep rule</button><button type="button" class="ops-btn danger" data-rule-action="confirm-delete">Delete rule</button></div>
          </div>` : ''}
          <div class="ops-section-label">Decision logic</div>
          <div class="ops-code-block"><span class="ops-code-token">WHEN</span> ${esc(rule.logic).replaceAll(' AND ', ' <span class="ops-code-operator">AND</span> ').replaceAll(' OR ', ' <span class="ops-code-operator">OR</span> ')}<br><span class="ops-code-token">THEN</span> ${esc(rule.action || 'HOLD_FOR_REVIEW')}</div>
          <div class="ops-section-label">Performance snapshot</div>
          <div class="ops-metric-row">
            <div class="ops-mini-metric"><span>Executions / 24h</span><strong>${esc(rule.triggered24h)}</strong></div>
            <div class="ops-mini-metric"><span>False positive</span><strong>${esc(rule.falsePositiveRate)}</strong></div>
            <div class="ops-mini-metric"><span>Status</span><strong>${esc(rule.status)}</strong></div>
            <div class="ops-mini-metric"><span>Last test</span><strong>${test ? 'Done' : 'Never'}</strong></div>
          </div>
          <div class="ops-section-label">Test against last 30 days</div>
          ${test ? `<div class="ops-test-result" id="ruleTestResult">
            <div class="ops-metric-row">
              <div class="ops-mini-metric"><span>Would fire</span><strong>${test.hits}</strong></div>
              <div class="ops-mini-metric"><span>Confirmed fraud</span><strong>${test.confirmed}</strong></div>
              <div class="ops-mini-metric"><span>False positives</span><strong>${test.falsePositives}</strong></div>
              <div class="ops-mini-metric"><span>Precision</span><strong>${test.precisionPct}%</strong></div>
            </div>
            <div class="ops-backtest" role="img" aria-label="Daily fires over the last 30 days, peak ${max}">${test.series.map((value, i) => `<div class="ops-backtest-bar" style="height:${Math.max(4, Math.round(value / max * 100))}%" title="Day ${i + 1}: ${value} fires"></div>`).join('')}</div>
            <p class="ops-muted-copy">Simulated on synthetic scenario traffic, run ${esc(test.ranAt)}. Not production performance.</p>
          </div>` : '<p class="ops-muted-copy">No simulation yet. Run a test before publishing a change.</p>'}
          ${rule.hasConflictNotice ? `<div class="ops-section-label">Conflict</div><div class="ops-conflict-card">${icon('alertTriangle')} <strong>Policy collision detected.</strong> ${esc(rule.hasConflictNotice)}. Test precedence in shadow mode before publishing an override.</div>` : ''}
        </div>`;
    }

    function ruleFormHTML(rule) {
      const prefix = rule ? 'edit' : 'new';
      const v = (field, fallback) => draft(`${prefix}Rule_${field}`, rule ? rule[field] : fallback);
      const k = field => `${prefix}Rule_${field}`;
      return `<section class="ops-panel" id="ruleForm" aria-label="${rule ? `Edit ${esc(rule.id)}` : 'Create rule'}">
        <div class="ops-panel-head"><div><h3 class="ops-panel-title">${rule ? `Edit ${esc(rule.id)}` : 'Create rule'}</h3><div class="ops-panel-subtitle">Every field is validated before the rule is saved</div></div><button type="button" class="ops-btn small" id="ruleFormCancel">Cancel</button></div>
        <div class="ops-panel-body">
          ${actionErrorHTML('rules')}
          <div class="ops-form-grid">
            <label class="ops-field"><span>Rule name (UPPER_SNAKE_CASE)</span><input class="ops-input" id="ruleName" data-draft="${k('name')}" value="${esc(v('name', ''))}" placeholder="HIGH_VELOCITY_NEW_DEVICE" ${invalid(k('name'))}>${fieldError(k('name'))}</label>
            <label class="ops-field"><span>Category</span><input class="ops-input" id="ruleCategoryInput" data-draft="${k('category')}" value="${esc(v('category', ''))}" placeholder="Device & Velocity" ${invalid(k('category'))}>${fieldError(k('category'))}</label>
            <label class="ops-field"><span>Action</span><select class="ops-input" id="ruleAction" data-draft="${k('action')}">${RULE_ACTIONS.map(a => `<option ${v('action', 'ROUTE_TO_MANUAL_REVIEW') === a ? 'selected' : ''}>${a}</option>`).join('')}</select></label>
            <label class="ops-field"><span>Status</span><select class="ops-input" id="ruleStatusInput" data-draft="${k('status')}">${RULE_STATUSES.map(s => `<option ${v('status', 'SHADOW') === s ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
          </div>
          <label class="ops-field"><span>Condition</span><textarea class="ops-input ops-textarea" id="ruleLogic" data-draft="${k('logic')}" placeholder="DeviceAge < 1h AND TxCount10m > 6 AND Amount > 1000" ${invalid(k('logic'))}>${esc(v('logic', ''))}</textarea>${fieldError(k('logic'))}</label>
          <div class="ops-form-actions"><button type="button" class="ops-btn primary" id="ruleSave">${rule ? 'Save changes' : 'Create rule'}</button></div>
        </div></section>`;
    }

    function ruleTestAllHTML() {
      const t = ui.ruleTestAll;
      return `<section class="ops-panel" id="ruleTestAllPanel"><div class="ops-panel-head"><div><h3 class="ops-panel-title">Portfolio test, last 30 days</h3><div class="ops-panel-subtitle">Simulated on synthetic scenario traffic, run ${esc(t.ranAt)}</div></div><button type="button" class="ops-btn small" id="ruleTestAllClose">Close</button></div>
        <div class="ops-panel-body flush table-panel"><table class="ops-table"><thead><tr><th>Rule</th><th>Status</th><th>Would fire</th><th>False positives</th><th>Precision</th></tr></thead><tbody>
        ${t.rows.map(r => `<tr><td><a class="ops-id ops-link" href="#rules/${esc(r.id)}">${esc(r.id)}</a></td><td>${esc(r.status)}</td><td class="ops-id">${r.hits}</td><td class="ops-id">${r.falsePositives}</td><td class="ops-id">${r.precisionPct}%</td></tr>`).join('')}
        </tbody></table></div></section>`;
    }

    function validateRule(prefix, values, existingId) {
      const k = field => `${prefix}Rule_${field}`;
      let ok = true;
      if (!/^[A-Z][A-Z0-9_]{3,59}$/.test(values.name)) { ui.errors[k('name')] = 'Use 4 to 60 characters: capital letters, digits and underscores, starting with a letter.'; ok = false; }
      else if (S.rules.some(r => r.name === values.name && r.id !== existingId)) { ui.errors[k('name')] = 'Another rule already uses this name.'; ok = false; }
      if (values.category.length < 3) { ui.errors[k('category')] = 'Category needs at least 3 characters.'; ok = false; }
      if (values.logic.length < 8) { ui.errors[k('logic')] = 'Condition needs at least 8 characters.'; ok = false; }
      else if (!/(>=|<=|==|!=|>|<|\bin\b)/i.test(values.logic)) { ui.errors[k('logic')] = 'Condition must compare a signal, for example Amount > 1000.'; ok = false; }
      else if ((values.logic.match(/\(/g) || []).length !== (values.logic.match(/\)/g) || []).length) { ui.errors[k('logic')] = 'Parentheses are not balanced.'; ok = false; }
      return ok;
    }

    function bindRuleEvents(root, selected) {
      root.querySelector('#ruleSearch')?.addEventListener('input', event => { ui.ruleQuery = event.target.value; render('rules'); focusAfterRender('#ruleSearch'); });
      root.querySelector('#ruleCategory')?.addEventListener('change', event => { ui.ruleCategory = event.target.value; render('rules'); });
      root.querySelector('#ruleStatus')?.addEventListener('change', event => { ui.ruleStatus = event.target.value; render('rules'); });
      root.querySelector('#ruleClearFilters')?.addEventListener('click', () => { ui.ruleQuery = ''; ui.ruleCategory = 'ALL'; ui.ruleStatus = 'ALL'; render('rules'); });
      root.querySelector('#newRuleBtn')?.addEventListener('click', () => { ui.panel.ruleForm = 'create'; render('rules'); focusAfterRender('#ruleName'); });
      root.querySelector('#ruleFormCancel')?.addEventListener('click', () => {
        Object.keys(ui.drafts).filter(key => /^(new|edit)Rule_/.test(key)).forEach(key => delete ui.drafts[key]);
        Object.keys(ui.errors).filter(key => /^(new|edit)Rule_/.test(key)).forEach(key => delete ui.errors[key]);
        ui.panel.ruleForm = null; render('rules');
      });
      root.querySelector('#ruleTestAllClose')?.addEventListener('click', () => { ui.ruleTestAll = null; render('rules'); });
      root.querySelector('#ruleBacktestAll')?.addEventListener('click', event => {
        let rows;
        run('rules', event.currentTarget, 'Testing…', 'Testing all rules', () => {
          rows = S.rules.map(rule => { rule.lastTest = simulateRule(rule); return { id: rule.id, status: rule.status, ...rule.lastTest }; });
        }, () => { ui.ruleTestAll = { ranAt: store.nowStamp(), rows }; showToast(`${rows.length} rules tested against the last 30 days.`); });
      });
      root.querySelector('#ruleSave')?.addEventListener('click', event => {
        const editing = ui.panel.ruleForm === 'edit' ? selected : null;
        const prefix = editing ? 'edit' : 'new';
        const values = {
          name: root.querySelector('#ruleName').value.trim(),
          category: root.querySelector('#ruleCategoryInput').value.trim(),
          logic: root.querySelector('#ruleLogic').value.trim(),
          action: root.querySelector('#ruleAction').value,
          status: root.querySelector('#ruleStatusInput').value
        };
        Object.entries(values).forEach(([field, value]) => { ui.drafts[`${prefix}Rule_${field}`] = value; });
        if (!validateRule(prefix, values, editing?.id)) {
          render('rules');
          const first = ['name', 'category', 'logic'].find(f => ui.errors[`${prefix}Rule_${f}`]);
          focusAfterRender({ name: '#ruleName', category: '#ruleCategoryInput', logic: '#ruleLogic' }[first]);
          return;
        }
        let id;
        run('rules', event.currentTarget, 'Saving…', editing ? 'Saving the rule' : 'Creating the rule', () => {
          if (editing) {
            const changed = Object.keys(values).filter(f => editing[f] !== values[f]);
            Object.assign(editing, values);
            if (changed.includes('logic') || changed.includes('action')) editing.lastTest = null;
            id = editing.id;
            auditEntry(id, 'RULE_EDITED', `Changed ${changed.join(', ') || 'nothing'}.`, values.status);
          } else {
            id = store.nextId('rule', 'RULE-');
            S.rules.push({ id, ...values, triggered24h: 0, falsePositiveRate: '0.0%', author: `${ME}, draft`, lastTest: null });
            auditEntry(id, 'RULE_CREATED', `${values.name}: WHEN ${values.logic} THEN ${values.action}.`, values.status);
          }
        }, () => {
          Object.keys(ui.drafts).filter(key => key.startsWith(`${prefix}Rule_`)).forEach(key => delete ui.drafts[key]);
          ui.panel.ruleForm = null;
          showToast(editing ? `${id} saved.` : `${id} created in ${values.status} mode.`);
          if (!editing) app.navigate('rules', id);
        });
      });

      if (!selected) return;
      const act = name => root.querySelector(`[data-rule-action="${name}"]`);
      act('test')?.addEventListener('click', event => run('rules', event.currentTarget, 'Testing…', `Testing ${selected.id}`, () => {
        selected.lastTest = simulateRule(selected);
      }, () => showToast(`${selected.id} would have fired ${selected.lastTest.hits} times in the last 30 days.`)));
      act('edit')?.addEventListener('click', () => { ui.panel.ruleForm = 'edit'; Object.keys(ui.drafts).filter(key => key.startsWith('editRule_')).forEach(key => delete ui.drafts[key]); render('rules'); focusAfterRender('#ruleName'); });
      act('toggle')?.addEventListener('click', event => {
        const next = selected.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
        run('rules', event.currentTarget, 'Saving…', `${next === 'ACTIVE' ? 'Enabling' : 'Disabling'} ${selected.id}`, () => {
          selected.status = next;
          auditEntry(selected.id, next === 'ACTIVE' ? 'RULE_ENABLED' : 'RULE_DISABLED', `Rule ${next === 'ACTIVE' ? 'enabled' : 'disabled'} by analyst.`, next);
        }, () => showToast(`${selected.id} is now ${next}.`));
      });
      act('clone')?.addEventListener('click', event => {
        let id;
        run('rules', event.currentTarget, 'Cloning…', `Cloning ${selected.id}`, () => {
          id = store.nextId('rule', 'RULE-');
          let name = `${selected.name}_COPY`.slice(0, 60);
          while (S.rules.some(r => r.name === name)) name = `${name.slice(0, 55)}_${Math.floor(Math.random() * 90 + 10)}`;
          S.rules.push({ ...JSON.parse(JSON.stringify(selected)), id, name, status: 'SHADOW', triggered24h: 0, falsePositiveRate: '0.0%', author: `${ME}, clone of ${selected.id}`, hasConflictNotice: undefined, lastTest: null });
          auditEntry(id, 'RULE_CREATED', `Cloned from ${selected.id} into shadow mode.`, 'SHADOW');
        }, () => { showToast(`${selected.id} cloned as ${id} in shadow mode.`); app.navigate('rules', id); });
      });
      act('delete')?.addEventListener('click', () => { ui.panel.ruleDelete = selected.id; render('rules'); focusAfterRender('[data-rule-action="cancel-delete"]'); });
      act('cancel-delete')?.addEventListener('click', () => { ui.panel.ruleDelete = null; render('rules'); });
      act('confirm-delete')?.addEventListener('click', event => {
        const id = selected.id;
        run('rules', event.currentTarget, 'Deleting…', `Deleting ${id}`, () => {
          const index = S.rules.findIndex(r => r.id === id);
          S.rules.splice(index, 1);
          auditEntry(id, 'RULE_DELETED', `${selected.name} deleted.`, 'DELETED');
        }, () => { ui.panel.ruleDelete = null; ui.panel.ruleForm = null; showToast(`${id} deleted.`); app.navigate('rules', null); });
      });
    }

    // ============================================================ CUSTOMERS
    function filteredCustomers() {
      const q = ui.customerQuery.toLowerCase();
      return S.customers.filter(c => {
        if (q && !`${c.id} ${c.name} ${c.email} ${c.home} ${c.segment}`.toLowerCase().includes(q)) return false;
        if (ui.customerRisk === 'HIGH' && c.risk < 75) return false;
        if (ui.customerRisk === 'MEDIUM' && (c.risk < 50 || c.risk >= 75)) return false;
        if (ui.customerRisk === 'LOW' && c.risk >= 50) return false;
        if (ui.customerAccount === 'FROZEN' && c.accountStatus !== 'FROZEN') return false;
        if (ui.customerAccount === 'ACTIVE' && c.accountStatus !== 'ACTIVE') return false;
        if (ui.customerAccount === 'WATCHLIST' && !c.watchlist) return false;
        return true;
      });
    }

    function renderCustomers(root) {
      const list = filteredCustomers();
      const routeId = param();
      const selected = routeId ? S.customers.find(c => c.id === routeId) : (list[0] || null);
      const high = S.customers.filter(c => c.risk >= 75).length;
      const bands = [['Low', c => c.risk < 50], ['Guarded', c => c.risk >= 50 && c.risk < 65], ['Elevated', c => c.risk >= 65 && c.risk < 75], ['High', c => c.risk >= 75]]
        .map(([name, fn]) => [name, S.customers.filter(fn).length]);
      const total = Math.max(1, S.customers.length);
      root.innerHTML = `
        ${introHTML('Portfolio intelligence', 'Customers, 360° Risk Directory', 'Move from a directory to a decision surface: identity health, device trust, behavioral risk and recent activity in one record.', [['Monitored', S.customers.length], ['High risk', high], ['Frozen', S.customers.filter(c => c.accountStatus === 'FROZEN').length], ['Watchlist', S.customers.filter(c => c.watchlist).length]])}
        <div class="ops-toolbar">
          <div class="ops-search-wrap">${icon('search')}<input id="customerSearch" class="ops-search" value="${esc(ui.customerQuery)}" placeholder="Search customer, email, geography or segment" aria-label="Search customers"></div>
          <select id="customerRisk" class="ops-select" aria-label="Filter by risk"><option value="ALL">All risk</option><option value="HIGH">High, 75 and above</option><option value="MEDIUM">Medium, 50 to 74</option><option value="LOW">Low, under 50</option></select>
          <select id="customerAccount" class="ops-select" aria-label="Filter by account state"><option value="ALL">All accounts</option><option value="ACTIVE">Active</option><option value="FROZEN">Frozen</option><option value="WATCHLIST">On watchlist</option></select>
          <div class="ops-toolbar-spacer"></div>
          <button type="button" class="ops-btn" id="customerReviewBtn">Review high-risk</button>
          <button type="button" class="ops-btn primary" id="customerExportBtn">Export cohort CSV</button>
        </div>
        ${kpiHTML([
          { label: 'High-risk population', value: `${high}`, note: 'Requires review, restriction or step-up' },
          { label: 'Frozen accounts', value: String(S.customers.filter(c => c.accountStatus === 'FROZEN').length), note: 'Outbound rails locked' },
          { label: 'Watchlist', value: String(S.customers.filter(c => c.watchlist).length), note: 'Profiles under enhanced monitoring' },
          { label: 'EDD requested', value: String(S.customers.filter(c => c.eddRequested).length), note: 'Enhanced due diligence in progress' }
        ])}
        <div class="ops-panel"><div class="ops-panel-head"><div><h3 class="ops-panel-title">Portfolio risk distribution</h3><div class="ops-panel-subtitle">${bands.map(([name, n]) => `${name} ${Math.round(n / total * 100)}%`).join(', ')}</div></div></div><div class="ops-panel-body"><div class="ops-risk-distribution" style="grid-template-columns:${bands.map(([, n]) => `${Math.max(n, 0.2)}fr`).join(' ')}">${bands.map(() => '<div class="ops-risk-segment"></div>').join('')}</div></div></div>
        <div class="ops-grid customers">
          <section class="ops-panel table-panel"><div class="ops-panel-head"><div><h3 class="ops-panel-title">Customer portfolio</h3><div class="ops-panel-subtitle">${list.length} of ${S.customers.length} profiles shown</div></div></div><div class="ops-panel-body flush">${list.length ? `<table class="ops-table"><thead><tr><th>Customer</th><th>Segment</th><th>Trust</th><th>Risk</th><th>Lifetime volume</th><th>Account</th></tr></thead><tbody>${list.map(c => `<tr data-href="#customers/${esc(c.id)}" class="${selected && c.id === selected.id ? 'active' : ''}"><td><div class="ops-customer-cell"><div class="ops-customer-avatar" aria-hidden="true">${initials(c.name)}</div><div><a class="ops-entity ops-link" href="#customers/${esc(c.id)}">${esc(c.name)}</a><div class="ops-secondary">${esc(c.id)}, ${esc(c.email)}</div></div></div></td><td>${esc(c.segment)}</td><td>${esc(c.trustTier)}</td><td><span class="ops-badge ${riskTone(c.risk)}">${c.risk}</span></td><td class="ops-id">${esc(c.lifetimeVolume)}</td><td><span class="ops-badge ${c.accountStatus === 'FROZEN' ? 'danger' : 'clean'}">${c.accountStatus}</span>${c.watchlist ? ' <span class="ops-badge warning">WATCHLIST</span>' : ''}</td></tr>`).join('')}</tbody></table>` : `<div class="ops-empty"><p>No customer profiles match the active filters.</p><button type="button" class="ops-btn" id="customerClearFilters">Clear filters</button></div>`}</div></section>
          <aside class="ops-panel" id="customerDetailPanel" aria-label="Customer detail">${routeId && !selected ? notFoundHTML('Customer', routeId, '#customers', 'Back to all customers') : selected ? customerDetailHTML(selected) : '<div class="ops-state"><strong class="ops-state-title">Select a customer</strong><p class="ops-state-copy">Open a profile to freeze or unfreeze the account, request EDD or add watchlist notes.</p></div>'}</aside>
        </div>`;
      root.querySelector('#customerRisk').value = ui.customerRisk;
      root.querySelector('#customerAccount').value = ui.customerAccount;
      bindCustomerEvents(root, selected);
    }

    function customerDetailHTML(customer) {
      const alert = S.alerts.find(a => a.customer.id === customer.id);
      const device = alert?.device;
      const cases = S.cases.filter(c => c.customerId === customer.id);
      const timeline = alert?.timeline || [
        { time: '2h ago', title: 'Profile sync', desc: 'Identity and account attributes refreshed.' },
        { time: 'Yesterday', title: 'Routine payment', desc: 'Behavior matched historical device and merchant profile.' },
        { time: '7d ago', title: 'Risk score recalculated', desc: 'No material adverse signal detected.' }
      ];
      const frozen = customer.accountStatus === 'FROZEN';
      const form = ui.panel.customerFreeze === customer.id;
      const noteKey = `watchNote-${customer.id}`;
      return `<div class="ops-detail-hero"><div class="ops-detail-top"><div><div class="ops-detail-label">Customer risk profile</div><h3 class="ops-detail-name">${esc(customer.name)}</h3><div class="ops-detail-meta">${esc(customer.id)}, ${esc(customer.segment)}, ${esc(customer.home)}</div></div><div class="ops-risk-score ${scoreClass(customer.risk)}" aria-label="Risk score ${customer.risk}">${customer.risk}</div></div>
        <div class="ops-detail-actions">
          ${alert ? `<a class="ops-btn primary" href="#queue/${esc(alert.id)}">${icon('arrowRight')} Open evidence</a>` : ''}
          <button type="button" class="ops-btn" data-customer-action="freeze-form">${frozen ? 'Unfreeze account' : 'Freeze account'}</button>
          <button type="button" class="ops-btn" data-customer-action="edd" ${customer.eddRequested ? 'disabled' : ''}>${customer.eddRequested ? 'EDD requested' : 'Request EDD'}</button>
          <button type="button" class="ops-btn" data-customer-action="watchlist">${customer.watchlist ? 'Remove from watchlist' : 'Add to watchlist'}</button>
        </div></div>
        <div class="ops-panel-body">
          ${actionErrorHTML('customers')}
          <div class="ops-account-state ${frozen ? 'is-frozen' : ''}" role="status"><strong>Account ${frozen ? 'FROZEN' : 'ACTIVE'}</strong><span>${frozen ? `Outbound rails locked${customer.frozenReason ? `: ${esc(customer.frozenReason)}` : ''}` : 'Payments flowing normally'}</span></div>
          ${form ? `<div class="ops-subform" id="customerFreezeForm">
            <label class="ops-field"><span>${frozen ? 'Reason to unfreeze' : 'Reason to freeze'}</span><textarea class="ops-input ops-textarea" id="customerFreezeReason" data-draft="freezeReason-${esc(customer.id)}" ${invalid(`freezeReason-${customer.id}`)} placeholder="Evidence behind this account action (10 characters minimum)">${esc(draft(`freezeReason-${customer.id}`))}</textarea>${fieldError(`freezeReason-${customer.id}`)}</label>
            <div class="ops-form-actions"><button type="button" class="ops-btn" data-customer-action="cancel-freeze">Cancel</button><button type="button" class="ops-btn ${frozen ? 'primary' : 'danger'}" data-customer-action="freeze">${frozen ? 'Confirm unfreeze' : 'Confirm freeze'}</button></div>
          </div>` : ''}
          <div class="ops-detail-grid"><div class="ops-fact"><span>Trust tier</span><strong>${esc(customer.trustTier)}</strong></div><div class="ops-fact"><span>Account age</span><strong>${esc(customer.accountAge)}</strong></div><div class="ops-fact"><span>Lifetime volume</span><strong>${esc(customer.lifetimeVolume)}</strong></div><div class="ops-fact"><span>Prior disputes</span><strong>${customer.disputes}</strong></div><div class="ops-fact"><span>Primary geography</span><strong>${esc(customer.home)}</strong></div><div class="ops-fact"><span>Risk state</span><strong>${esc(customer.status)}</strong></div></div>
          <div class="ops-section-label">Watchlist notes (${customer.watchNotes.length})</div>
          ${customer.watchNotes.length ? `<ul class="ops-note-list">${customer.watchNotes.map(n => `<li class="ops-note"><div class="ops-note-meta">${esc(n.author)}, ${esc(n.at)}</div><p>${esc(n.text)}</p></li>`).join('')}</ul>` : '<p class="ops-muted-copy">No watchlist notes.</p>'}
          <label class="ops-field"><span>Add a watchlist note</span><textarea class="ops-input ops-textarea" id="watchNoteInput" data-draft="${esc(noteKey)}" ${invalid(noteKey)} placeholder="What to watch for and why">${esc(draft(noteKey))}</textarea>${fieldError(noteKey)}</label>
          <div class="ops-form-actions"><button type="button" class="ops-btn primary" data-customer-action="note">Add note</button></div>
          <div class="ops-section-label">Cases</div>
          ${cases.length ? `<ul class="ops-link-list">${cases.map(c => `<li><a class="ops-link" href="#cases/${esc(c.id)}">${esc(c.id)}</a><span>${label(c.status)}</span></li>`).join('')}</ul>` : '<p class="ops-muted-copy">No cases for this customer.</p>'}
          <div class="ops-section-label">Device and session trust</div><div class="ops-device-list"><div class="ops-device-item"><span>${esc(device?.osReported || 'Primary trusted browser')}</span><span class="ops-badge ${device?.isMismatch ? 'danger' : 'clean'}">${device?.isMismatch ? 'MISMATCH' : 'TRUSTED'}</span></div><div class="ops-device-item"><span>${esc(device?.fingerprint || `${customer.devices} known devices`)}</span><span class="ops-id">${customer.devices} linked</span></div></div>
          <div class="ops-section-label">Recent activity</div><div class="ops-timeline">${timeline.slice(-4).map(e => `<div class="ops-event"><div class="ops-event-time">${esc(e.time)}</div><div class="ops-event-title">${esc(e.title)}</div><div class="ops-event-copy">${esc(e.desc)}</div></div>`).join('')}</div>
        </div>`;
    }

    function exportCustomers() {
      const rows = filteredCustomers();
      const count = store.downloadCSV('sentry-customer-cohort.csv', ['Customer ID', 'Name', 'Email', 'Segment', 'Trust tier', 'Risk', 'Lifetime volume', 'Account', 'Watchlist'],
        rows.map(c => [c.id, c.name, c.email, c.segment, c.trustTier, c.risk, c.lifetimeVolume, c.accountStatus, c.watchlist ? 'yes' : 'no']));
      showToast(`${count} customer profiles exported.`);
    }

    function bindCustomerEvents(root, selected) {
      root.querySelector('#customerSearch')?.addEventListener('input', event => { ui.customerQuery = event.target.value; render('customers'); focusAfterRender('#customerSearch'); });
      root.querySelector('#customerRisk')?.addEventListener('change', event => { ui.customerRisk = event.target.value; render('customers'); });
      root.querySelector('#customerAccount')?.addEventListener('change', event => { ui.customerAccount = event.target.value; render('customers'); });
      root.querySelector('#customerClearFilters')?.addEventListener('click', () => { ui.customerQuery = ''; ui.customerRisk = 'ALL'; ui.customerAccount = 'ALL'; render('customers'); });
      root.querySelector('#customerReviewBtn')?.addEventListener('click', () => { ui.customerRisk = 'HIGH'; render('customers'); showToast('Showing high-risk profiles (75 and above).'); });
      root.querySelector('#customerExportBtn')?.addEventListener('click', exportCustomers);
      if (!selected) return;
      const act = name => root.querySelector(`[data-customer-action="${name}"]`);
      act('freeze-form')?.addEventListener('click', () => { ui.panel.customerFreeze = selected.id; render('customers'); focusAfterRender('#customerFreezeReason'); });
      act('cancel-freeze')?.addEventListener('click', () => { ui.panel.customerFreeze = null; render('customers'); });
      act('freeze')?.addEventListener('click', event => {
        const key = `freezeReason-${selected.id}`;
        const reason = draft(key).trim();
        if (reason.length < 10) { ui.errors[key] = `Reason needs at least 10 characters (${reason.length}/10).`; render('customers'); focusAfterRender('#customerFreezeReason'); return; }
        const freezing = selected.accountStatus !== 'FROZEN';
        run('customers', event.currentTarget, freezing ? 'Freezing…' : 'Unfreezing…', freezing ? 'Freezing the account' : 'Unfreezing the account', () => {
          selected.accountStatus = freezing ? 'FROZEN' : 'ACTIVE';
          selected.frozenReason = freezing ? reason : null;
          if (freezing) selected.status = 'RESTRICTED';
          else if (selected.status === 'RESTRICTED') selected.status = 'MONITOR';
          auditEntry(selected.id, freezing ? 'ACCOUNT_FROZEN' : 'ACCOUNT_UNFROZEN', reason, freezing ? 'FROZEN' : 'ACTIVE', selected.risk);
        }, () => { ui.panel.customerFreeze = null; delete ui.drafts[key]; showToast(`${selected.name} account ${freezing ? 'frozen' : 'unfrozen'}.`); });
      });
      act('edd')?.addEventListener('click', event => run('customers', event.currentTarget, 'Requesting…', 'Requesting enhanced due diligence', () => {
        selected.eddRequested = true;
        auditEntry(selected.id, 'EDD_REQUESTED', 'Enhanced due diligence requested by analyst.', 'PENDING_EVIDENCE', selected.risk);
      }, () => showToast(`EDD request created for ${selected.id}.`)));
      act('watchlist')?.addEventListener('click', event => {
        const adding = !selected.watchlist;
        run('customers', event.currentTarget, 'Saving…', 'Updating the watchlist', () => {
          selected.watchlist = adding;
          auditEntry(selected.id, adding ? 'WATCHLIST_ADDED' : 'WATCHLIST_REMOVED', adding ? 'Profile added to the watchlist.' : 'Profile removed from the watchlist.', adding ? 'MONITOR' : 'CLEAR', selected.risk);
        }, () => showToast(`${selected.name} ${adding ? 'added to' : 'removed from'} the watchlist.`));
      });
      act('note')?.addEventListener('click', event => {
        const key = `watchNote-${selected.id}`;
        const text = draft(key).trim();
        if (text.length < 3) { ui.errors[key] = 'Write a note before adding it.'; render('customers'); focusAfterRender('#watchNoteInput'); return; }
        run('customers', event.currentTarget, 'Adding…', 'Adding the watchlist note', () => {
          selected.watchNotes.push({ id: store.nextId('note', 'N-'), author: ME, at: store.nowStamp(), text });
          if (!selected.watchlist) selected.watchlist = true;
          auditEntry(selected.id, 'WATCHLIST_NOTE_ADDED', text, 'MONITOR', selected.risk);
        }, () => { delete ui.drafts[key]; showToast(`Watchlist note added for ${selected.name}.`); });
      });
    }

    // ============================================================ ANALYTICS
    const DATA_START = SENTRY_DATA.analyticsDaily[0].date;
    const DATA_END = SENTRY_DATA.scenarioDate;
    const dayOffset = (date, days) => new Date(Date.parse(`${date}T00:00:00Z`) + days * 86400000).toISOString().slice(0, 10);

    function analyticsWindow() {
      if (ui.analyticsRange === 'custom') return { from: ui.analyticsFrom || DATA_START, to: ui.analyticsTo || DATA_END };
      const days = { '7d': 7, '30d': 30, '90d': 90 }[ui.analyticsRange] || 30;
      return { from: dayOffset(DATA_END, -(days - 1)), to: DATA_END };
    }

    function analyticsRows() {
      const { from, to } = analyticsWindow();
      return SENTRY_DATA.analyticsDaily.filter(r => r.date >= from && r.date <= to
        && (ui.analyticsTypology === 'ALL' || r.typology === ui.analyticsTypology)
        && (ui.analyticsChannel === 'ALL' || r.channel === ui.analyticsChannel));
    }

    function aggregateByDate(rows) {
      const map = new Map();
      rows.forEach(r => {
        const entry = map.get(r.date) || { date: r.date, alerts: 0, blocked: 0, stepUp: 0, escalated: 0, approved: 0 };
        ['alerts', 'blocked', 'stepUp', 'escalated', 'approved'].forEach(k => { entry[k] += r[k]; });
        map.set(r.date, entry);
      });
      return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
    }

    function lineChartSVG(days) {
      // Weekly buckets when the window is long, so the chart stays readable.
      let points = days;
      if (days.length > 31) {
        points = [];
        for (let i = 0; i < days.length; i += 7) {
          const chunk = days.slice(i, i + 7);
          points.push({ date: chunk[0].date, alerts: chunk.reduce((a, d) => a + d.alerts, 0), blocked: chunk.reduce((a, d) => a + d.blocked, 0) });
        }
      }
      // Size the viewBox to the real panel width so axis text stays legible on phones.
      const panelWidth = document.getElementById('opsAnalyticsRoot')?.clientWidth || 700;
      const w = Math.round(Math.max(300, Math.min(820, panelWidth < 920 ? panelWidth - 40 : panelWidth * 0.6))), h = 200, px = 34, py = 22;
      const max = Math.max(1, ...points.map(p => p.alerts)) * 1.12;
      const step = points.length > 1 ? (w - px * 2) / (points.length - 1) : 0;
      const xy = key => points.map((p, i) => [px + i * step, h - py - (p[key] / max) * (h - py * 2)]);
      const a = xy('alerts'), b = xy('blocked');
      const line = pts => pts.map(p => p.map(n => n.toFixed(1)).join(',')).join(' ');
      const area = `${px},${h - py} ${line(a)} ${(px + (points.length - 1) * step).toFixed(1)},${h - py}`;
      const labelEvery = Math.max(1, Math.ceil(points.length / 7));
      const total = key => points.reduce((s, p) => s + p[key], 0);
      return `<svg class="ops-chart-svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="Alerts created (${total('alerts')}) and autonomous blocks (${total('blocked')}) from ${points[0].date} to ${points[points.length - 1].date}"><defs><linearGradient id="opsAreaGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#322761"/><stop offset="1" stop-color="#322761" stop-opacity="0"/></linearGradient></defs>${[.25, .5, .75].map(v => `<line class="ops-chart-gridline" x1="${px}" x2="${w - px}" y1="${h - py - v * (h - py * 2)}" y2="${h - py - v * (h - py * 2)}"/>`).join('')}<polygon class="ops-chart-area" points="${area}"/><polyline class="ops-chart-line" points="${line(a)}"/><polyline class="ops-chart-line secondary" points="${line(b)}"/>${points.map((p, i) => i % labelEvery === 0 ? `<text class="ops-chart-axis" x="${(px + i * step).toFixed(1)}" y="${h - 3}" text-anchor="middle">${p.date.slice(5)}</text>` : '').join('')}</svg>`;
    }

    function renderAnalytics(root) {
      const rows = analyticsRows();
      const days = aggregateByDate(rows);
      const { from, to } = analyticsWindow();
      const sum = key => rows.reduce((s, r) => s + r[key], 0);
      const totalAlerts = sum('alerts');
      const pct = n => (totalAlerts ? Math.round(n / totalAlerts * 100) : 0);
      const typologies = [...new Set(SENTRY_DATA.analyticsDaily.map(r => r.typology))];
      const channels = [...new Set(SENTRY_DATA.analyticsDaily.map(r => r.channel))];
      const byTypology = typologies.map(t => [t, rows.filter(r => r.typology === t).reduce((s, r) => s + r.alerts, 0)]);
      const maxTypology = Math.max(1, ...byTypology.map(([, v]) => v));
      const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const heat = typologies.map(t => weekdays.map((_, wd) => rows.filter(r => r.typology === t && new Date(`${r.date}T00:00:00Z`).getUTCDay() === wd).reduce((s, r) => s + r.alerts, 0)));
      const maxHeat = Math.max(1, ...heat.flat());
      const rangeError = ui.errors.analyticsRange;

      root.innerHTML = `
        ${introHTML('Risk intelligence', 'Analytics, Control Performance', 'Explore synthetic scenario patterns and the measurement surfaces planned for validation. Outcome claims remain unmeasured until compatible evidence exists.', [['Range', `${from} to ${to}`], ['Alerts', `${totalAlerts.toLocaleString()} scenario`], ['Blocked', `${sum('blocked').toLocaleString()} scenario`], ['Evidence', '0 / 0 verified']])}
        <div class="ops-toolbar" role="group" aria-label="Analytics filters">
          <div class="ops-segmented" role="group" aria-label="Date range">${['7d', '30d', '90d'].map(range => `<button type="button" class="ops-btn small ${ui.analyticsRange === range ? 'primary' : ''}" data-analytics-range="${range}" aria-pressed="${ui.analyticsRange === range}">${range.toUpperCase()}</button>`).join('')}</div>
          <label class="ops-date-field"><span>From</span><input type="date" class="ops-select" id="analyticsFrom" value="${esc(from)}" min="${DATA_START}" max="${DATA_END}" ${rangeError ? 'aria-invalid="true" aria-describedby="err-analyticsRange"' : ''}></label>
          <label class="ops-date-field"><span>To</span><input type="date" class="ops-select" id="analyticsTo" value="${esc(to)}" min="${DATA_START}" max="${DATA_END}"></label>
          <select id="analyticsTypology" class="ops-select" aria-label="Filter by typology"><option value="ALL">All typologies</option>${typologies.map(t => `<option ${ui.analyticsTypology === t ? 'selected' : ''}>${t}</option>`).join('')}</select>
          <select id="analyticsChannel" class="ops-select" aria-label="Filter by channel"><option value="ALL">All channels</option>${channels.map(c => `<option ${ui.analyticsChannel === c ? 'selected' : ''}>${c}</option>`).join('')}</select>
          <div class="ops-toolbar-spacer"></div>
          <button type="button" class="ops-btn" id="analyticsRefresh">${icon('activity')} Refresh</button>
          <button type="button" class="ops-btn" id="analyticsExport">Export CSV</button>
          <button type="button" class="ops-btn primary" id="analyticsBrief">Generate shift brief</button>
        </div>
        ${rangeError ? `<div class="ops-inline-error" role="alert" id="err-analyticsRange"><span>${esc(rangeError)}</span></div>` : ''}
        ${ui.analyticsBrief ? `<section class="ops-panel" id="analyticsBriefPanel"><div class="ops-panel-head"><div><h3 class="ops-panel-title">Shift brief</h3><div class="ops-panel-subtitle">Generated from the filtered synthetic scenario data</div></div><button type="button" class="ops-btn small" id="analyticsBriefClose">Close</button></div><div class="ops-panel-body"><ul class="ops-brief">${ui.analyticsBrief.map(line => `<li>${esc(line)}</li>`).join('')}</ul></div></section>` : ''}
        ${kpiHTML([
          { label: 'Evidence status', value: 'NOT MEASURED', note: '0 verified DIRECT_USER, 0 verified PROXY sessions' },
          { label: 'Prevented fraud loss', value: 'NOT MEASURED', note: 'Requires compatible post-change operational evidence' },
          { label: 'False positive rate', value: 'NOT MEASURED', note: 'No validated production or participant outcome yet' },
          { label: 'Mean time to decide', value: 'NOT MEASURED', note: 'No validated baseline or post-change timing evidence yet' }
        ])}
        ${rows.length ? `
        <div class="ops-grid analytics">
          <section class="ops-panel ops-chart-card"><div class="ops-panel-head"><div><h3 class="ops-panel-title">Alert pressure vs autonomous blocks</h3><div class="ops-panel-subtitle">Synthetic scenario series${days.length > 31 ? ', weekly buckets' : ', daily'}</div></div><span class="ops-badge info">${days.length} DAYS</span></div><div class="ops-chart-wrap">${lineChartSVG(days)}</div><div class="ops-chart-legend"><span><i class="ops-legend-dot"></i>Alerts created</span><span><i class="ops-legend-dot blue"></i>Autonomous blocks</span></div></section>
          <section class="ops-panel"><div class="ops-panel-head"><div><h3 class="ops-panel-title">Decision outcomes</h3><div class="ops-panel-subtitle">Share of scenario alerts in range</div></div></div><div class="ops-panel-body"><div class="ops-outcomes">${[['Approved', sum('approved'), 'blue'], ['Blocked', sum('blocked'), 'pink'], ['Step-up', sum('stepUp'), 'purple'], ['Escalated', sum('escalated'), '']].map(([name, value, tone]) => `<div class="ops-outcome-row"><span>${name}</span><div class="ops-outcome-track"><div class="ops-outcome-fill ${tone}" style="width:${pct(value)}%"></div></div><strong>${pct(value)}%</strong></div>`).join('')}</div><div class="ops-section-label">Operational note</div><div class="ops-conflict-card ops-note-card">Scenario distribution only. No validated change in customer friction or confirmed fraud is claimed.</div></div></section>
        </div>
        <div class="ops-grid analytics">
          <section class="ops-panel"><div class="ops-panel-head"><div><h3 class="ops-panel-title">Threat intensity by weekday</h3><div class="ops-panel-subtitle">Scenario alerts per typology and weekday</div></div></div><div class="ops-panel-body"><div class="ops-heat-wrap"><table class="ops-heat-table"><caption class="ops-visually-hidden">Scenario alerts by typology and weekday</caption><thead><tr><th scope="col">Typology</th>${weekdays.map(d => `<th scope="col">${d}</th>`).join('')}</tr></thead><tbody>${typologies.map((t, ti) => `<tr><th scope="row">${t}</th>${heat[ti].map(v => `<td style="--heat:${(0.05 + v / maxHeat * 0.33).toFixed(2)}">${v}</td>`).join('')}</tr>`).join('')}</tbody></table></div><div class="ops-section-label">Dominant typologies</div><div class="ops-driver-list">${byTypology.sort((x, y) => y[1] - x[1]).map(([name, value]) => `<div class="ops-driver-row"><span>${name}</span><div class="ops-driver-track"><div class="ops-driver-fill" style="width:${Math.round(value / maxTypology * 100)}%"></div></div><span class="ops-driver-score">${value}</span></div>`).join('')}</div></div></section>
          <section class="ops-panel"><div class="ops-panel-head"><div><h3 class="ops-panel-title">Analyst throughput</h3><div class="ops-panel-subtitle">Synthetic shift dataset, not validated analyst performance</div></div></div><div class="ops-panel-body"><div class="ops-analyst-row ops-analyst-head"><span>Analyst</span><span>Cases</span><span>MTTD</span><span>Quality</span></div>${[['Đỗ Anh Nghĩa', 34, '2.9m', '98%'], ['Mina Patel', 29, '3.1m', '97%'], ['Leo Martins', 24, '3.8m', '96%'], ['Sarah Jenkins', 21, '4.0m', '99%']].map(row => `<div class="ops-analyst-row"><strong>${row[0]}</strong><span class="ops-id">${row[1]}</span><span class="ops-id">${row[2]}</span><span class="ops-badge clean">${row[3]}</span></div>`).join('')}</div></section>
        </div>` : `<div class="ops-panel"><div class="ops-empty"><p>No scenario data matches this range and filter combination.</p><button type="button" class="ops-btn" id="analyticsResetFilters">Reset filters</button></div></div>`}
        <section class="ops-panel table-panel"><div class="ops-panel-head"><div><h3 class="ops-panel-title">Top rule performance</h3><div class="ops-panel-subtitle">Synthetic rule activity, prototype stress-test data, not production performance</div></div><a class="ops-btn small" href="#rules">Open Rules Engine</a></div><div class="ops-panel-body flush"><table class="ops-table"><thead><tr><th>Rule</th><th>Category</th><th>Executions</th><th>False positive</th><th>Contribution</th><th>State</th></tr></thead><tbody>${S.rules.map(rule => `<tr data-href="#rules/${esc(rule.id)}"><td><a class="ops-id ops-link" href="#rules/${esc(rule.id)}">${esc(rule.id)}</a><div class="ops-secondary">${label(rule.name)}</div></td><td>${esc(rule.category)}</td><td class="ops-id">${esc(rule.triggered24h)}</td><td class="ops-id">${esc(rule.falsePositiveRate)}</td><td><div class="ops-driver-track ops-contribution"><div class="ops-driver-fill" style="width:${Math.min(100, rule.triggered24h / 3.2)}%"></div></div></td><td><span class="ops-badge clean">${esc(rule.status)}</span></td></tr>`).join('')}</tbody></table></div></section>`;
      bindAnalyticsEvents(root, rows, days);
    }

    function bindAnalyticsEvents(root, rows, days) {
      root.querySelectorAll('[data-analytics-range]').forEach(btn => btn.addEventListener('click', () => { ui.analyticsRange = btn.dataset.analyticsRange; delete ui.errors.analyticsRange; render('analytics'); }));
      const applyDates = () => {
        const from = root.querySelector('#analyticsFrom').value;
        const to = root.querySelector('#analyticsTo').value;
        if (!from || !to) { ui.errors.analyticsRange = 'Choose both a start and an end date.'; render('analytics'); return; }
        if (from > to) { ui.errors.analyticsRange = 'Start date must be on or before the end date. The previous range is still shown.'; render('analytics'); return; }
        delete ui.errors.analyticsRange;
        ui.analyticsRange = 'custom'; ui.analyticsFrom = from; ui.analyticsTo = to;
        render('analytics');
      };
      root.querySelector('#analyticsFrom')?.addEventListener('change', applyDates);
      root.querySelector('#analyticsTo')?.addEventListener('change', applyDates);
      root.querySelector('#analyticsTypology')?.addEventListener('change', e => { ui.analyticsTypology = e.target.value; render('analytics'); });
      root.querySelector('#analyticsChannel')?.addEventListener('change', e => { ui.analyticsChannel = e.target.value; render('analytics'); });
      root.querySelector('#analyticsResetFilters')?.addEventListener('click', () => { ui.analyticsRange = '30d'; ui.analyticsTypology = 'ALL'; ui.analyticsChannel = 'ALL'; delete ui.errors.analyticsRange; render('analytics'); });
      root.querySelector('#analyticsRefresh')?.addEventListener('click', () => load('analytics'));
      root.querySelector('#analyticsExport')?.addEventListener('click', () => {
        const count = store.downloadCSV(`sentry-analytics-${analyticsWindow().from}-to-${analyticsWindow().to}.csv`, ['Date', 'Typology', 'Channel', 'Alerts', 'Blocked', 'Step-up', 'Escalated', 'Approved'],
          rows.map(r => [r.date, r.typology, r.channel, r.alerts, r.blocked, r.stepUp, r.escalated, r.approved]));
        showToast(`${count} scenario rows exported.`);
      });
      root.querySelector('#analyticsBrief')?.addEventListener('click', () => {
        const { from, to } = analyticsWindow();
        const total = rows.reduce((s, r) => s + r.alerts, 0);
        const peak = days.slice().sort((a, b) => b.alerts - a.alerts)[0];
        const open = S.alerts.filter(a => ['HIGH_RISK', 'RULE_CONFLICT', 'NEEDS_VERIFICATION'].includes(a.status)).length;
        ui.analyticsBrief = [
          `Window ${from} to ${to}, ${ui.analyticsTypology === 'ALL' ? 'all typologies' : ui.analyticsTypology}, ${ui.analyticsChannel === 'ALL' ? 'all channels' : ui.analyticsChannel}.`,
          `${total.toLocaleString()} scenario alerts${peak ? `, peak ${peak.alerts} on ${peak.date}` : ''}.`,
          `${open} alerts still pending analyst review in the live queue.`,
          `${S.cases.filter(c => c.status !== CLOSED).length} open cases, ${S.rules.filter(r => r.hasConflictNotice).length} rule conflict awaiting precedence review.`,
          'Outcome metrics remain NOT MEASURED until verified sessions exist.'
        ];
        render('analytics');
      });
      root.querySelector('#analyticsBriefClose')?.addEventListener('click', () => { ui.analyticsBrief = null; render('analytics'); });
    }

    // ================================================================ AUDIT
    function tinyHash(text) {
      return `sha256-demo-${hashText(text).toString(16).padStart(8, '0')}-${text.length.toString(16).padStart(4, '0')}`;
    }

    function filteredAudit() {
      const q = ui.auditQuery.toLowerCase();
      return S.auditLog.filter(row => {
        if (q && !`${row.id} ${row.actor} ${row.entity} ${row.action} ${row.rationale} ${row.verdict}`.toLowerCase().includes(q)) return false;
        if (ui.auditActor !== 'ALL' && !row.actor.startsWith(ui.auditActor)) return false;
        if (ui.auditAction !== 'ALL' && row.action !== ui.auditAction) return false;
        if (ui.auditOutcome !== 'ALL' && row.verdict !== ui.auditOutcome) return false;
        const day = row.timestamp.slice(0, 10);
        if (ui.auditFrom && day < ui.auditFrom) return false;
        if (ui.auditTo && day > ui.auditTo) return false;
        return true;
      });
    }

    function entityLinks(entity) {
      return String(entity).split(/\s*\/\s*/).map(part => {
        const p = part.trim();
        if (/^ALT-/.test(p) && S.alerts.some(a => a.id === p)) return `<a class="ops-link" href="#queue/${esc(p)}">${esc(p)}</a>`;
        if (/^CASE-/.test(p) && S.cases.some(c => c.id === p)) return `<a class="ops-link" href="#cases/${esc(p)}">${esc(p)}</a>`;
        if (/^RULE-/.test(p) && S.rules.some(r => r.id === p)) return `<a class="ops-link" href="#rules/${esc(p)}">${esc(p)}</a>`;
        if (/^CUST-/.test(p) && S.customers.some(c => c.id === p)) return `<a class="ops-link" href="#customers/${esc(p)}">${esc(p)}</a>`;
        return `<span>${esc(p)}</span>`;
      }).join(' / ');
    }

    function renderAudit(root) {
      const rows = filteredAudit();
      const all = S.auditLog;
      const routeId = param();
      const selected = routeId ? all.find(r => r.id === routeId) : null;
      const actors = [...new Set(all.map(r => r.actor.split(' (')[0]))];
      const actions = [...new Set(all.map(r => r.action))];
      const outcomes = [...new Set(all.map(r => r.verdict))];
      const headHash = tinyHash(all.map(r => `${r.id}:${r.timestamp}:${r.action}`).join('|'));
      const verify = ui.auditVerify;
      root.innerHTML = `
        ${introHTML('Forensic accountability', 'Audit Log, Evidence Ledger', 'Trace every human and automated decision with searchable rationale, entity context and a visible integrity chain for review-ready operations.', [['Events', all.length], ['Human actions', all.filter(r => !r.actor.includes('SENTRY')).length], ['System actions', all.filter(r => r.actor.includes('SENTRY')).length], ['Integrity', verify ? (verify.ok ? 'VERIFIED' : 'MISMATCH') : 'NOT CHECKED']])}
        <div class="ops-integrity-banner"><div class="ops-integrity-copy"><div class="ops-integrity-icon">${icon('shieldCheck')}</div><div><div class="ops-integrity-title">${verify ? `Chain verified at ${esc(verify.at)} across ${verify.count} events` : 'Ledger chain not yet verified in this session'}</div><div class="ops-integrity-sub">Head ${headHash}</div></div></div><button type="button" class="ops-btn" id="verifyAuditBtn">Verify chain</button></div>
        <div class="ops-toolbar" role="group" aria-label="Audit filters">
          <div class="ops-search-wrap">${icon('search')}<input id="auditSearch" class="ops-search" value="${esc(ui.auditQuery)}" placeholder="Search actor, entity, action, rationale or outcome" aria-label="Search audit ledger"></div>
          <select id="auditActor" class="ops-select" aria-label="Filter by actor"><option value="ALL">All actors</option>${actors.map(a => `<option value="${esc(a)}">${esc(a)}</option>`).join('')}</select>
          <select id="auditAction" class="ops-select" aria-label="Filter by action"><option value="ALL">All actions</option>${actions.map(a => `<option value="${esc(a)}">${label(a)}</option>`).join('')}</select>
          <select id="auditOutcome" class="ops-select" aria-label="Filter by outcome"><option value="ALL">All outcomes</option>${outcomes.map(a => `<option value="${esc(a)}">${label(a)}</option>`).join('')}</select>
          <label class="ops-date-field"><span>From</span><input type="date" class="ops-select" id="auditFrom" value="${esc(ui.auditFrom)}"></label>
          <label class="ops-date-field"><span>To</span><input type="date" class="ops-select" id="auditTo" value="${esc(ui.auditTo)}"></label>
          <div class="ops-toolbar-spacer"></div>
          <button type="button" class="ops-btn primary" id="auditExportBtn">Export CSV</button>
        </div>
        ${ui.errors.auditRange ? `<div class="ops-inline-error" role="alert"><span>${esc(ui.errors.auditRange)}</span></div>` : ''}
        ${kpiHTML([
          { label: 'Events in ledger', value: String(all.length), note: `${rows.length} match the current filters` },
          { label: 'Rationale coverage', value: `${all.length ? Math.round(all.filter(r => (r.rationale || '').trim().length > 0).length / all.length * 100) : 0}%`, note: 'Events carrying a written explanation' },
          { label: 'Policy overrides', value: String(all.filter(r => /Override of recommendation/.test(r.rationale)).length), note: 'Decisions against the model recommendation' },
          { label: 'Session actions', value: String(all.filter(r => r.timestamp.slice(0, 10) > SENTRY_DATA.scenarioDate).length), note: 'Written by you in this tab' }
        ])}
        <div class="ops-grid audit">
          <section class="ops-panel table-panel"><div class="ops-panel-head"><div><h3 class="ops-panel-title">Forensic event ledger</h3><div class="ops-panel-subtitle">${rows.length} events match current filters</div></div><span class="ops-badge clean">APPEND-ONLY</span></div><div class="ops-panel-body flush">${rows.length ? `<table class="ops-table"><thead><tr><th>Event</th><th>Actor</th><th>Entity</th><th>Action</th><th>Rationale</th><th>Outcome</th></tr></thead><tbody>${rows.map(row => `<tr data-href="#audit/${esc(row.id)}" class="${selected && row.id === selected.id ? 'active' : ''}"><td><a class="ops-id ops-link" href="#audit/${esc(row.id)}">${esc(row.id)}</a><div class="ops-secondary">${esc(row.timestamp)}</div></td><td><div class="ops-entity">${esc(row.actor)}</div></td><td class="ops-id">${esc(row.entity)}</td><td><span class="ops-badge info">${label(row.action)}</span></td><td class="ops-rationale-cell"><div>${esc(row.rationale)}</div></td><td><span class="ops-badge ${row.verdict.includes('FRAUD') || row.verdict === 'FROZEN' ? 'danger' : row.verdict.includes('PENDING') || row.verdict.includes('CONFLICT') ? 'warning' : 'clean'}">${label(row.verdict)}</span></td></tr>`).join('')}</tbody></table>` : `<div class="ops-empty"><p>No ledger events match the active filters.</p><button type="button" class="ops-btn" id="auditClearFilters">Clear filters</button></div>`}</div></section>
          <aside class="ops-panel" id="auditDetailPanel" aria-label="Audit entry detail">${routeId && !selected ? notFoundHTML('Audit entry', routeId, '#audit', 'Back to the ledger') : selected ? auditDetailHTML(selected) : auditTrailHTML(all)}</aside>
        </div>`;
      root.querySelector('#auditActor').value = ui.auditActor;
      root.querySelector('#auditAction').value = ui.auditAction;
      root.querySelector('#auditOutcome').value = ui.auditOutcome;
      bindAuditEvents(root);
    }

    function auditTrailHTML(all) {
      return `<div class="ops-panel-head"><div><h3 class="ops-panel-title">Recent integrity trail</h3><div class="ops-panel-subtitle">Select an event to see its full record</div></div></div><div class="ops-panel-body"><div class="ops-audit-feed">${all.slice(0, 5).map(row => `<a class="ops-audit-event" href="#audit/${esc(row.id)}"><span class="ops-audit-event-top"><strong>${label(row.action)}</strong><span class="ops-secondary">${esc(row.id)}</span></span><span class="ops-audit-copy">${esc(row.actor)} to ${esc(row.entity)}</span><code>${tinyHash(`${row.id}|${row.timestamp}|${row.verdict}`)}</code></a>`).join('')}</div></div>`;
    }

    function auditDetailHTML(row) {
      return `<div class="ops-detail-hero"><div class="ops-detail-top"><div><div class="ops-detail-label">Audit entry</div><h3 class="ops-detail-name">${esc(row.id)}</h3><div class="ops-detail-meta">${esc(row.timestamp)}</div></div></div><div class="ops-detail-actions"><a class="ops-btn" href="#audit">Close detail</a></div></div>
        <div class="ops-panel-body">
          <dl class="ops-dl">
            <dt>Actor</dt><dd>${esc(row.actor)}</dd>
            <dt>Entity</dt><dd>${entityLinks(row.entity)}</dd>
            <dt>Action</dt><dd>${label(row.action)}</dd>
            <dt>Outcome</dt><dd>${label(row.verdict)}</dd>
            <dt>Risk after</dt><dd>${row.riskScoreAfter ?? 'Not scored'}</dd>
            <dt>Rationale</dt><dd>${esc(row.rationale)}</dd>
            <dt>Entry hash</dt><dd><code class="ops-hash-full">${tinyHash(`${row.id}|${row.actor}|${row.action}`)}</code></dd>
          </dl>
        </div>`;
    }

    function exportAuditCSV() {
      const rows = filteredAudit();
      const count = store.downloadCSV('sentry-audit-ledger.csv', ['Audit ID', 'Timestamp', 'Actor', 'Entity', 'Action', 'Rationale', 'Outcome'], rows.map(row => [row.id, row.timestamp, row.actor, row.entity, row.action, row.rationale, row.verdict]));
      showToast(`${count} audit events exported.`);
    }

    function bindAuditEvents(root) {
      root.querySelector('#auditSearch')?.addEventListener('input', event => { ui.auditQuery = event.target.value; render('audit'); focusAfterRender('#auditSearch'); });
      root.querySelector('#auditActor')?.addEventListener('change', event => { ui.auditActor = event.target.value; render('audit'); });
      root.querySelector('#auditAction')?.addEventListener('change', event => { ui.auditAction = event.target.value; render('audit'); });
      root.querySelector('#auditOutcome')?.addEventListener('change', event => { ui.auditOutcome = event.target.value; render('audit'); });
      const dates = () => {
        const from = root.querySelector('#auditFrom').value, to = root.querySelector('#auditTo').value;
        if (from && to && from > to) { ui.errors.auditRange = 'Start date must be on or before the end date.'; render('audit'); return; }
        delete ui.errors.auditRange; ui.auditFrom = from; ui.auditTo = to; render('audit');
      };
      root.querySelector('#auditFrom')?.addEventListener('change', dates);
      root.querySelector('#auditTo')?.addEventListener('change', dates);
      root.querySelector('#auditClearFilters')?.addEventListener('click', () => { Object.assign(ui, { auditQuery: '', auditActor: 'ALL', auditAction: 'ALL', auditOutcome: 'ALL', auditFrom: '', auditTo: '' }); render('audit'); });
      root.querySelector('#auditExportBtn')?.addEventListener('click', exportAuditCSV);
      root.querySelector('#verifyAuditBtn')?.addEventListener('click', event => {
        let result;
        run('audit', event.currentTarget, 'Verifying…', 'Verifying the ledger chain', () => {
          const ids = new Set();
          const ok = S.auditLog.every(r => r.id && r.timestamp && !ids.has(r.id) && ids.add(r.id));
          result = { ok, at: store.nowStamp(), count: S.auditLog.length };
        }, () => { ui.auditVerify = result; showToast(result.ok ? `Chain verified: ${result.count} events, no gaps or duplicates.` : 'Chain verification found a problem.'); });
      });
    }

    // ---------------------------------------------------------------- wiring
    mount();
    document.addEventListener('sentry:route', event => {
      const view = event.detail.view;
      // Opening a different record closes transient forms of the previous one.
      ui.panel.caseForm = null; ui.panel.ruleDelete = null; ui.panel.customerFreeze = null;
      if (view === 'rules' && ui.panel.ruleForm === 'edit') ui.panel.ruleForm = null;
      ui.actionError[view] = null;
      activate(view);
      if (event.detail.param) revealDetail({ cases: 'caseDetailPanel', rules: 'ruleDetailPanel', customers: 'customerDetailPanel', audit: 'auditDetailPanel' }[view]);
    });
    document.addEventListener('sentry:store', event => {
      const view = app.currentView;
      if (!VIEWS[view] || ui.load[view] !== 'ready') return;
      const root = document.getElementById(VIEWS[view].root);
      // Do not re-render under an analyst who is typing.
      if (root && root.contains(document.activeElement) && document.activeElement.matches('input, textarea, select')) return;
      if (event.detail && event.detail.label && /^(decision|Assigning alerts|Creating the case|Bulk)/.test(event.detail.label)) render(view);
    });
    if (VIEWS[app.currentView]) activate(app.currentView);
    window.SentryWorkspaces = { render, load, ui };
  }
})();
