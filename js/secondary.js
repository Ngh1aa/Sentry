// SENTRY — Secondary Operations Workspaces
// Rich interactive prototype surfaces for Cases, Rules, Customers, Analytics and Audit.

(() => {
  if (window.__sentrySecondaryWorkspacesLoaded) return;
  window.__sentrySecondaryWorkspacesLoaded = true;

  const ready = () => typeof SENTRY_DATA !== 'undefined' && window.sentryConsole;

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
    const consoleApp = window.sentryConsole;

    const state = {
      selectedCaseId: 'CASE-4401',
      selectedRuleId: 'RULE-402',
      selectedCustomerId: 'CUST-90412',
      analyticsRange: '7d',
      customRules: [],
      caseQuery: '',
      casePriority: 'ALL',
      caseStatus: 'ALL',
      ruleQuery: '',
      ruleCategory: 'ALL',
      customerQuery: '',
      customerRisk: 'ALL',
      auditQuery: '',
      auditActor: 'ALL',
      auditAction: 'ALL'
    };

    const alertByCase = new Map(SENTRY_DATA.alerts.map(alert => [alert.caseId, alert]));
    const alertByCustomer = new Map(SENTRY_DATA.alerts.map(alert => [alert.customer.id, alert]));

    const baseCases = SENTRY_DATA.alerts.map((alert, index) => {
      const meta = [
        { priority: 'P0 CRITICAL', sla: '08m 14s', status: 'UNDER_REVIEW', owner: 'Đỗ Anh Nghĩa', queue: 'ATO / Wire', opened: '18m ago' },
        { priority: 'P1 CONFLICT', sla: '32m 00s', status: 'CONFLICT_TRIAGE', owner: 'Đỗ Anh Nghĩa', queue: 'VIP Exceptions', opened: '24m ago' },
        { priority: 'P0 AUTO', sla: 'COMPLETED', status: 'CONTAINED', owner: 'SENTRY Autopilot', queue: 'Carding Swarm', opened: '41m ago' }
      ][index] || {};
      return {
        id: alert.caseId,
        priority: meta.priority,
        status: meta.status,
        owner: meta.owner,
        queue: meta.queue,
        sla: meta.sla,
        opened: meta.opened,
        customerId: alert.customer.id,
        customer: alert.customer.name,
        alertId: alert.id,
        amount: alert.transaction.amountFormatted,
        risk: alert.riskSpectrum.totalScore,
        title: alert.triggeredRules[0]?.name?.replaceAll('_', ' ') || 'Risk investigation',
        summary: `${alert.transaction.type} · ${alert.transaction.merchant}`,
        drivers: alert.riskSpectrum.breakdown,
        timeline: alert.timeline
      };
    });

    const extraCases = [
      {
        id: 'CASE-4398', priority: 'P1 HIGH', status: 'PENDING_EVIDENCE', owner: 'Mina Patel', queue: 'Account Defense', sla: '51m 20s', opened: '11m ago',
        customerId: 'CUST-77219', customer: 'Sarah Keene', alertId: null, amount: '$12,840.00', risk: 81,
        title: 'SESSION TAKEOVER · DEVICE RESET', summary: 'Credential reset followed by high-value equipment purchase',
        drivers: [{ category: 'Device reset', score: 29 }, { category: 'Credential change', score: 25 }, { category: 'Spend anomaly', score: 27 }],
        timeline: [{ time: '00:44', title: 'Password reset', desc: 'Recovery completed from a new Android device.' }, { time: '00:52', title: 'New device trusted', desc: 'Device enrolled without historical cookie continuity.' }, { time: '01:06', title: 'Purchase held', desc: '$12.8k electronics authorization routed to review.' }]
      },
      {
        id: 'CASE-4396', priority: 'P2 MEDIUM', status: 'AWAITING_CUSTOMER', owner: 'Leo Martins', queue: 'Disputes', sla: '2h 18m', opened: '36m ago',
        customerId: 'CUST-22018', customer: 'Nora Jensen', alertId: null, amount: '$1,298.40', risk: 58,
        title: 'FRIENDLY FRAUD · SUBSCRIPTION CLUSTER', summary: 'Repeated dispute pattern across digital subscriptions',
        drivers: [{ category: 'Dispute velocity', score: 22 }, { category: 'Merchant pattern', score: 18 }, { category: 'Account history', score: 18 }],
        timeline: [{ time: 'Yesterday', title: 'Third dispute filed', desc: 'Digital merchant dispute submitted within 14 days.' }, { time: 'Today 00:18', title: 'Pattern linked', desc: 'Three related merchants identified by descriptor similarity.' }]
      },
      {
        id: 'CASE-4391', priority: 'P2 REVIEW', status: 'SUPERVISOR_REVIEW', owner: 'Sarah Jenkins', queue: 'Merchant Risk', sla: '3h 42m', opened: '1h ago',
        customerId: 'MERCH-1182', customer: 'Atlas Tickets GmbH', alertId: null, amount: '€94,210.00', risk: 73,
        title: 'MERCHANT BURST · REFUND IMBALANCE', summary: 'Refund ratio rose 4.8× against 30-day baseline',
        drivers: [{ category: 'Refund ratio', score: 31 }, { category: 'Burst velocity', score: 24 }, { category: 'Entity graph', score: 18 }],
        timeline: [{ time: '23:10', title: 'Refund spike begins', desc: '86 refunds initiated in a 22-minute window.' }, { time: '00:03', title: 'Reserve threshold crossed', desc: 'Merchant reserve moved above configured threshold.' }]
      }
    ];
    const cases = [...baseCases, ...extraCases];

    const extraCustomers = [
      { id:'CUST-77219', name:'Sarah Keene', email:'s.keene@northline.co', trustTier:'Silver', accountAge:'2y 9m', lifetimeVolume:'$118,240', disputes:1, risk:81, segment:'Business', status:'REVIEW', devices:4, home:'Chicago, USA' },
      { id:'CUST-22018', name:'Nora Jensen', email:'nora.jensen@mailbox.dk', trustTier:'Standard', accountAge:'1y 4m', lifetimeVolume:'$31,980', disputes:3, risk:58, segment:'Consumer', status:'MONITOR', devices:2, home:'Copenhagen, DK' },
      { id:'CUST-66104', name:'Amir Haddad', email:'amir@starlane.ae', trustTier:'Gold', accountAge:'5y 1m', lifetimeVolume:'$614,320', disputes:0, risk:22, segment:'Private Wealth', status:'CLEAR', devices:5, home:'Dubai, UAE' },
      { id:'CUST-51029', name:'Maya Ito', email:'maya@shiro-studio.jp', trustTier:'Standard', accountAge:'3y 7m', lifetimeVolume:'$76,430', disputes:0, risk:34, segment:'Business', status:'CLEAR', devices:3, home:'Tokyo, JP' }
    ];

    const customerRows = [
      ...SENTRY_DATA.alerts.map(alert => ({
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
      })),
      ...extraCustomers
    ];

    const analyticsSeries = {
      '24h': { labels:['02','05','08','11','14','17','20','23'], alerts:[18,12,28,42,37,58,44,31], blocked:[5,3,9,13,10,19,14,8] },
      '7d': { labels:['Wed','Thu','Fri','Sat','Sun','Mon','Tue'], alerts:[132,158,149,96,112,176,142], blocked:[31,39,36,21,24,48,41] },
      '30d': { labels:['W1','W2','W3','W4','Now'], alerts:[612,684,731,648,702], blocked:[148,172,194,159,181] }
    };

    function showToast(message) {
      if (consoleApp?.showToast) consoleApp.showToast(message);
    }

    function navigateTo(view, alertId) {
      if (alertId) {
        consoleApp.activeAlertId = alertId;
        consoleApp.renderAlertQueue();
        consoleApp.renderActiveAlert();
      }
      const tab = document.querySelector(`.nav-tab[data-view="${view}"]`);
      if (tab) tab.click();
      else consoleApp.switchView(view);
    }

    function riskTone(score) {
      if (score >= 75) return 'danger';
      if (score >= 50) return 'warning';
      return 'clean';
    }

    function scoreClass(score) {
      if (score >= 75) return 'high';
      if (score >= 50) return 'mid';
      return 'low';
    }

    function initials(name) {
      return name.split(/\s+/).slice(0,2).map(part => part[0]).join('').toUpperCase();
    }

    function introHTML(eyebrow, title, description, chips) {
      return `
        <div class="ops-page-intro">
          <div class="ops-intro-copy">
            <div class="ops-eyebrow">${eyebrow}</div>
            <h2 class="ops-title">${title}</h2>
            <p class="ops-description">${description}</p>
          </div>
          <div class="ops-intro-meta">
            ${chips.map(([label,value]) => `<div class="ops-intro-chip"><span>${label}</span><strong>${value}</strong></div>`).join('')}
          </div>
        </div>`;
    }

    function kpiHTML(items) {
      return `<div class="ops-kpi-grid">${items.map((item, i) => `
        <article class="ops-kpi-card ${item.tone || ['','pink','purple','muted'][i % 4]}">
          <div class="ops-kpi-label">${item.label}</div>
          <div class="ops-kpi-value">${item.value}</div>
          <div class="ops-kpi-note">${item.note}</div>
        </article>`).join('')}</div>`;
    }

    // CASES -----------------------------------------------------------------
    function mountCases() {
      const view = document.getElementById('view-cases');
      if (!view) return;
      view.innerHTML = `<div class="ops-shell" id="opsCasesRoot"></div>`;
      renderCases();
    }

    function filteredCases() {
      const q = state.caseQuery.toLowerCase();
      return cases.filter(item => {
        if (q && !`${item.id} ${item.customer} ${item.title} ${item.queue}`.toLowerCase().includes(q)) return false;
        if (state.casePriority !== 'ALL' && !item.priority.startsWith(state.casePriority)) return false;
        if (state.caseStatus !== 'ALL' && item.status !== state.caseStatus) return false;
        return true;
      });
    }

    function renderCases() {
      const root = document.getElementById('opsCasesRoot');
      if (!root) return;
      const list = filteredCases();
      if (!list.some(item => item.id === state.selectedCaseId) && list[0]) state.selectedCaseId = list[0].id;
      const selected = cases.find(item => item.id === state.selectedCaseId) || cases[0];
      const critical = cases.filter(item => item.priority.startsWith('P0')).length;
      const slaRisk = cases.filter(item => /m/.test(item.sla) && parseInt(item.sla, 10) < 60).length;

      root.innerHTML = `
        ${introHTML('Investigation orchestration', 'Cases · SLA Command Center', 'Prioritize investigations, coordinate ownership, inspect linked evidence and keep high-risk work inside response-time targets.', [['Open cases', cases.length], ['P0 critical', critical], ['Shift', 'EMEA / AMER'], ['Queue health', '87%']])}
        <div class="ops-toolbar">
          <div class="ops-search-wrap">${icon('search')}<input id="caseSearch" class="ops-search" value="${state.caseQuery}" placeholder="Search case, customer, alert or queue…" aria-label="Search cases"></div>
          <select id="casePriority" class="ops-select" aria-label="Filter by priority">
            <option value="ALL">All priority</option><option value="P0">P0 critical</option><option value="P1">P1 high</option><option value="P2">P2 review</option>
          </select>
          <select id="caseStatus" class="ops-select" aria-label="Filter by status">
            <option value="ALL">All status</option>${[...new Set(cases.map(item => item.status))].map(status => `<option value="${status}">${status.replaceAll('_',' ')}</option>`).join('')}
          </select>
          <div class="ops-toolbar-spacer"></div>
          <button class="ops-btn" id="caseQueueBtn">${icon('activity')} Queue view</button>
          <button class="ops-btn primary" id="caseNewBtn">+ New case</button>
        </div>
        ${kpiHTML([
          {label:'Active investigations', value:String(cases.filter(c => c.status !== 'CONTAINED').length), note:'<strong>3</strong> touched in the last 30 minutes'},
          {label:'SLA at risk', value:String(slaRisk), note:'Requires reassignment or supervisor action', tone:'pink'},
          {label:'Median resolution', value:'18.6m', note:'↓ 22% vs previous shift', tone:'purple'},
          {label:'Escalation rate', value:'6.4%', note:'Within target < 8.0%', tone:'muted'}
        ])}
        <div class="ops-grid cases">
          <section class="ops-panel table-panel">
            <div class="ops-panel-head"><div><div class="ops-panel-title">Active case queue</div><div class="ops-panel-subtitle">${list.length} records · priority then SLA</div></div><span class="ops-badge info">LIVE TRIAGE</span></div>
            <div class="ops-panel-body flush">
              ${list.length ? `<table class="ops-table"><thead><tr><th>Case</th><th>Entity</th><th>Priority</th><th>Owner</th><th>SLA</th><th>Status</th></tr></thead><tbody>
                ${list.map(item => `<tr data-case-id="${item.id}" class="${item.id === state.selectedCaseId ? 'active' : ''}">
                  <td><div class="ops-id">${item.id}</div><div class="ops-secondary">${item.opened}</div></td>
                  <td><div class="ops-entity">${item.customer}</div><div class="ops-secondary">${item.summary}</div></td>
                  <td><span class="ops-badge ${item.priority.startsWith('P0') ? 'danger' : item.priority.startsWith('P1') ? 'warning' : 'info'}">${item.priority}</span></td>
                  <td>${item.owner}</td><td class="ops-id">${item.sla}</td><td><span class="ops-badge purple">${item.status.replaceAll('_',' ')}</span></td>
                </tr>`).join('')}
              </tbody></table>` : '<div class="ops-empty">No cases match the active filters.</div>'}
            </div>
          </section>
          <aside class="ops-panel" id="caseDetailPanel">${caseDetailHTML(selected)}</aside>
        </div>
        <div class="ops-grid analytics">
          <section class="ops-panel">
            <div class="ops-panel-head"><div><div class="ops-panel-title">Team workload</div><div class="ops-panel-subtitle">Open investigation ownership by analyst</div></div><span class="ops-badge clean">BALANCED</span></div>
            <div class="ops-panel-body"><div class="ops-workload-list">
              ${[['Đỗ Anh Nghĩa',72,4],['Mina Patel',58,3],['Leo Martins',42,2],['Sarah Jenkins',34,2],['SENTRY Autopilot',88,8]].map(([name,value,count]) => `<div class="ops-workload-row"><span>${name}</span><div class="ops-workload-bar"><div class="ops-workload-fill" style="width:${value}%"></div></div><strong class="ops-id">${count}</strong></div>`).join('')}
            </div></div>
          </section>
          <section class="ops-panel">
            <div class="ops-panel-head"><div><div class="ops-panel-title">SLA watch</div><div class="ops-panel-subtitle">Next deadlines requiring attention</div></div></div>
            <div class="ops-panel-body"><div class="ops-sla-watch">
              <div class="ops-sla-item"><strong class="text-danger">08:14</strong><span>CASE-4401 · P0</span></div>
              <div class="ops-sla-item"><strong>32:00</strong><span>CASE-4402 · P1</span></div>
              <div class="ops-sla-item"><strong>51:20</strong><span>CASE-4398 · P1</span></div>
            </div></div>
          </section>
        </div>`;

      document.getElementById('casePriority').value = state.casePriority;
      document.getElementById('caseStatus').value = state.caseStatus;
      bindCaseEvents();
    }

    function caseDetailHTML(item) {
      const alert = alertByCase.get(item.id);
      const transaction = alert?.transaction;
      const events = item.timeline || [];
      const drivers = item.drivers || [];
      return `
        <div class="ops-detail-hero">
          <div class="ops-detail-top"><div><div class="ops-detail-label">Selected investigation</div><div class="ops-detail-name">${item.id} · ${item.customer}</div><div class="ops-detail-meta">${item.queue} · ${item.status.replaceAll('_',' ')} · ${item.owner}</div></div><div class="ops-risk-score ${scoreClass(item.risk)}">${item.risk}</div></div>
          <div class="ops-detail-actions">
            <button class="ops-btn primary" data-case-action="open" ${item.alertId ? '' : 'disabled'}>${icon('arrowRight')} Open investigation</button>
            <button class="ops-btn" data-case-action="assign">Assign to me</button>
            <button class="ops-btn" data-case-action="escalate">Escalate</button>
          </div>
        </div>
        <div class="ops-panel-body">
          <div class="ops-detail-grid">
            <div class="ops-fact"><span>Primary entity</span><strong>${item.customer}</strong></div>
            <div class="ops-fact"><span>Exposure</span><strong>${item.amount}</strong></div>
            <div class="ops-fact"><span>Linked alert</span><strong>${item.alertId || 'MANUAL CASE'}</strong></div>
            <div class="ops-fact"><span>SLA remaining</span><strong>${item.sla}</strong></div>
            <div class="ops-fact"><span>Payment rail</span><strong>${transaction?.type || item.queue}</strong></div>
            <div class="ops-fact"><span>Opened</span><strong>${item.opened}</strong></div>
          </div>
          <div class="ops-section-label">Risk drivers</div>
          <div class="ops-driver-list">${drivers.map(driver => { const score = Math.max(0, Number(driver.score || 0)); return `<div class="ops-driver-row"><span>${driver.category}</span><div class="ops-driver-track"><div class="ops-driver-fill ${score >= 28 ? 'hot' : ''}" style="width:${Math.min(100, score * 2.7)}%"></div></div><span class="ops-driver-score">+${score}</span></div>`; }).join('')}</div>
          <div class="ops-section-label">Evidence chronology</div>
          <div class="ops-timeline">${events.slice(-4).map(event => `<div class="ops-event"><div class="ops-event-time">${event.time}</div><div class="ops-event-title">${event.title}</div><div class="ops-event-copy">${event.desc || event.detail || ''}</div></div>`).join('')}</div>
        </div>`;
    }

    function bindCaseEvents() {
      document.getElementById('caseSearch')?.addEventListener('input', event => { state.caseQuery = event.target.value; renderCases(); requestAnimationFrame(() => document.getElementById('caseSearch')?.focus()); });
      document.getElementById('casePriority')?.addEventListener('change', event => { state.casePriority = event.target.value; renderCases(); });
      document.getElementById('caseStatus')?.addEventListener('change', event => { state.caseStatus = event.target.value; renderCases(); });
      document.querySelectorAll('[data-case-id]').forEach(row => row.addEventListener('click', () => { state.selectedCaseId = row.dataset.caseId; renderCases(); }));
      document.querySelector('[data-case-action="open"]')?.addEventListener('click', () => { const item = cases.find(c => c.id === state.selectedCaseId); if (item?.alertId) navigateTo('queue', item.alertId); });
      document.querySelector('[data-case-action="assign"]')?.addEventListener('click', () => { const item = cases.find(c => c.id === state.selectedCaseId); if (item) { item.owner = 'Đỗ Anh Nghĩa'; showToast(`${item.id} assigned to Đỗ Anh Nghĩa.`); renderCases(); } });
      document.querySelector('[data-case-action="escalate"]')?.addEventListener('click', () => { const item = cases.find(c => c.id === state.selectedCaseId); if (item) { item.status = 'SUPERVISOR_REVIEW'; if (!item.priority.startsWith('P0')) item.priority = 'P1 ESCALATED'; showToast(`${item.id} escalated to supervisor review.`); renderCases(); } });
      document.getElementById('caseQueueBtn')?.addEventListener('click', () => navigateTo('queue'));
      document.getElementById('caseNewBtn')?.addEventListener('click', () => showToast('Case composer ready — select an alert from Queue to create a linked investigation.'));
    }

    // RULES -----------------------------------------------------------------
    function mountRules() {
      const view = document.getElementById('view-rules');
      if (!view) return;
      view.innerHTML = `<div class="ops-shell" id="opsRulesRoot"></div>`;
      renderRules();
    }

    function allRules() { return [...SENTRY_DATA.rulesInventory, ...state.customRules]; }
    function filteredRules() {
      const q = state.ruleQuery.toLowerCase();
      return allRules().filter(rule => {
        if (q && !`${rule.id} ${rule.name} ${rule.category} ${rule.logic}`.toLowerCase().includes(q)) return false;
        if (state.ruleCategory !== 'ALL' && rule.category !== state.ruleCategory) return false;
        return true;
      });
    }

    function renderRules() {
      const root = document.getElementById('opsRulesRoot');
      if (!root) return;
      const rules = allRules();
      const list = filteredRules();
      if (!list.some(r => r.id === state.selectedRuleId) && list[0]) state.selectedRuleId = list[0].id;
      const selected = rules.find(r => r.id === state.selectedRuleId) || rules[0];
      const hits = rules.reduce((sum, rule) => sum + Number(rule.triggered24h || 0), 0);
      const conflicts = rules.filter(rule => rule.hasConflictNotice).length;

      root.innerHTML = `
        ${introHTML('Decisioning laboratory', 'Rules Engine · Test Before You Ship', 'Build controls, inspect rule health, surface conflicts and simulate policy changes before they affect live traffic.', [['Active rules', rules.length], ['24h executions', hits.toLocaleString()], ['Conflicts', conflicts], ['Decision p95', '31 ms']])}
        <div class="ops-toolbar">
          <div class="ops-search-wrap">${icon('search')}<input id="ruleSearch" class="ops-search" value="${state.ruleQuery}" placeholder="Search rule ID, logic or category…" aria-label="Search rules"></div>
          <select id="ruleCategory" class="ops-select"><option value="ALL">All categories</option>${[...new Set(rules.map(r => r.category))].map(cat => `<option value="${cat}">${cat}</option>`).join('')}</select>
          <div class="ops-toolbar-spacer"></div>
          <button class="ops-btn" id="ruleBacktestAll">${icon('activity')} Backtest all</button>
          <button class="ops-btn primary" id="newRuleBtn">+ Create rule</button>
        </div>
        ${kpiHTML([
          {label:'Rules fired / 24h', value:hits.toLocaleString(), note:'Across live authorization and session traffic'},
          {label:'False positive median', value:'2.4%', note:'Target band < 3.0%', tone:'purple'},
          {label:'Conflict incidence', value:'1.4%', note:'1 policy pair requires precedence review', tone:'pink'},
          {label:'Shadow candidates', value:'3', note:'Backtest complete · awaiting publish', tone:'muted'}
        ])}
        <div id="ruleComposerSlot"></div>
        <div class="ops-grid rules">
          <section class="ops-panel">
            <div class="ops-panel-head"><div><div class="ops-panel-title">Policy inventory</div><div class="ops-panel-subtitle">${list.length} rules shown</div></div><span class="ops-badge clean">PRODUCTION</span></div>
            <div class="ops-rule-list">${list.length ? list.map(rule => ruleListHTML(rule)).join('') : '<div class="ops-empty">No rules match the active filters.</div>'}</div>
          </section>
          <section class="ops-panel" id="ruleDetailPanel">${ruleDetailHTML(selected)}</section>
        </div>
        <div class="ops-grid analytics">
          <section class="ops-panel"><div class="ops-panel-head"><div><div class="ops-panel-title">Conflict monitor</div><div class="ops-panel-subtitle">Policy precedence and exemption collisions</div></div><span class="ops-badge warning">1 OPEN</span></div><div class="ops-panel-body">
            <div class="ops-conflict-card"><strong>RULE-301 ↔ RULE-012</strong><br>Foreign luxury hold competes with VIP private-wealth exemption. Suggested path: evaluate travel notice + known merchant reputation before manual hold.</div>
          </div></section>
          <section class="ops-panel"><div class="ops-panel-head"><div><div class="ops-panel-title">Deployment lanes</div><div class="ops-panel-subtitle">Safe rollout state across policy changes</div></div></div><div class="ops-panel-body"><div class="ops-outcomes">
            ${[['Production',71,'purple'],['Shadow mode',18,'blue'],['Draft',11,'pink']].map(([label,value,tone]) => `<div class="ops-outcome-row"><span>${label}</span><div class="ops-outcome-track"><div class="ops-outcome-fill ${tone}" style="width:${value}%"></div></div><strong>${value}%</strong></div>`).join('')}
          </div></div></section>
        </div>`;

      document.getElementById('ruleCategory').value = state.ruleCategory;
      bindRuleEvents();
    }

    function ruleListHTML(rule) {
      const fp = parseFloat(rule.falsePositiveRate || '0');
      return `<article class="ops-rule-item ${rule.id === state.selectedRuleId ? 'active' : ''}" data-rule-id="${rule.id}">
        <div class="ops-rule-line"><div><div class="ops-id">${rule.id}</div><div class="ops-rule-name">${rule.name.replaceAll('_',' ')}</div></div><span class="ops-badge ${fp > 8 ? 'danger' : fp > 3 ? 'warning' : 'clean'}">${rule.status}</span></div>
        <div class="ops-rule-meta"><span>${rule.category}</span><span>${rule.triggered24h} fires / 24h</span><span>FP ${rule.falsePositiveRate}</span></div>
      </article>`;
    }

    function ruleDetailHTML(rule) {
      if (!rule) return '<div class="ops-empty">Select a rule to inspect it.</div>';
      const fp = parseFloat(rule.falsePositiveRate || '0');
      const precision = Math.max(70, 100 - fp * 1.6).toFixed(1);
      const backtest = [18,31,22,47,38,61,52,76,58,82,69,74];
      return `
        <div class="ops-detail-hero"><div class="ops-detail-top"><div><div class="ops-detail-label">Rule inspector</div><div class="ops-detail-name">${rule.id} · ${rule.name.replaceAll('_',' ')}</div><div class="ops-detail-meta">${rule.category} · Author: ${rule.author}</div></div><span class="ops-badge clean">${rule.status}</span></div>
          <div class="ops-detail-actions"><button class="ops-btn primary" data-rule-action="shadow">Run shadow test</button><button class="ops-btn" data-rule-action="clone">Clone rule</button><button class="ops-btn" data-rule-action="toggle">${rule.status === 'ACTIVE' ? 'Disable' : 'Enable'}</button></div>
        </div>
        <div class="ops-panel-body">
          <div class="ops-section-label">Decision logic</div>
          <div class="ops-code-block"><span class="ops-code-token">WHEN</span> ${rule.logic.replaceAll(' AND ', ' <span class="ops-code-operator">AND</span> ').replaceAll(' OR ', ' <span class="ops-code-operator">OR</span> ')}<br><span class="ops-code-token">THEN</span> ${rule.action || 'HOLD_FOR_REVIEW'}</div>
          <div class="ops-section-label">Performance snapshot</div>
          <div class="ops-metric-row">
            <div class="ops-mini-metric"><span>Executions / 24h</span><strong>${rule.triggered24h}</strong></div>
            <div class="ops-mini-metric"><span>Precision</span><strong>${precision}%</strong></div>
            <div class="ops-mini-metric"><span>False positive</span><strong>${rule.falsePositiveRate}</strong></div>
            <div class="ops-mini-metric"><span>p95 latency</span><strong>${18 + (rule.id.charCodeAt(rule.id.length-1) % 17)} ms</strong></div>
          </div>
          <div class="ops-section-label">Backtest fire-rate · 12 windows</div>
          <div class="ops-backtest">${backtest.map((value,i) => `<div class="ops-backtest-bar" style="height:${Math.min(95, value + (rule.triggered24h % 12) - i)}%" title="Window ${i+1}"></div>`).join('')}</div>
          ${rule.hasConflictNotice ? `<div class="ops-section-label">Conflict</div><div class="ops-conflict-card">${icon('alertTriangle')} <strong>Policy collision detected.</strong><br>${rule.hasConflictNotice}. Test precedence in shadow mode before publishing an override.</div>` : ''}
        </div>`;
    }

    function renderRuleComposer() {
      const slot = document.getElementById('ruleComposerSlot');
      if (!slot) return;
      slot.innerHTML = `<section class="ops-panel"><div class="ops-panel-head"><div><div class="ops-panel-title">New rule · shadow draft</div><div class="ops-panel-subtitle">Create a safe prototype rule without touching production logic</div></div><button class="ops-btn small" id="closeRuleComposer">Close</button></div>
        <div class="ops-panel-body"><div class="ops-detail-grid">
          <label class="ops-fact"><span>Rule name</span><input id="draftRuleName" class="ops-search" style="margin-top:6px;padding-left:10px" value="HIGH_VELOCITY_NEW_DEVICE"></label>
          <label class="ops-fact"><span>Category</span><input id="draftRuleCategory" class="ops-search" style="margin-top:6px;padding-left:10px" value="Device & Velocity"></label>
        </div><div class="ops-section-label">Condition</div><input id="draftRuleLogic" class="ops-search" style="padding-left:10px" value="DeviceAge < 1h AND TxCount10m > 6 AND Amount > 1000"><div class="ops-detail-actions" style="margin-top:10px"><button class="ops-btn primary" id="saveShadowRule">Save to shadow mode</button></div></div></section>`;
      document.getElementById('closeRuleComposer')?.addEventListener('click', () => { slot.innerHTML=''; });
      document.getElementById('saveShadowRule')?.addEventListener('click', () => {
        const id = `RULE-${600 + state.customRules.length + 1}`;
        state.customRules.push({ id, name:document.getElementById('draftRuleName').value.trim() || 'UNTITLED_RULE', category:document.getElementById('draftRuleCategory').value.trim() || 'Custom', status:'SHADOW', logic:document.getElementById('draftRuleLogic').value.trim() || 'TRUE', action:'ROUTE_TO_MANUAL_REVIEW', triggered24h:0, falsePositiveRate:'0.0%', author:'Đỗ Anh Nghĩa · Draft' });
        state.selectedRuleId = id;
        showToast(`${id} saved in shadow mode.`);
        renderRules();
      });
    }

    function bindRuleEvents() {
      document.getElementById('ruleSearch')?.addEventListener('input', event => { state.ruleQuery = event.target.value; renderRules(); requestAnimationFrame(() => document.getElementById('ruleSearch')?.focus()); });
      document.getElementById('ruleCategory')?.addEventListener('change', event => { state.ruleCategory = event.target.value; renderRules(); });
      document.querySelectorAll('[data-rule-id]').forEach(item => item.addEventListener('click', () => { state.selectedRuleId = item.dataset.ruleId; renderRules(); }));
      document.querySelector('[data-rule-action="shadow"]')?.addEventListener('click', () => showToast(`${state.selectedRuleId} shadow test started on the last 7 days of traffic.`));
      document.querySelector('[data-rule-action="clone"]')?.addEventListener('click', () => showToast(`${state.selectedRuleId} cloned as a draft variant.`));
      document.querySelector('[data-rule-action="toggle"]')?.addEventListener('click', () => { const rule = allRules().find(r => r.id === state.selectedRuleId); if (rule) { rule.status = rule.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'; showToast(`${rule.id} is now ${rule.status}.`); renderRules(); } });
      document.getElementById('newRuleBtn')?.addEventListener('click', renderRuleComposer);
      document.getElementById('ruleBacktestAll')?.addEventListener('click', () => showToast('Portfolio backtest queued: precision, recall and fire-rate simulation started.'));
    }

    // CUSTOMERS -------------------------------------------------------------
    function mountCustomers() {
      const view = document.getElementById('view-customers');
      if (!view) return;
      view.innerHTML = `<div class="ops-shell" id="opsCustomersRoot"></div>`;
      renderCustomers();
    }

    function filteredCustomers() {
      const q = state.customerQuery.toLowerCase();
      return customerRows.filter(c => {
        if (q && !`${c.id} ${c.name} ${c.email} ${c.home} ${c.segment}`.toLowerCase().includes(q)) return false;
        if (state.customerRisk === 'HIGH' && c.risk < 75) return false;
        if (state.customerRisk === 'MEDIUM' && (c.risk < 50 || c.risk >= 75)) return false;
        if (state.customerRisk === 'LOW' && c.risk >= 50) return false;
        return true;
      });
    }

    function renderCustomers() {
      const root = document.getElementById('opsCustomersRoot');
      if (!root) return;
      const list = filteredCustomers();
      if (!list.some(c => c.id === state.selectedCustomerId) && list[0]) state.selectedCustomerId = list[0].id;
      const selected = customerRows.find(c => c.id === state.selectedCustomerId) || customerRows[0];
      const high = customerRows.filter(c => c.risk >= 75).length;
      root.innerHTML = `
        ${introHTML('Portfolio intelligence', 'Customers · 360° Risk Directory', 'Move from a directory to a decision surface: identity health, device trust, behavioral risk and recent activity in one record.', [['Monitored', customerRows.length.toLocaleString()], ['High risk', high], ['EDD pending', '4'], ['Profile sync', '2m ago']])}
        <div class="ops-toolbar"><div class="ops-search-wrap">${icon('search')}<input id="customerSearch" class="ops-search" value="${state.customerQuery}" placeholder="Search customer, email, geography or segment…"></div><select id="customerRisk" class="ops-select"><option value="ALL">All risk</option><option value="HIGH">High ≥ 75</option><option value="MEDIUM">Medium 50–74</option><option value="LOW">Low < 50</option></select><div class="ops-toolbar-spacer"></div><button class="ops-btn" id="customerReviewBtn">Review high-risk</button><button class="ops-btn primary" id="customerExportBtn">Export cohort</button></div>
        ${kpiHTML([
          {label:'High-risk population', value:`${high}`, note:'Requires review, restriction or step-up'},
          {label:'Profiles with device drift', value:'12', note:'New fingerprint or hardware mismatch', tone:'pink'},
          {label:'Trusted customer rate', value:'91.8%', note:'Gold / verified cohorts remain stable', tone:'purple'},
          {label:'Dispute exposure', value:'$84.2k', note:'Open disputes across monitored profiles', tone:'muted'}
        ])}
        <div class="ops-panel"><div class="ops-panel-head"><div><div class="ops-panel-title">Portfolio risk distribution</div><div class="ops-panel-subtitle">Low 52% · Guarded 26% · Elevated 14% · High 8%</div></div><span class="ops-badge info">LIVE SCORING</span></div><div class="ops-panel-body"><div class="ops-risk-distribution"><div class="ops-risk-segment"></div><div class="ops-risk-segment"></div><div class="ops-risk-segment"></div><div class="ops-risk-segment"></div></div></div></div>
        <div class="ops-grid customers">
          <section class="ops-panel table-panel"><div class="ops-panel-head"><div><div class="ops-panel-title">Customer portfolio</div><div class="ops-panel-subtitle">${list.length} profiles shown</div></div></div><div class="ops-panel-body flush">${list.length ? `<table class="ops-table"><thead><tr><th>Customer</th><th>Segment</th><th>Trust</th><th>Risk</th><th>Lifetime volume</th><th>Status</th></tr></thead><tbody>${list.map(c => `<tr data-customer-id="${c.id}" class="${c.id===state.selectedCustomerId?'active':''}"><td><div class="ops-customer-cell"><div class="ops-customer-avatar">${initials(c.name)}</div><div><div class="ops-entity">${c.name}</div><div class="ops-secondary">${c.id} · ${c.email}</div></div></div></td><td>${c.segment}</td><td>${c.trustTier}</td><td><span class="ops-badge ${riskTone(c.risk)}">${c.risk}</span></td><td class="ops-id">${c.lifetimeVolume}</td><td><span class="ops-badge ${c.status==='RESTRICTED'?'danger':c.status==='REVIEW'?'warning':'clean'}">${c.status}</span></td></tr>`).join('')}</tbody></table>` : '<div class="ops-empty">No customer profiles match the active filters.</div>'}</div></section>
          <aside class="ops-panel">${customerDetailHTML(selected)}</aside>
        </div>`;
      document.getElementById('customerRisk').value = state.customerRisk;
      bindCustomerEvents();
    }

    function customerDetailHTML(customer) {
      const alert = alertByCustomer.get(customer.id);
      const device = alert?.device;
      const timeline = alert?.timeline || [
        {time:'2h ago', title:'Profile sync', desc:'Identity and account attributes refreshed.'},
        {time:'Yesterday', title:'Routine payment', desc:'Behavior matched historical device and merchant profile.'},
        {time:'7d ago', title:'Risk score recalculated', desc:'No material adverse signal detected.'}
      ];
      return `<div class="ops-detail-hero"><div class="ops-detail-top"><div><div class="ops-detail-label">Customer risk profile</div><div class="ops-detail-name">${customer.name}</div><div class="ops-detail-meta">${customer.id} · ${customer.segment} · ${customer.home}</div></div><div class="ops-risk-score ${scoreClass(customer.risk)}">${customer.risk}</div></div><div class="ops-detail-actions"><button class="ops-btn primary" data-customer-action="evidence" ${alert ? '' : 'disabled'}>${icon('arrowRight')} Open evidence</button><button class="ops-btn" data-customer-action="edd">Request EDD</button><button class="ops-btn" data-customer-action="note">Add note</button></div></div>
        <div class="ops-panel-body"><div class="ops-detail-grid"><div class="ops-fact"><span>Trust tier</span><strong>${customer.trustTier}</strong></div><div class="ops-fact"><span>Account age</span><strong>${customer.accountAge}</strong></div><div class="ops-fact"><span>Lifetime volume</span><strong>${customer.lifetimeVolume}</strong></div><div class="ops-fact"><span>Prior disputes</span><strong>${customer.disputes}</strong></div><div class="ops-fact"><span>Primary geography</span><strong>${customer.home}</strong></div><div class="ops-fact"><span>Risk state</span><strong>${customer.status}</strong></div></div>
        <div class="ops-section-label">Device & session trust</div><div class="ops-device-list"><div class="ops-device-item"><span>${device?.osReported || 'Primary trusted browser'}</span><span class="ops-badge ${device?.isMismatch?'danger':'clean'}">${device?.isMismatch?'MISMATCH':'TRUSTED'}</span></div><div class="ops-device-item"><span>${device?.fingerprint || `${customer.devices} known devices`}</span><span class="ops-id">${customer.devices} linked</span></div></div>
        <div class="ops-section-label">Recent activity</div><div class="ops-timeline">${timeline.slice(-4).map(e => `<div class="ops-event"><div class="ops-event-time">${e.time}</div><div class="ops-event-title">${e.title}</div><div class="ops-event-copy">${e.desc}</div></div>`).join('')}</div></div>`;
    }

    function bindCustomerEvents() {
      document.getElementById('customerSearch')?.addEventListener('input', event => { state.customerQuery = event.target.value; renderCustomers(); requestAnimationFrame(() => document.getElementById('customerSearch')?.focus()); });
      document.getElementById('customerRisk')?.addEventListener('change', event => { state.customerRisk = event.target.value; renderCustomers(); });
      document.querySelectorAll('[data-customer-id]').forEach(row => row.addEventListener('click', () => { state.selectedCustomerId = row.dataset.customerId; renderCustomers(); }));
      document.querySelector('[data-customer-action="evidence"]')?.addEventListener('click', () => { const alert = alertByCustomer.get(state.selectedCustomerId); if (alert) navigateTo('queue', alert.id); });
      document.querySelector('[data-customer-action="edd"]')?.addEventListener('click', () => showToast(`EDD request created for ${state.selectedCustomerId}.`));
      document.querySelector('[data-customer-action="note"]')?.addEventListener('click', () => showToast(`Analyst note panel opened for ${state.selectedCustomerId}.`));
      document.getElementById('customerReviewBtn')?.addEventListener('click', () => { state.customerRisk='HIGH'; renderCustomers(); });
      document.getElementById('customerExportBtn')?.addEventListener('click', () => showToast('Customer risk cohort prepared for export.'));
    }

    // ANALYTICS -------------------------------------------------------------
    function mountAnalytics() {
      const view = document.getElementById('view-analytics');
      if (!view) return;
      view.innerHTML = `<div class="ops-shell" id="opsAnalyticsRoot"></div>`;
      renderAnalytics();
    }

    function lineChartSVG(series) {
      const w=680, h=190, px=28, py=18;
      const max = Math.max(...series.alerts, ...series.blocked) * 1.12;
      const points = values => values.map((value,i) => {
        const x = px + i * ((w-px*2)/(values.length-1));
        const y = h-py - (value/max)*(h-py*2);
        return [x,y];
      });
      const a=points(series.alerts), b=points(series.blocked);
      const line = pts => pts.map(p=>p.join(',')).join(' ');
      const area = `${px},${h-py} ${line(a)} ${w-px},${h-py}`;
      return `<svg class="ops-chart-svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="Alert and blocked event trend"><defs><linearGradient id="opsAreaGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#322761"/><stop offset="1" stop-color="#322761" stop-opacity="0"/></linearGradient></defs>${[.2,.4,.6,.8].map(v=>`<line class="ops-chart-gridline" x1="${px}" x2="${w-px}" y1="${h-py-v*(h-py*2)}" y2="${h-py-v*(h-py*2)}"/>`).join('')}<polygon class="ops-chart-area" points="${area}"/><polyline class="ops-chart-line" points="${line(a)}"/><polyline class="ops-chart-line secondary" points="${line(b)}"/>${a.map(([x,y])=>`<circle class="ops-chart-dot" cx="${x}" cy="${y}" r="3"/>`).join('')}${series.labels.map((label,i)=>`<text class="ops-chart-axis" x="${px+i*((w-px*2)/(series.labels.length-1))}" y="${h-2}" text-anchor="middle">${label}</text>`).join('')}</svg>`;
    }

    function renderAnalytics() {
      const root = document.getElementById('opsAnalyticsRoot');
      if (!root) return;
      const series = analyticsSeries[state.analyticsRange];
      const totalAlerts = series.alerts.reduce((a,b)=>a+b,0);
      const totalBlocked = series.blocked.reduce((a,b)=>a+b,0);
      const heat = [12,24,18,31,48,62,35,18,28,42,57,71,66,38,9,17,29,53,78,84,46,14,21,36,64,88,72,41,11,20,34,58,74,68,39];
      root.innerHTML = `
        ${introHTML('Risk intelligence', 'Analytics · Control Performance', 'Understand what is driving fraud, where analyst effort is going, and whether automated controls are reducing loss without excessive customer friction.', [['Range', state.analyticsRange.toUpperCase()], ['Alerts', totalAlerts.toLocaleString()], ['Blocked', totalBlocked.toLocaleString()], ['Model health', 'Stable']])}
        <div class="ops-toolbar"><div style="display:flex;gap:6px">${['24h','7d','30d'].map(range=>`<button class="ops-btn small ${state.analyticsRange===range?'primary':''}" data-analytics-range="${range}">${range.toUpperCase()}</button>`).join('')}</div><div class="ops-toolbar-spacer"></div><button class="ops-btn" id="analyticsRefresh">${icon('activity')} Refresh metrics</button><button class="ops-btn primary" id="analyticsBrief">Generate shift brief</button></div>
        ${kpiHTML([
          {label:'Fraud loss prevented', value:'$1.84M', note:'30-day confirmed blocked exposure'},
          {label:'False positive rate', value:'2.1%', note:'0.9pp below operating threshold', tone:'purple'},
          {label:'Mean time to decide', value:'3.4m', note:'↓ 18% after split-workspace rollout', tone:'pink'},
          {label:'Auto-decision coverage', value:'82%', note:'Manual review reserved for ambiguous risk', tone:'muted'}
        ])}
        <div class="ops-grid analytics">
          <section class="ops-panel ops-chart-card"><div class="ops-panel-head"><div><div class="ops-panel-title">Alert pressure vs autonomous blocks</div><div class="ops-panel-subtitle">Incoming risk events and system containment</div></div><span class="ops-badge info">${state.analyticsRange.toUpperCase()}</span></div><div class="ops-chart-wrap">${lineChartSVG(series)}</div><div class="ops-chart-legend"><span><i class="ops-legend-dot"></i>Alerts created</span><span><i class="ops-legend-dot blue"></i>Autonomous blocks</span></div></section>
          <section class="ops-panel"><div class="ops-panel-head"><div><div class="ops-panel-title">Decision outcomes</div><div class="ops-panel-subtitle">Resolved analyst + automation decisions</div></div></div><div class="ops-panel-body"><div class="ops-outcomes">${[['Approved',64,'blue'],['Blocked / frozen',23,'pink'],['Step-up',8,'purple'],['Escalated',5,'']].map(([label,value,tone])=>`<div class="ops-outcome-row"><span>${label}</span><div class="ops-outcome-track"><div class="ops-outcome-fill ${tone}" style="width:${value}%"></div></div><strong>${value}%</strong></div>`).join('')}</div><div class="ops-section-label">Operational note</div><div class="ops-conflict-card" style="border-color:rgba(68,150,200,.25);background:rgba(68,150,200,.06)">Approval share is stable while step-up challenges fell 2.3pp, indicating less customer friction without a corresponding rise in confirmed fraud.</div></div></section>
        </div>
        <div class="ops-grid analytics">
          <section class="ops-panel"><div class="ops-panel-head"><div><div class="ops-panel-title">Threat intensity heatmap</div><div class="ops-panel-subtitle">7-day × 5 time-band signal density</div></div></div><div class="ops-panel-body"><div class="ops-heatmap">${heat.map((v,i)=>`<div class="ops-heat-cell" style="--heat:${(0.08+v/120).toFixed(2)}" data-tip="${v} risk events"></div>`).join('')}</div><div class="ops-section-label">Dominant typologies</div><div class="ops-driver-list">${[['Account takeover',82],['Carding / bots',68],['Friendly fraud',49],['Merchant abuse',33]].map(([name,value])=>`<div class="ops-driver-row"><span>${name}</span><div class="ops-driver-track"><div class="ops-driver-fill ${value>70?'hot':''}" style="width:${value}%"></div></div><span class="ops-driver-score">${value}</span></div>`).join('')}</div></div></section>
          <section class="ops-panel"><div class="ops-panel-head"><div><div class="ops-panel-title">Analyst throughput</div><div class="ops-panel-subtitle">Current shift quality and speed</div></div></div><div class="ops-panel-body"><div class="ops-analyst-row" style="font-family:var(--font-mono);color:var(--text-muted);font-size:.56rem;text-transform:uppercase"><span>Analyst</span><span>Cases</span><span>MTTD</span><span>Quality</span></div>${[['Đỗ Anh Nghĩa',34,'2.9m','98%'],['Mina Patel',29,'3.1m','97%'],['Leo Martins',24,'3.8m','96%'],['Sarah Jenkins',21,'4.0m','99%']].map(row=>`<div class="ops-analyst-row"><strong>${row[0]}</strong><span class="ops-id">${row[1]}</span><span class="ops-id">${row[2]}</span><span class="ops-badge clean">${row[3]}</span></div>`).join('')}</div></section>
        </div>
        <section class="ops-panel table-panel"><div class="ops-panel-head"><div><div class="ops-panel-title">Top rule performance</div><div class="ops-panel-subtitle">Rules contributing most to review volume and containment</div></div><button class="ops-btn small" id="analyticsRulesBtn">Open Rules Engine</button></div><div class="ops-panel-body flush"><table class="ops-table"><thead><tr><th>Rule</th><th>Category</th><th>Executions</th><th>False positive</th><th>Contribution</th><th>State</th></tr></thead><tbody>${SENTRY_DATA.rulesInventory.map(rule=>`<tr><td><div class="ops-id">${rule.id}</div><div class="ops-secondary">${rule.name.replaceAll('_',' ')}</div></td><td>${rule.category}</td><td class="ops-id">${rule.triggered24h}</td><td class="ops-id">${rule.falsePositiveRate}</td><td><div class="ops-driver-track" style="min-width:90px"><div class="ops-driver-fill" style="width:${Math.min(100,rule.triggered24h/3.2)}%"></div></div></td><td><span class="ops-badge clean">${rule.status}</span></td></tr>`).join('')}</tbody></table></div></section>`;
      bindAnalyticsEvents();
    }

    function bindAnalyticsEvents() {
      document.querySelectorAll('[data-analytics-range]').forEach(btn => btn.addEventListener('click', () => { state.analyticsRange = btn.dataset.analyticsRange; renderAnalytics(); }));
      document.getElementById('analyticsRefresh')?.addEventListener('click', () => showToast('Risk metrics refreshed from the latest prototype snapshot.'));
      document.getElementById('analyticsBrief')?.addEventListener('click', () => showToast('Shift brief generated: loss prevented, queue pressure, conflicts and analyst throughput summarized.'));
      document.getElementById('analyticsRulesBtn')?.addEventListener('click', () => navigateTo('rules'));
    }

    // AUDIT -----------------------------------------------------------------
    function mountAudit() {
      const view = document.getElementById('view-audit');
      if (!view) return;
      view.innerHTML = `<div class="ops-shell" id="opsAuditRoot"></div>`;
      renderAudit();
    }

    function auditRows() {
      const base = consoleApp.auditLog || SENTRY_DATA.auditLog;
      const extra = [
        {id:'AUD-99117',timestamp:'2026-09-15 23:51:12 UTC',actor:'SENTRY Rule Service',entity:'RULE-301',action:'POLICY_EVALUATED',rationale:'Cross-border luxury hold evaluated against VIP exemption path.',verdict:'CONFLICT_ROUTED',riskScoreAfter:62},
        {id:'AUD-99116',timestamp:'2026-09-15 23:42:09 UTC',actor:'Mina Patel (Fraud Analyst)',entity:'CASE-4398',action:'EVIDENCE_REQUESTED',rationale:'Requested device trust history and customer callback before final disposition.',verdict:'PENDING_EVIDENCE',riskScoreAfter:81},
        {id:'AUD-99115',timestamp:'2026-09-15 23:18:44 UTC',actor:'SENTRY Auth Gateway',entity:'CUST-66104',action:'STEP_UP_PASSED',rationale:'Biometric challenge completed on a previously trusted mobile device.',verdict:'ALLOWED_CLEAN',riskScoreAfter:18}
      ];
      return [...base, ...extra];
    }

    function tinyHash(text) {
      let hash = 2166136261;
      for (let i=0;i<text.length;i++) { hash ^= text.charCodeAt(i); hash = Math.imul(hash, 16777619); }
      return `sha256-demo-${(hash>>>0).toString(16).padStart(8,'0')}-${text.length.toString(16).padStart(4,'0')}`;
    }

    function filteredAudit() {
      const q = state.auditQuery.toLowerCase();
      return auditRows().filter(row => {
        if (q && !`${row.id} ${row.actor} ${row.entity} ${row.action} ${row.rationale} ${row.verdict}`.toLowerCase().includes(q)) return false;
        if (state.auditActor !== 'ALL' && !row.actor.includes(state.auditActor)) return false;
        if (state.auditAction !== 'ALL' && row.action !== state.auditAction) return false;
        return true;
      });
    }

    function renderAudit() {
      const root = document.getElementById('opsAuditRoot');
      if (!root) return;
      const rows = filteredAudit();
      const all = auditRows();
      const analysts = [...new Set(all.map(r => r.actor.split(' (')[0]))];
      const actions = [...new Set(all.map(r => r.action))];
      const headHash = tinyHash(all.map(r => `${r.id}:${r.timestamp}:${r.action}`).join('|'));
      root.innerHTML = `
        ${introHTML('Forensic accountability', 'Audit Log · Evidence Ledger', 'Trace every human and automated decision with searchable rationale, entity context and a visible integrity chain for review-ready operations.', [['Events', all.length], ['Human actions', all.filter(r=>!r.actor.includes('SENTRY')).length], ['System actions', all.filter(r=>r.actor.includes('SENTRY')).length], ['Integrity', 'VERIFIED']])}
        <div class="ops-integrity-banner"><div class="ops-integrity-copy"><div class="ops-integrity-icon">${icon('shieldCheck')}</div><div><div class="ops-integrity-title">Ledger chain verified for this prototype snapshot</div><div class="ops-integrity-sub">No gaps detected across displayed events · head ${headHash}</div></div></div><button class="ops-btn" id="verifyAuditBtn">Verify chain</button></div>
        <div class="ops-toolbar"><div class="ops-search-wrap">${icon('search')}<input id="auditSearch" class="ops-search" value="${state.auditQuery}" placeholder="Search actor, entity, action, rationale or outcome…"></div><select id="auditActor" class="ops-select"><option value="ALL">All actors</option>${analysts.map(a=>`<option value="${a}">${a}</option>`).join('')}</select><select id="auditAction" class="ops-select"><option value="ALL">All actions</option>${actions.map(a=>`<option value="${a}">${a.replaceAll('_',' ')}</option>`).join('')}</select><div class="ops-toolbar-spacer"></div><button class="ops-btn primary" id="auditExportBtn">Export CSV</button></div>
        ${kpiHTML([
          {label:'Events / current shift', value:String(all.length), note:'Human + automation decisions in the visible ledger'},
          {label:'Rationale coverage', value:'100%', note:'All high-stakes actions carry an explanation', tone:'purple'},
          {label:'Policy overrides', value:'2', note:'Supervisor-visible and linked to case context', tone:'pink'},
          {label:'Chain continuity', value:'100%', note:'No missing sequence in displayed snapshot', tone:'muted'}
        ])}
        <div class="ops-grid audit">
          <section class="ops-panel table-panel"><div class="ops-panel-head"><div><div class="ops-panel-title">Forensic event ledger</div><div class="ops-panel-subtitle">${rows.length} events match current filters</div></div><span class="ops-badge clean">APPEND-ONLY</span></div><div class="ops-panel-body flush">${rows.length ? `<table class="ops-table"><thead><tr><th>Event</th><th>Actor</th><th>Entity</th><th>Action</th><th>Rationale</th><th>Outcome</th></tr></thead><tbody>${rows.map(row=>`<tr><td><div class="ops-id">${row.id}</div><div class="ops-secondary">${row.timestamp}</div></td><td><div class="ops-entity">${row.actor}</div></td><td class="ops-id">${row.entity}</td><td><span class="ops-badge info">${row.action.replaceAll('_',' ')}</span></td><td style="max-width:360px"><div style="line-height:1.45">${row.rationale}</div><div class="ops-hash">${tinyHash(`${row.id}|${row.actor}|${row.action}`)}</div></td><td><span class="ops-badge ${row.verdict.includes('FRAUD')?'danger':row.verdict.includes('PENDING')||row.verdict.includes('CONFLICT')?'warning':'clean'}">${row.verdict.replaceAll('_',' ')}</span></td></tr>`).join('')}</tbody></table>` : '<div class="ops-empty">No ledger events match the active filters.</div>'}</div></section>
          <aside class="ops-panel"><div class="ops-panel-head"><div><div class="ops-panel-title">Recent integrity trail</div><div class="ops-panel-subtitle">Latest decisions with chain references</div></div></div><div class="ops-panel-body"><div class="ops-audit-feed">${all.slice(0,5).map(row=>`<article class="ops-audit-event"><div class="ops-audit-event-top"><strong>${row.action.replaceAll('_',' ')}</strong><span class="ops-secondary">${row.id}</span></div><p>${row.actor} → ${row.entity}<br>${row.rationale}</p><code>${tinyHash(`${row.id}|${row.timestamp}|${row.verdict}`)}</code></article>`).join('')}</div></div></aside>
        </div>`;
      document.getElementById('auditActor').value = state.auditActor;
      document.getElementById('auditAction').value = state.auditAction;
      bindAuditEvents();
    }

    function exportAuditCSV() {
      const rows = filteredAudit();
      const escape = value => `"${String(value ?? '').replaceAll('"','""')}"`;
      const csv = [['Audit ID','Timestamp','Actor','Entity','Action','Rationale','Outcome'], ...rows.map(row => [row.id,row.timestamp,row.actor,row.entity,row.action,row.rationale,row.verdict])].map(row => row.map(escape).join(',')).join('\n');
      const blob = new Blob([csv], { type:'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sentry-audit-ledger.csv';
      a.click();
      URL.revokeObjectURL(url);
      showToast(`${rows.length} audit events exported.`);
    }

    function bindAuditEvents() {
      document.getElementById('auditSearch')?.addEventListener('input', event => { state.auditQuery = event.target.value; renderAudit(); requestAnimationFrame(() => document.getElementById('auditSearch')?.focus()); });
      document.getElementById('auditActor')?.addEventListener('change', event => { state.auditActor = event.target.value; renderAudit(); });
      document.getElementById('auditAction')?.addEventListener('change', event => { state.auditAction = event.target.value; renderAudit(); });
      document.getElementById('verifyAuditBtn')?.addEventListener('click', () => showToast('Displayed audit chain verified: sequence continuity and prototype hashes are consistent.'));
      document.getElementById('auditExportBtn')?.addEventListener('click', exportAuditCSV);
    }

    mountCases();
    mountRules();
    mountCustomers();
    mountAnalytics();
    mountAudit();

    document.addEventListener('click', event => {
      const tab = event.target.closest('.nav-tab[data-view]');
      if (!tab) return;
      const view = tab.dataset.view;
      if (view === 'audit') window.setTimeout(renderAudit, 0);
      if (view === 'cases') window.setTimeout(renderCases, 0);
      if (view === 'customers') window.setTimeout(renderCustomers, 0);
    });
  }
})();
