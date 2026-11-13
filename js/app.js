// SENTRY // Fraud & Risk Operations Console — Interaction Engine
// Forensic / Dense / Controlled / High-Stakes Decision Workspace

class SentryFraudConsole {
  constructor() {
    this.currentView = 'queue';
    this.activeAlertId = 'ALT-8921';
    this.currentFilter = 'ALL';
    this.searchTerm = '';
    this.selectedTag = '';
    this.pendingDecision = null;
    this.decisionMinRationaleLength = 20;
    this.routableViews = new Set(['queue', 'cases', 'rules', 'customers', 'analytics', 'audit']);
    this.routeSyncMuted = false;
    this.store = window.SentryStore;
    // Store-backed collections: mutations persist to sessionStorage via store.save().
    this.alerts = this.store ? this.store.state.alerts : JSON.parse(JSON.stringify(SENTRY_DATA.alerts));
    this.auditLog = this.store ? this.store.state.auditLog : JSON.parse(JSON.stringify(SENTRY_DATA.auditLog));
    this.routeParam = null;
    this.bulkMode = false;
    this.bulkSelection = new Set();
    this.queueLoad = 'loading';
    this.commitInFlight = false;

    this.hydrateRouteState();
    this.init();
  }

  init() {
    if (this.store) this.store.mountControls();
    this.bindNavigation();
    this.bindQueueWorkflow();
    this.bindFilters();
    this.bindSearch();
    this.bindDecisionPanel();
    this.renderAlertQueue();
    this.renderActiveAlert();
    this.renderRulesEngine();
    this.renderAuditLog();
    this.renderAnalytics();
    this.renderCustomers();
    this.updateHeaderCounters();
    this.switchView(this.currentView, { syncRoute: false, param: this.routeParam });
    this.syncRoute({ replace: true });
    if (this.missingAlertId) this.showToast(`Alert ${this.missingAlertId} was not found. Showing ${this.activeAlertId} instead.`);
    if (this.store && this.store.consumeResetNotice()) this.showToast('Demo data reset to the original seed.');
    this.loadQueue();
  }

  bindNavigation() {
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const view = tab.getAttribute('data-view');
        this.switchView(view);
      });
    });

    const restoreRoute = () => this.applyRouteFromLocation();
    window.addEventListener('popstate', restoreRoute);
    window.addEventListener('hashchange', restoreRoute);

    // Keyboard shortcuts for fraud analysts: [1]-[6]
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === '1') this.switchView('queue');
      else if (e.key === '2') this.switchView('cases');
      else if (e.key === '3') this.switchView('rules');
      else if (e.key === '4') this.switchView('customers');
      else if (e.key === '5') this.switchView('analytics');
      else if (e.key === '6') this.switchView('audit');
      // Tactical decision hotkeys are scoped to the investigation queue.
      // preventDefault() is required because validation may focus the rationale
      // textarea during keydown; without it, the shortcut key itself is typed
      // into the rationale field after the guard blocks the action.
      else if (this.currentView === 'queue' && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        this.requestDecision('FROZEN');
      } else if (this.currentView === 'queue' && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        this.requestDecision('APPROVED');
      } else if (this.currentView === 'queue' && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        this.requestDecision('NEEDS_VERIFICATION');
      } else if (this.currentView === 'queue' && e.key === 'Escape' && this.pendingDecision) {
        e.preventDefault();
        this.cancelPendingDecision('Pending decision cancelled.');
      }
    });
  }

  routeFallbackView() {
    const file = window.location.pathname.split('/').pop().toLowerCase();
    const routeByFile = {
      'cases.html': 'cases',
      'rules.html': 'rules',
      'customers.html': 'customers',
      'analytics.html': 'analytics',
      'audit.html': 'audit'
    };
    return routeByFile[file] || 'queue';
  }

  readRouteState() {
    const fallbackView = this.routeFallbackView();
    const fallbackAlertId = this.alerts.some(alert => alert.id === this.activeAlertId)
      ? this.activeAlertId
      : this.alerts[0]?.id;
    const rawHash = window.location.hash.replace(/^#/, '').trim();

    if (!rawHash) {
      return {
        view: fallbackView,
        alertId: fallbackView === 'queue' ? fallbackAlertId : null,
        valid: true
      };
    }

    let parts;
    try {
      parts = rawHash.split('/').filter(Boolean).map(part => decodeURIComponent(part));
    } catch (error) {
      return { view: 'queue', alertId: fallbackAlertId, valid: false };
    }

    const requestedView = (parts[0] || '').toLowerCase();
    if (!this.routableViews.has(requestedView)) {
      return { view: 'queue', alertId: fallbackAlertId, valid: false };
    }

    if (requestedView !== 'queue') {
      // Detail routes (#cases/CASE-4401, #rules/RULE-402, ...) carry a record id.
      // Unknown ids are kept so the workspace can render a not-found state.
      return {
        view: requestedView,
        alertId: null,
        param: parts[1] || null,
        valid: parts.length <= 2
      };
    }

    const requestedAlertId = parts[1] || fallbackAlertId;
    const alertExists = this.alerts.some(alert => alert.id === requestedAlertId);
    return {
      view: 'queue',
      alertId: alertExists ? requestedAlertId : fallbackAlertId,
      missingAlertId: parts[1] && !alertExists ? parts[1] : null,
      valid: parts.length <= 2 && alertExists
    };
  }

  hydrateRouteState() {
    const route = this.readRouteState();
    this.currentView = route.view;
    this.routeParam = route.param || null;
    this.missingAlertId = route.missingAlertId || null;
    if (route.view === 'queue' && route.alertId) this.activeAlertId = route.alertId;
  }

  routeHash(viewId = this.currentView, alertId = this.activeAlertId) {
    if (viewId === 'queue') {
      const safeAlertId = this.alerts.some(alert => alert.id === alertId)
        ? alertId
        : this.alerts[0]?.id;
      return `#queue/${encodeURIComponent(safeAlertId || '')}`;
    }
    return this.routeParam ? `#${viewId}/${encodeURIComponent(this.routeParam)}` : `#${viewId}`;
  }

  syncRoute({ replace = false } = {}) {
    if (this.routeSyncMuted) return;
    const nextHash = this.routeHash();
    if (window.location.hash === nextHash) {
      this.updateDocumentTitle();
      return;
    }

    const method = replace ? 'replaceState' : 'pushState';
    window.history[method](
      { sentryView: this.currentView, alertId: this.currentView === 'queue' ? this.activeAlertId : null },
      '',
      `${window.location.pathname}${window.location.search}${nextHash}`
    );
    this.updateDocumentTitle();
  }

  applyRouteFromLocation() {
    const route = this.readRouteState();
    const previousView = this.currentView;
    const previousAlertId = this.activeAlertId;

    this.routeSyncMuted = true;
    if (this.pendingDecision && (route.view !== 'queue' || route.alertId !== this.activeAlertId)) {
      this.cancelPendingDecision('Pending decision cancelled because navigation context changed.');
    }

    if (route.view === 'queue' && route.alertId) this.activeAlertId = route.alertId;
    this.switchView(route.view, { syncRoute: false, param: route.param || null });
    if (route.missingAlertId) this.showToast(`Alert ${route.missingAlertId} was not found. Showing ${this.activeAlertId} instead.`);

    if (route.view === 'queue' && (previousView !== 'queue' || previousAlertId !== this.activeAlertId)) {
      this.renderAlertQueue();
      this.renderActiveAlert();
    }
    this.routeSyncMuted = false;

    const canonicalHash = this.routeHash();
    if (!route.valid || window.location.hash !== canonicalHash) {
      this.syncRoute({ replace: true });
    } else {
      this.updateDocumentTitle();
    }
  }

  updateDocumentTitle() {
    const labels = {
      queue: 'Alert Queue',
      cases: 'Cases',
      rules: 'Rules Engine',
      customers: 'Customers',
      analytics: 'Analytics',
      audit: 'Audit Log'
    };
    const context = this.currentView === 'queue' ? ` · ${this.activeAlertId}` : (this.routeParam ? ` · ${this.routeParam}` : '');
    document.title = `SENTRY — ${labels[this.currentView] || 'Fraud & Risk Operations Console'}${context}`;
  }

  // Programmatic navigation used by the secondary workspaces (detail routes).
  navigate(viewId, param = null, { replace = false } = {}) {
    if (viewId === 'queue' && param && this.alerts.some(alert => alert.id === param)) {
      this.activeAlertId = param;
      this.renderAlertQueue();
      this.renderActiveAlert();
    }
    this.switchView(viewId, { param: viewId === 'queue' ? null : param, replaceRoute: replace });
  }

  switchView(viewId, { syncRoute = true, replaceRoute = false, param = null } = {}) {
    const nextView = this.routableViews.has(viewId) ? viewId : 'queue';
    this.routeParam = nextView === 'queue' ? null : param;
    if (this.pendingDecision && !this.commitInFlight && this.currentView === 'queue' && nextView !== 'queue') {
      this.cancelPendingDecision('Pending decision cancelled because you left the investigation queue.');
    }
    this.currentView = nextView;

    document.querySelectorAll('.nav-tab').forEach(tab => {
      const active = tab.getAttribute('data-view') === nextView;
      tab.classList.toggle('active', active);
      if (active) tab.setAttribute('aria-current', 'page');
      else tab.removeAttribute('aria-current');
    });

    document.querySelectorAll('.console-view').forEach(view => {
      view.classList.toggle('active', view.id === `view-${nextView}`);
    });

    this.updateDocumentTitle();
    if (syncRoute) this.syncRoute({ replace: replaceRoute });
    document.dispatchEvent(new CustomEvent('sentry:route', { detail: { view: nextView, param: this.routeParam } }));
  }

  bindFilters() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentFilter = btn.getAttribute('data-filter');
        this.renderAlertQueue();
      });
    });
  }

  bindSearch() {
    const input = document.getElementById('alertSearchInput');
    if (input) {
      input.addEventListener('input', (e) => {
        this.searchTerm = e.target.value.toLowerCase().trim();
        this.renderAlertQueue();
      });
    }
  }

  bindDecisionPanel() {
    const noteArea = document.getElementById('analystNoteInput');
    const evidenceAck = document.getElementById('decisionEvidenceAck');
    const confirmButton = document.getElementById('btnConfirmDecision');
    const cancelButton = document.getElementById('btnCancelDecision');

    // Rationale tag buttons classify the reason, but the tag itself never
    // satisfies the human-authored rationale requirement.
    document.querySelectorAll('.tag-btn').forEach(tag => {
      tag.addEventListener('click', () => {
        if (this.pendingDecision) this.cancelPendingDecision('Rationale changed — stage the action again.');
        document.querySelectorAll('.tag-btn').forEach(t => t.classList.remove('active'));
        tag.classList.add('active');
        this.selectedTag = tag.getAttribute('data-tag');

        if (noteArea && !noteArea.value.includes(`[${this.selectedTag}]`)) {
          noteArea.value = `[${this.selectedTag}] ` + noteArea.value.replace(/^\[[^\]]+\]\s*/, '');
        }
        this.updateRationaleValidation();
      });
    });

    if (noteArea) {
      noteArea.addEventListener('input', () => {
        noteArea.removeAttribute('aria-invalid');
        if (this.pendingDecision) this.cancelPendingDecision('Rationale changed — stage the action again.');
        this.updateRationaleValidation();
      });
    }

    if (evidenceAck) {
      evidenceAck.addEventListener('change', () => {
        if (confirmButton) confirmButton.disabled = !evidenceAck.checked;
      });
    }
    if (confirmButton) confirmButton.addEventListener('click', () => this.confirmPendingDecision());
    if (cancelButton) cancelButton.addEventListener('click', () => this.cancelPendingDecision('Pending decision cancelled.'));

    const actionMap = [
      ['btnActionFreeze', 'FROZEN'],
      ['btnActionApprove', 'APPROVED'],
      ['btnActionStepUp', 'NEEDS_VERIFICATION'],
      ['btnActionEscalate', 'ESCALATED'],
      ['btnActionFalsePositive', 'FALSE_POSITIVE']
    ];
    actionMap.forEach(([id, verdict]) => {
      const button = document.getElementById(id);
      if (button) button.addEventListener('click', () => this.requestDecision(verdict));
    });
  }

  // ---------------------------------------------------------------------
  // Queue workflow: load state, assignment, case linking and bulk actions.
  // ---------------------------------------------------------------------
  loadQueue() {
    this.queueLoad = 'loading';
    this.renderAlertQueue();
    const request = this.store ? this.store.request('Loading the alert queue', null, { delay: 260 }) : Promise.resolve();
    return request.then(() => {
      this.queueLoad = 'ready';
      this.renderAlertQueue();
    }).catch(error => {
      this.queueLoad = 'error';
      this.queueError = error.message;
      this.renderAlertQueue();
    });
  }

  bindQueueWorkflow() {
    const selectToggle = document.getElementById('queueSelectToggle');
    if (selectToggle) {
      selectToggle.addEventListener('click', () => {
        this.bulkMode = !this.bulkMode;
        if (!this.bulkMode) this.bulkSelection.clear();
        selectToggle.setAttribute('aria-pressed', String(this.bulkMode));
        selectToggle.textContent = this.bulkMode ? 'Done selecting' : 'Select alerts';
        this.renderAlertQueue();
      });
    }
    document.getElementById('queueRefresh')?.addEventListener('click', () => this.loadQueue());
    document.getElementById('btnAssignAlert')?.addEventListener('click', () => this.assignAlerts([this.activeAlertId]));
    document.getElementById('btnAlertCase')?.addEventListener('click', () => {
      const alert = this.alerts.find(a => a.id === this.activeAlertId);
      if (!alert) return;
      const linked = this.store?.state.cases.find(c => c.id === alert.caseId);
      if (linked) this.navigate('cases', linked.id);
      else this.createCaseFromAlerts([alert.id]);
    });
    document.querySelectorAll('[data-bulk-action]').forEach(button => {
      button.addEventListener('click', () => this.runBulkAction(button.dataset.bulkAction));
    });
    document.addEventListener('sentry:store', () => {
      this.updateHeaderCounters();
      this.renderEvidenceActions();
    });
  }

  setBusy(button, busy, label) {
    if (!button) return;
    if (busy) {
      button.dataset.label = button.textContent;
      button.textContent = label || 'Saving…';
      button.disabled = true;
      button.setAttribute('aria-busy', 'true');
    } else {
      if (button.dataset.label) button.textContent = button.dataset.label;
      button.disabled = false;
      button.removeAttribute('aria-busy');
    }
  }

  assignAlerts(ids, button = document.getElementById('btnAssignAlert')) {
    if (!this.store || !ids.length) return Promise.resolve();
    const me = this.store.analyst().name;
    this.setBusy(button, true, 'Assigning…');
    return this.store.request('Assigning alerts', state => {
      ids.forEach(id => {
        const alert = state.alerts.find(a => a.id === id);
        if (!alert || alert.assignee === me) return;
        alert.assignee = me;
        this.store.audit({ entity: `${alert.id} / ${alert.customer.id}`, action: 'ALERT_ASSIGNED', rationale: `Assigned to ${me}.`, verdict: 'ASSIGNED', riskScoreAfter: alert.riskSpectrum.totalScore });
      });
    }).then(() => {
      this.showToast(ids.length === 1 ? `${ids[0]} assigned to ${me}.` : `${ids.length} alerts assigned to ${me}.`);
      this.renderAlertQueue();
      this.renderEvidenceActions();
    }).catch(error => this.showToast(`${error.message} Try again.`))
      .finally(() => { this.setBusy(button, false); this.renderEvidenceActions(); });
  }

  createCaseFromAlerts(ids, button = document.getElementById('btnAlertCase')) {
    if (!this.store || !ids.length) return Promise.resolve();
    const me = this.store.analyst().name;
    this.setBusy(button, true, 'Creating case…');
    let created = null;
    return this.store.request('Creating the case', state => {
      const alerts = ids.map(id => state.alerts.find(a => a.id === id)).filter(Boolean);
      const lead = alerts.slice().sort((a, b) => b.riskSpectrum.totalScore - a.riskSpectrum.totalScore)[0];
      const id = this.store.nextId('case', 'CASE-');
      created = {
        id,
        alertIds: alerts.map(a => a.id),
        priority: lead.riskSpectrum.totalScore >= 75 ? 'P0 CRITICAL' : 'P1 HIGH',
        status: 'UNDER_REVIEW',
        owner: me,
        queue: lead.transaction.type,
        sla: lead.riskSpectrum.totalScore >= 75 ? '30m 00s' : '2h 00m',
        opened: 'Just now',
        customerId: lead.customer.id,
        customer: lead.customer.name,
        amount: lead.transaction.amountFormatted,
        risk: lead.riskSpectrum.totalScore,
        title: (lead.triggeredRules[0]?.name || 'Linked alert investigation').replaceAll('_', ' '),
        summary: `${alerts.length} linked alert${alerts.length === 1 ? '' : 's'}, lead ${lead.id}`,
        notes: [],
        evidence: [],
        resolution: null
      };
      state.cases.unshift(created);
      alerts.forEach(alert => { alert.caseId = id; });
      this.store.audit({ entity: id, action: 'CASE_CREATED', rationale: `Case opened from ${created.alertIds.join(', ')}.`, verdict: 'UNDER_REVIEW', riskScoreAfter: lead.riskSpectrum.totalScore });
    }).then(() => {
      this.showToast(`${created.id} created from ${created.alertIds.join(', ')}.`);
      this.bulkSelection.clear();
      this.renderAlertQueue();
      this.renderEvidenceActions();
      this.navigate('cases', created.id);
    }).catch(error => this.showToast(`${error.message} Try again.`))
      .finally(() => this.setBusy(button, false));
  }

  runBulkAction(action) {
    const ids = [...this.bulkSelection];
    const errorBox = document.getElementById('queueBulkError');
    const showError = message => { if (errorBox) { errorBox.textContent = message; errorBox.hidden = !message; } };
    showError('');
    if (!ids.length) { showError('Select at least one alert first.'); return Promise.resolve(); }
    const button = document.querySelector(`[data-bulk-action="${action}"]`);
    if (action === 'assign') return this.assignAlerts(ids, button);
    if (action === 'case') return this.createCaseFromAlerts(ids, button);

    const verdict = action === 'escalate' ? 'ESCALATED' : 'FALSE_POSITIVE';
    const input = document.getElementById('queueBulkRationale');
    const rationale = (input?.value || '').trim();
    if (rationale.length < this.decisionMinRationaleLength) {
      showError(`Bulk ${verdict === 'ESCALATED' ? 'escalation' : 'false-positive closure'} needs a rationale of at least ${this.decisionMinRationaleLength} characters.`);
      input?.focus();
      return Promise.resolve();
    }
    const eligible = ids.filter(id => !this.isFinalDecisionStatus(this.alerts.find(a => a.id === id)?.status));
    const skipped = ids.length - eligible.length;
    if (!eligible.length) { showError('All selected alerts already have a committed decision.'); return Promise.resolve(); }

    this.setBusy(button, true, 'Saving…');
    return this.store.request(`Bulk ${verdict.toLowerCase().replace('_', ' ')}`, state => {
      eligible.forEach(id => {
        const alert = state.alerts.find(a => a.id === id);
        alert.status = verdict;
        alert.analystDecision = rationale;
        alert.decisionMeta = { classification: 'Bulk action', recommendation: alert.riskSpectrum.recommendation, recommendationOverride: false, evidenceReviewAcknowledged: true };
        this.store.audit({ entity: `${alert.id} / ${alert.customer.id}`, action: verdict, rationale: `${rationale} (bulk action)`, verdict, riskScoreAfter: alert.riskSpectrum.totalScore });
      });
    }).then(() => {
      if (input) input.value = '';
      this.bulkSelection.clear();
      this.showToast(`${eligible.length} alert${eligible.length === 1 ? '' : 's'} marked ${verdict.replace('_', ' ').toLowerCase()}${skipped ? `, ${skipped} skipped (already decided)` : ''}.`);
      this.renderAlertQueue();
      this.renderActiveAlert();
      this.renderAuditLog();
      this.updateHeaderCounters();
    }).catch(error => showError(`${error.message} Your rationale is kept; try again.`))
      .finally(() => this.setBusy(button, false));
  }

  renderEvidenceActions() {
    const alert = this.alerts.find(a => a.id === this.activeAlertId);
    if (!alert) return;
    const me = this.store?.analyst().name;
    const assignee = document.getElementById('evidenceAssignee');
    const assignButton = document.getElementById('btnAssignAlert');
    const caseButton = document.getElementById('btnAlertCase');
    if (assignee) assignee.textContent = alert.assignee ? `Assignee: ${alert.assignee}` : 'Unassigned';
    if (assignButton && !assignButton.hasAttribute('aria-busy')) {
      const mine = alert.assignee && alert.assignee === me;
      assignButton.textContent = mine ? 'Assigned to you' : 'Assign to me';
      assignButton.disabled = Boolean(mine);
    }
    if (caseButton && !caseButton.hasAttribute('aria-busy')) {
      const linked = this.store?.state.cases.find(c => c.id === alert.caseId);
      caseButton.textContent = linked ? `Open ${linked.id}` : 'Create case';
    }
    const caseLabel = document.getElementById('evidenceCaseId');
    if (caseLabel) caseLabel.textContent = alert.caseId || 'NO CASE';
  }

  renderBulkBar() {
    const bar = document.getElementById('queueBulkBar');
    if (!bar) return;
    bar.hidden = !this.bulkMode;
    const count = document.getElementById('queueBulkCount');
    if (count) count.textContent = `${this.bulkSelection.size} selected`;
  }

  renderAlertQueue() {
    const container = document.getElementById('alertQueueList');
    if (!container) return;

    let filtered = this.alerts.filter(alert => {
      // Filter tab
      if (this.currentFilter === 'HIGH_RISK' && alert.status !== 'HIGH_RISK') return false;
      if (this.currentFilter === 'RULE_CONFLICT' && !alert.ruleConflict) return false;
      if (this.currentFilter === 'NEEDS_VERIFICATION' && alert.status !== 'NEEDS_VERIFICATION') return false;
      if (this.currentFilter === 'FROZEN' && alert.status !== 'FROZEN') return false;
      if (this.currentFilter === 'RESOLVED' && !['APPROVED', 'FALSE_POSITIVE', 'ESCALATED', 'RESOLVED'].includes(alert.status)) return false;

      // Search
      if (this.searchTerm) {
        const term = this.searchTerm;
        const matchName = alert.customer.name.toLowerCase().includes(term);
        const matchId = alert.id.toLowerCase().includes(term);
        const matchMerchant = alert.transaction.merchant.toLowerCase().includes(term);
        const matchIp = alert.network.ip.toLowerCase().includes(term);
        if (!matchName && !matchId && !matchMerchant && !matchIp) return false;
      }

      return true;
    });

    container.innerHTML = '';
    this.renderBulkBar();
    container.setAttribute('aria-busy', String(this.queueLoad === 'loading'));
    const countEl = document.getElementById('queueCountBadge');

    if (this.queueLoad === 'loading') {
      container.innerHTML = '<div class="queue-state" role="status"><div class="queue-skeleton"></div><div class="queue-skeleton"></div><div class="queue-skeleton"></div><span class="queue-state-copy">Loading alerts…</span></div>';
      if (countEl) countEl.textContent = 'Loading';
      return;
    }
    if (this.queueLoad === 'error') {
      container.innerHTML = `<div class="queue-state is-error" role="alert"><strong>Queue failed to load</strong><span class="queue-state-copy">${this.queueError || 'The alert service did not respond.'}</span><button type="button" class="queue-tool-btn" id="queueRetry">Retry</button></div>`;
      container.querySelector('#queueRetry').addEventListener('click', () => this.loadQueue());
      if (countEl) countEl.textContent = 'Offline';
      return;
    }

    if (filtered.length === 0) {
      container.innerHTML = `<div class="queue-empty"><span>No alerts match the current filter.</span><button type="button" class="queue-tool-btn" id="queueClearFilters">Clear filters</button></div>`;
      container.querySelector('#queueClearFilters').addEventListener('click', () => {
        this.currentFilter = 'ALL';
        this.searchTerm = '';
        const search = document.getElementById('alertSearchInput');
        if (search) search.value = '';
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b.getAttribute('data-filter') === 'ALL'));
        document.querySelectorAll('.filter-btn').forEach(b => b.setAttribute('aria-pressed', String(b.classList.contains('active'))));
        this.renderAlertQueue();
      });
      if (countEl) countEl.textContent = '0 Alerts';
      return;
    }

    filtered.forEach(alert => {
      const card = document.createElement('div');
      const isSelected = alert.id === this.activeAlertId;
      card.className = `queue-alert-card status-${alert.status.toLowerCase()} ${isSelected ? 'active' : ''}`;
      
      let statusBadge = '';
      if (alert.status === 'HIGH_RISK') {
        statusBadge = `<span class="badge-status badge-danger">RISK ${alert.riskSpectrum.totalScore}</span>`;
      } else if (alert.ruleConflict && alert.status === 'RULE_CONFLICT') {
        statusBadge = `<span class="badge-status badge-conflict">RULE CONFLICT</span>`;
      } else if (alert.status === 'NEEDS_VERIFICATION') {
        statusBadge = `<span class="badge-status badge-warning">VERIFY</span>`;
      } else if (alert.status === 'FROZEN') {
        statusBadge = `<span class="badge-status badge-frozen">FROZEN</span>`;
      } else if (alert.status === 'APPROVED' || alert.status === 'RESOLVED') {
        statusBadge = `<span class="badge-status badge-clean">RESOLVED</span>`;
      } else {
        statusBadge = `<span class="badge-status badge-neutral">${alert.status.replaceAll('_', ' ')}</span>`;
      }
      const selectBox = this.bulkMode
        ? `<input type="checkbox" class="queue-select-box" aria-label="Select ${alert.id}" ${this.bulkSelection.has(alert.id) ? 'checked' : ''}>`
        : '';
      const assigneeLine = alert.assignee ? `<span class="alert-card-assignee">Assignee: ${alert.assignee}</span>` : '';

      card.innerHTML = `
        <div class="alert-card-top">
          <span class="alert-card-select">${selectBox}<span class="alert-card-id mono">${alert.id}</span></span>
          ${statusBadge}
        </div>
        <div class="alert-card-cust">${alert.customer.name}</div>
        <div class="alert-card-amt mono">${alert.transaction.amountFormatted}</div>
        <div class="alert-card-merchant">${alert.transaction.merchant}</div>
        <div class="alert-card-bottom">
          <span class="alert-card-rule mono">${alert.triggeredRules[0] ? alert.triggeredRules[0].name : 'BASELINE'}</span>
          <span class="alert-card-time mono">${alert.transaction.timestamp.split('(')[1].replace(')', '')}</span>
        </div>
        ${assigneeLine}
      `;
      const box = card.querySelector('.queue-select-box');
      if (box) {
        box.addEventListener('click', event => event.stopPropagation());
        box.addEventListener('keydown', event => event.stopPropagation());
        box.addEventListener('change', () => {
          if (box.checked) this.bulkSelection.add(alert.id);
          else this.bulkSelection.delete(alert.id);
          this.renderBulkBar();
        });
      }

      card.addEventListener('click', () => {
        this.activeAlertId = alert.id;
        this.renderAlertQueue();
        this.renderActiveAlert();
        this.syncRoute();
      });

      container.appendChild(card);
    });

    // Update queue count pill
    if (countEl) countEl.textContent = `${filtered.length} Alerts`;
  }

  renderActiveAlert() {
    const alert = this.alerts.find(a => a.id === this.activeAlertId) || this.alerts[0];
    if (!alert) return;

    const setElemText = (id, val) => {
      const el = document.getElementById(id);
      if (el && val !== undefined && val !== null) el.textContent = val;
    };
    const setElemHtml = (id, val) => {
      const el = document.getElementById(id);
      if (el && val !== undefined && val !== null) el.innerHTML = val;
    };

    // Header strip
    setElemText('evidenceAlertId', alert.id);
    setElemText('evidenceCaseId', alert.caseId);
    setElemText('evidenceTimestamp', alert.transaction.timestamp);
    
    const stateBadge = document.getElementById('evidenceStateBadge');
    if (stateBadge) {
      stateBadge.textContent = alert.status.replace('_', ' ');
      stateBadge.className = `badge-status badge-${alert.status.toLowerCase()}`;
    }

    // Customer Identity Summary in Header Strip
    const custInfoEl = document.getElementById('evidenceCustomerInfo');
    if (custInfoEl) {
      custInfoEl.innerHTML = `<a class="bold evidence-cust-link" href="#customers/${encodeURIComponent(alert.customer.id)}">${alert.customer.name}</a> <span class="text-muted">(${alert.customer.id})</span> <span class="badge-tag tag-clean">${alert.customer.trustTier}</span> <span>Age ${alert.customer.accountAge}</span> <span>Vol ${alert.customer.lifetimeVolume}</span>`;
    }

    // Render Visual Diagrams via SentryVisuals (Visual-First Architecture)
    if (window.SentryVisuals) {
      window.SentryVisuals.renderDonutGauge('radialRiskGauge', alert.riskSpectrum.totalScore);
      window.SentryVisuals.renderVelocityChart('velocitySplineChart', alert.velocityCurve);
      window.SentryVisuals.renderVirtualCard('virtualCardContainer', alert.cardVisual, alert.transaction.amountFormatted);
      window.SentryVisuals.renderGeoHopDiagram('geoHopDiagramContainer', alert.geoHop);
      window.SentryVisuals.renderEntityGraph('entityGraphContainer', alert.entityGraph);
    }

    // Visual Signature 1: Risk Spectrum Breakdown (Legend beside donut gauge)
    this.renderRiskSpectrum(alert.riskSpectrum);

    // Visual Signature 2: Evidence Trace & Timeline
    this.renderTimeline(alert.timeline);

    // Update Card Subtitle if present
    setElemText('velocityCardSubtitle', alert.velocityCurve ? alert.velocityCurve.spikeLabel : '10m Window');

    // Evidence Section 2: Customer Identity & Profile (safe fallback)
    setElemText('evCustName', alert.customer.name);
    setElemText('evCustId', alert.customer.id);
    setElemText('evCustAccountAge', alert.customer.accountAge);
    setElemText('evCustTrustTier', alert.customer.trustTier);
    setElemText('evCustVolume', alert.customer.lifetimeVolume);
    setElemText('evCustDisputes', `${alert.customer.priorDisputes} Prior Chargebacks`);

    // Evidence Section 3: Device Fingerprint & Hardware Leak Dissector
    setElemText('evDeviceFp', alert.device.fingerprint);
    setElemText('evDeviceOS', alert.device.osReported);
    
    const canvasEl = document.getElementById('evDeviceCanvas');
    const canvasSub = document.getElementById('evDeviceCanvasSub');
    const hwBox = document.getElementById('evDeviceHardwareBox');

    if (alert.device.isMismatch) {
      if (canvasEl) canvasEl.innerHTML = `<span class="badge-tag tag-danger">SPOOF DETECTED</span> ${alert.device.actualHardware}`;
      if (canvasSub) {
        const warnIco = window.SentryIcons ? window.SentryIcons.alertTriangle : '';
        canvasSub.innerHTML = `${warnIco} Canvas Hash Spoof Detected`;
        canvasSub.className = 'dissect-sub mono text-danger';
      }
      if (hwBox) hwBox.className = 'dissect-box highlight-danger';
    } else {
      if (canvasEl) canvasEl.innerHTML = `<span class="badge-tag tag-clean">AUTHENTIC</span> ${alert.device.actualHardware || 'Hardware Verified'}`;
      if (canvasSub) {
        const checkIco = window.SentryIcons ? window.SentryIcons.check : '';
        canvasSub.innerHTML = `${checkIco} Authentic Hardware Signature`;
        canvasSub.className = 'dissect-sub mono text-clean';
      }
      if (hwBox) hwBox.className = 'dissect-box';
    }

    setElemText('evDeviceHistory', alert.device.deviceHistory);
    
    const proxyEl = document.getElementById('evNetProxy');
    if (proxyEl) {
      if (alert.device.isTor) {
        proxyEl.innerHTML = `<span class="badge-tag tag-danger">TOR EXIT NODE</span> Known Relay Anonymizer`;
      } else if (alert.device.isVpn) {
        proxyEl.innerHTML = `<span class="badge-tag tag-warning">VPN / PROXY SWARM</span> Datacenter Node`;
      } else {
        proxyEl.innerHTML = `<span class="badge-tag tag-clean">DIRECT / TRUSTED</span> Terminal Connection`;
      }
    }

    const tzEl = document.getElementById('evDeviceTz');
    if (tzEl) {
      if (alert.geoHop && alert.geoHop.isImpossible) {
        tzEl.textContent = `Geo Delta: ${alert.geoHop.distanceKm} (${alert.geoHop.speedKmh})`;
        tzEl.className = 'dissect-sub mono text-danger';
      } else if (alert.geoHop) {
        tzEl.textContent = `Transit: ${alert.geoHop.distanceKm} (${alert.geoHop.timeDeltaMin})`;
        tzEl.className = 'dissect-sub mono text-clean';
      } else {
        tzEl.textContent = 'Matched Location';
        tzEl.className = 'dissect-sub mono';
      }
    }

    // Evidence Section 5: Beneficiary & Counterparty
    const benefCard = document.getElementById('evidenceBeneficiaryCard');
    if (benefCard && alert.beneficiary) {
      benefCard.innerHTML = `
        <div class="evidence-grid-2">
          <div class="ev-item">
            <span class="ev-label">BENEFICIARY RECIPIENT</span>
            <span class="ev-val mono bold">${alert.beneficiary.name}</span>
          </div>
          <div class="ev-item">
            <span class="ev-label">ROUTING / IBAN</span>
            <span class="ev-val mono">${alert.beneficiary.accountNumber}</span>
          </div>
          <div class="ev-item">
            <span class="ev-label">BENEFICIARY ADDED</span>
            <span class="ev-val mono ${alert.beneficiary.isNew ? 'text-danger' : ''}">${alert.beneficiary.addedAgo}</span>
          </div>
          <div class="ev-item">
            <span class="ev-label">FATF JURISDICTION STATUS</span>
            <span class="ev-val mono">${alert.beneficiary.fatfJurisdiction} (${alert.beneficiary.riskRating})</span>
          </div>
        </div>
      `;
    }

    // Evidence Section 6: Triggered Rules & Conflicts
    this.renderTriggeredRules(alert.triggeredRules, alert.ruleConflict);

    // Populate Decision Dock
    setElemText('decisionScoreDisplay', `${alert.riskSpectrum.totalScore} / 100`);
    const recEl = document.getElementById('decisionRecommendation');
    if (recEl) {
      recEl.textContent = alert.riskSpectrum.recommendation.replace(/_/g, ' ');
      recEl.className = alert.riskSpectrum.totalScore >= 75 
        ? 'score-dock-recommendation text-danger' 
        : (alert.riskSpectrum.totalScore >= 50 ? 'score-dock-recommendation text-warning' : 'score-dock-recommendation text-clean');
    }
    
    // Reset decision drafting when the active alert changes. A committed
    // decision is displayed read-only and cannot be silently overwritten.
    this.pendingDecision = null;
    this.selectedTag = '';
    document.querySelectorAll('.tag-btn').forEach(t => t.classList.remove('active'));
    const noteArea = document.getElementById('analystNoteInput');
    if (noteArea) {
      noteArea.value = alert.analystDecision ? `[Resolved] ${alert.analystDecision}` : '';
      noteArea.readOnly = this.isFinalDecisionStatus(alert.status);
    }
    this.resetDecisionGuard();
    this.updateRationaleValidation();
    this.syncDecisionPanelState(alert);
    this.renderEvidenceActions();
  }

  renderRiskSpectrum(spectrum) {
    const container = document.getElementById('riskSpectrumBreakdown');
    if (!container || !spectrum) return;

    // Render score pills / legend items beside donut gauge
    container.innerHTML = '';
    const breakdown = spectrum.breakdown || spectrum.drivers || [];
    breakdown.forEach(seg => {
      const pill = document.createElement('div');
      pill.className = 'spectrum-legend-item';
      const label = seg.category || seg.label || 'Risk Factor';
      const score = seg.score !== undefined ? seg.score : (seg.points || 0);
      const color = seg.color || '#FE678A';
      const iconKey = seg.icon;
      const iconSvg = (window.SentryIcons && iconKey && window.SentryIcons[iconKey]) 
        ? window.SentryIcons[iconKey] 
        : '';

      pill.innerHTML = `
        <span class="spectrum-cat">${iconSvg}<span class="spectrum-dot" style="background-color: ${color};"></span>${label}</span>
        <span class="spectrum-pts mono bold" style="color: ${/fe678a/i.test(color) ? 'var(--risk-high-text)' : 'var(--accent-blue-text)'};">${score >= 0 ? '+' : ''}${score}</span>
      `;
      container.appendChild(pill);
    });
  }

  renderTimeline(timeline) {
    const container = document.getElementById('evidenceTimelineList');
    if (!container || !timeline) return;

    container.innerHTML = '';
    timeline.forEach(item => {
      const row = document.createElement('div');
      row.className = `timeline-row type-${item.type || 'clean'}`;
      row.innerHTML = `
        <div class="timeline-bullet"></div>
        <div class="timeline-content">
          <div class="timeline-header">
            <span class="timeline-title">${item.title || item.event || ''}</span>
            <span class="timeline-time mono">${item.time || item.timestamp || ''}</span>
          </div>
          <div class="timeline-detail">${item.desc || item.detail || ''}</div>
        </div>
      `;
      container.appendChild(row);
    });
  }

  renderTriggeredRules(rules, hasConflict) {
    const container = document.getElementById('evidenceRulesList');
    if (!container) return;

    container.innerHTML = '';

    if (hasConflict) {
      const conflictBanner = document.createElement('div');
      conflictBanner.className = 'rule-conflict-banner';
      const warnIcon = window.SentryIcons ? window.SentryIcons.alertTriangle : '';
      conflictBanner.innerHTML = `
        <div class="conflict-title">${warnIcon} SYSTEM RULE CONFLICT DETECTED</div>
        <div class="conflict-detail">
          <strong>RULE-301 (Cross-Border Luxury Hold)</strong> conflicts with <strong>RULE-012 (VIP Private Wealth Exemption)</strong>.
          Analyst manual triage required to establish precedence and prevent false-positive VIP friction.
        </div>
      `;
      container.appendChild(conflictBanner);
    }

    if (rules && Array.isArray(rules)) {
      rules.forEach(rule => {
        const item = document.createElement('div');
        const sevClass = (rule.severity || 'HIGH').toLowerCase();
        item.className = `rule-item-card sev-${sevClass}`;
        item.innerHTML = `
          <div class="rule-top">
            <span class="rule-id mono">${rule.id}</span>
            <span class="rule-name">${rule.name}</span>
            <span class="badge-severity ${sevClass}">${rule.severity || 'TRIGGERED'}</span>
          </div>
          <div class="rule-condition mono">${rule.condition || 'Pre-configured Operational Risk Trigger'}</div>
          <div class="rule-action">Action: <span class="mono bold">${rule.action || 'Hold for Manual Review'}</span></div>
        `;
        container.appendChild(item);
      });
    }
  }

  isFinalDecisionStatus(status) {
    return ['FROZEN', 'APPROVED', 'FALSE_POSITIVE', 'ESCALATED'].includes(status);
  }

  getDecisionLabel(verdict) {
    return {
      FROZEN: 'BLOCK & FREEZE',
      APPROVED: 'APPROVE & ALLOW',
      NEEDS_VERIFICATION: 'REQUEST STEP-UP 2FA',
      ESCALATED: 'ESCALATE TO SUPERVISOR',
      FALSE_POSITIVE: 'MARK FALSE POSITIVE'
    }[verdict] || verdict;
  }

  getDecisionImpact(verdict) {
    return {
      FROZEN: 'High impact: blocks the transaction and freezes the account.',
      APPROVED: 'High impact: allows the held transaction to proceed.',
      NEEDS_VERIFICATION: 'Customer impact: requests an additional authentication step before release.',
      ESCALATED: 'Workflow impact: transfers decision authority to a supervisor.',
      FALSE_POSITIVE: 'Model impact: closes the alert as benign and sends the case to the tuning loop.'
    }[verdict] || 'Review the consequence before committing this action.';
  }

  normalizeRationaleText(value) {
    return (value || '').trim().replace(/^\[[^\]]+\]\s*/, '').trim();
  }

  validateDecisionRationale({ focus = false } = {}) {
    const noteArea = document.getElementById('analystNoteInput');
    const message = document.getElementById('rationaleValidationMessage');
    const raw = noteArea ? noteArea.value.trim() : '';
    const meaningful = this.normalizeRationaleText(raw);
    const resolved = raw.startsWith('[Resolved]');
    const valid = meaningful.length >= this.decisionMinRationaleLength && !resolved;

    if (message) {
      if (resolved) {
        message.textContent = 'Committed rationale is read-only and preserved in the audit trail.';
        message.className = 'rationale-validation-message';
      } else if (!meaningful) {
        message.textContent = `Rationale required. Explain the evidence and reasoning in at least ${this.decisionMinRationaleLength} characters.`;
        message.className = 'rationale-validation-message is-error';
      } else if (!valid) {
        message.textContent = `${meaningful.length}/${this.decisionMinRationaleLength} rationale characters — add the evidence and reasoning behind the action.`;
        message.className = 'rationale-validation-message is-error';
      } else {
        message.textContent = `Rationale ready: ${meaningful.length} characters of analyst reasoning.`;
        message.className = 'rationale-validation-message is-valid';
      }
    }

    if (!valid && focus && noteArea) noteArea.focus();
    return { valid, raw, meaningful };
  }

  updateRationaleValidation() {
    this.validateDecisionRationale();
  }

  recommendationExpectedVerdict(recommendation) {
    const rec = (recommendation || '').toUpperCase();
    if (rec.includes('BLOCK') || rec.includes('FREEZE')) return 'FROZEN';
    if (rec.includes('ALLOW') || rec.includes('APPROVE')) return 'APPROVED';
    if (rec.includes('VERIFY') || rec.includes('STEP-UP') || rec.includes('2FA')) return 'NEEDS_VERIFICATION';
    if (rec.includes('ESCALATE')) return 'ESCALATED';
    if (rec.includes('FALSE POSITIVE')) return 'FALSE_POSITIVE';
    return null;
  }

  resetDecisionGuard() {
    const panel = document.getElementById('decisionConfirmPanel');
    const ack = document.getElementById('decisionEvidenceAck');
    const confirm = document.getElementById('btnConfirmDecision');
    if (panel) panel.hidden = true;
    const commitError = document.getElementById('decisionCommitError');
    if (commitError) commitError.hidden = true;
    if (confirm) confirm.textContent = 'Commit decision';
    if (ack) ack.checked = false;
    if (confirm) confirm.disabled = true;
    this.pendingDecision = null;
  }

  syncDecisionPanelState(alert) {
    const locked = this.isFinalDecisionStatus(alert.status);
    const status = document.getElementById('decisionSafetyStatus');
    ['btnActionFreeze', 'btnActionApprove', 'btnActionStepUp', 'btnActionEscalate', 'btnActionFalsePositive'].forEach(id => {
      const button = document.getElementById(id);
      if (button) {
        button.disabled = locked;
        button.setAttribute('aria-disabled', String(locked));
      }
    });
    if (status) {
      status.textContent = locked
        ? `Decision committed: ${alert.status.replaceAll('_', ' ')}. Select another pending alert to take a new action.`
        : 'Rationale + evidence-review confirmation required before any decision is committed.';
      status.className = `decision-safety-status ${locked ? 'is-locked' : ''}`;
    }
  }

  cancelPendingDecision(message = '') {
    this.resetDecisionGuard();
    const alert = this.alerts.find(a => a.id === this.activeAlertId);
    if (alert) this.syncDecisionPanelState(alert);
    if (message) this.showToast(message);
  }

  requestDecision(verdict) {
    const alert = this.alerts.find(a => a.id === this.activeAlertId);
    if (!alert) return;
    if (this.isFinalDecisionStatus(alert.status)) {
      this.showToast(`Decision already committed for ${alert.id}. Select another pending alert.`);
      this.syncDecisionPanelState(alert);
      return;
    }

    const validation = this.validateDecisionRationale({ focus: true });
    if (!validation.valid) {
      const noteArea = document.getElementById('analystNoteInput');
      const message = document.getElementById('rationaleValidationMessage');
      if (noteArea) noteArea.setAttribute('aria-invalid', 'true');
      if (message) message.textContent = `Rationale required before ${this.getDecisionLabel(verdict)}. Explain the evidence and reasoning in at least ${this.decisionMinRationaleLength} characters.`;
      this.showToast('Add a meaningful analyst rationale before staging this decision.');
      return;
    }

    const expectedVerdict = this.recommendationExpectedVerdict(alert.riskSpectrum.recommendation);
    const override = Boolean(expectedVerdict && expectedVerdict !== verdict);
    this.pendingDecision = {
      alertId: alert.id,
      verdict,
      rationale: validation.raw,
      selectedTag: this.selectedTag,
      recommendation: alert.riskSpectrum.recommendation,
      override
    };

    const panel = document.getElementById('decisionConfirmPanel');
    const title = document.getElementById('pendingDecisionTitle');
    const impact = document.getElementById('pendingDecisionImpact');
    const ack = document.getElementById('decisionEvidenceAck');
    const confirm = document.getElementById('btnConfirmDecision');
    const status = document.getElementById('decisionSafetyStatus');

    if (title) title.textContent = `Confirm ${this.getDecisionLabel(verdict)}`;
    if (impact) {
      const overrideCopy = override
        ? ` This overrides the model recommendation: ${alert.riskSpectrum.recommendation.replaceAll('_', ' ')}.`
        : ` This is aligned with the current model recommendation: ${alert.riskSpectrum.recommendation.replaceAll('_', ' ')}.`;
      impact.textContent = `${this.getDecisionImpact(verdict)}${overrideCopy}`;
      impact.className = `decision-confirm-impact ${override ? 'is-override' : ''}`;
    }
    if (ack) ack.checked = false;
    if (confirm) confirm.disabled = true;
    if (panel) panel.hidden = false;
    if (status) {
      status.textContent = 'Decision staged — review impact, acknowledge the evidence review, then commit.';
      status.className = 'decision-safety-status is-staged';
    }
  }

  confirmPendingDecision() {
    if (!this.pendingDecision) return;
    const pending = this.pendingDecision;
    const ack = document.getElementById('decisionEvidenceAck');
    const validation = this.validateDecisionRationale({ focus: true });

    if (pending.alertId !== this.activeAlertId) {
      this.cancelPendingDecision('Active alert changed — stage the decision again.');
      return;
    }
    if (!validation.valid || validation.raw !== pending.rationale) {
      this.cancelPendingDecision('Rationale changed — stage the decision again.');
      return;
    }
    if (!ack || !ack.checked) {
      this.showToast('Confirm that you reviewed the alert evidence before committing.');
      return;
    }

    if (this.commitInFlight) return;
    const confirm = document.getElementById('btnConfirmDecision');
    const cancel = document.getElementById('btnCancelDecision');
    const noteArea = document.getElementById('analystNoteInput');
    const errorBox = document.getElementById('decisionCommitError');
    if (errorBox) errorBox.hidden = true;
    this.commitInFlight = true;
    if (confirm) { confirm.disabled = true; confirm.textContent = 'Committing…'; confirm.setAttribute('aria-busy', 'true'); }
    if (cancel) cancel.disabled = true;
    if (noteArea) noteArea.readOnly = true;

    const finish = () => {
      this.commitInFlight = false;
      if (confirm) { confirm.textContent = 'Commit decision'; confirm.removeAttribute('aria-busy'); }
      if (cancel) cancel.disabled = false;
    };
    const request = this.store ? this.store.request('Writing the decision to the audit ledger', null) : Promise.resolve();
    return request.then(() => {
      finish();
      this.executeDecision(pending.verdict, pending.rationale, { ...pending, evidenceReviewAcknowledged: true });
    }).catch(error => {
      finish();
      if (noteArea) noteArea.readOnly = false;
      if (confirm) { confirm.disabled = !(ack && ack.checked); confirm.textContent = 'Retry commit'; }
      if (errorBox) {
        errorBox.textContent = `Audit write failed. ${error.message} Your rationale and acknowledgement are preserved; retry or cancel.`;
        errorBox.hidden = false;
      }
      const status = document.getElementById('decisionSafetyStatus');
      if (status) {
        status.textContent = 'Decision NOT committed. Auto-advance is blocked until the audit write succeeds.';
        status.className = 'decision-safety-status is-error';
      }
    });
  }

  executeDecision(verdict, noteText, context = {}) {
    const alert = this.alerts.find(a => a.id === (context.alertId || this.activeAlertId));
    if (!alert) return false;
    if (this.isFinalDecisionStatus(alert.status)) {
      this.showToast(`Decision already committed for ${alert.id}.`);
      return false;
    }
    if (!context.evidenceReviewAcknowledged) {
      this.showToast('Decision blocked: evidence review acknowledgement is required.');
      return false;
    }

    const meaningful = this.normalizeRationaleText(noteText);
    if (meaningful.length < this.decisionMinRationaleLength) {
      this.showToast('Decision blocked: a meaningful analyst rationale is required.');
      return false;
    }

    alert.status = verdict;
    alert.analystDecision = noteText.trim();
    alert.decisionMeta = {
      classification: context.selectedTag || this.selectedTag || null,
      recommendation: context.recommendation || alert.riskSpectrum.recommendation,
      recommendationOverride: Boolean(context.override),
      evidenceReviewAcknowledged: Boolean(context.evidenceReviewAcknowledged)
    };

    const rationaleParts = [alert.analystDecision];
    if (alert.decisionMeta.classification) rationaleParts.push(`Classification: ${alert.decisionMeta.classification}`);
    if (alert.decisionMeta.recommendationOverride) rationaleParts.push(`Override of recommendation: ${alert.decisionMeta.recommendation}`);

    const newAudit = {
      id: `AUD-${Math.floor(10000 + Math.random() * 90000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      actor: `${SENTRY_DATA.systemMetrics.analyst} (${SENTRY_DATA.systemMetrics.analystRole})`,
      entity: `${alert.id} / ${alert.customer.id}`,
      action: verdict,
      rationale: rationaleParts.join('; '),
      verdict: verdict === 'FROZEN' ? 'CONFIRMED_FRAUD' : (verdict === 'APPROVED' ? 'ALLOWED_CLEAN' : verdict),
      riskScoreAfter: alert.riskSpectrum.totalScore
    };

    if (this.store) newAudit.id = this.store.nextId('audit', 'AUD-');
    this.auditLog.unshift(newAudit);
    if (this.store) {
      this.store.save();
      document.dispatchEvent(new CustomEvent('sentry:store', { detail: { label: 'decision' } }));
    }
    this.resetDecisionGuard();
    this.showToast(`Case ${alert.id} resolved: ${verdict} recorded with analyst rationale.`);

    this.renderAlertQueue();
    this.renderActiveAlert();
    this.renderAuditLog();
    this.updateHeaderCounters();

    const nextAlert = this.alerts.find(a => a.status === 'HIGH_RISK' || a.status === 'RULE_CONFLICT' || a.status === 'NEEDS_VERIFICATION');
    if (nextAlert && nextAlert.id !== alert.id) {
      setTimeout(() => {
        this.activeAlertId = nextAlert.id;
        this.renderAlertQueue();
        this.renderActiveAlert();
        this.syncRoute({ replace: true });
      }, 400);
    }
    return true;
  }

  renderRulesEngine() {
    const container = document.getElementById('rulesListContainer');
    if (!container) return;

    container.innerHTML = '';
    (this.store ? this.store.state.rules : SENTRY_DATA.rulesInventory).forEach(rule => {
      const card = document.createElement('div');
      card.className = `inventory-rule-card ${rule.hasConflictNotice ? 'has-conflict' : ''}`;
      card.innerHTML = `
        <div class="rule-card-header">
          <div>
            <div class="rule-card-id mono">${rule.id}</div>
            <div class="rule-card-name">${rule.name}</div>
          </div>
          <span class="badge-status badge-clean">${rule.status}</span>
        </div>
        <div class="rule-card-category mono">${rule.category}</div>
        <div class="rule-card-logic mono">${rule.logic}</div>
        <div class="rule-card-footer">
          <div>Triggered 24h: <strong class="mono">${rule.triggered24h}</strong> | False Positives: <strong class="mono">${rule.falsePositiveRate}</strong></div>
          <div class="mono text-muted">Author: ${rule.author}</div>
        </div>
        ${rule.hasConflictNotice ? `<div class="rule-conflict-tag">${window.SentryIcons ? window.SentryIcons.alertTriangle : ''} ${rule.hasConflictNotice}</div>` : ''}
      `;
      container.appendChild(card);
    });
  }

  renderAuditLog() {
    const tbody = document.getElementById('auditLogTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    this.auditLog.forEach(log => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="mono-cell">${log.id}</td>
        <td class="mono-cell">${log.timestamp}</td>
        <td class="bold">${log.actor}</td>
        <td class="mono-cell">${log.entity}</td>
        <td><span class="badge-action action-${log.action.toLowerCase()}">${log.action}</span></td>
        <td class="rationale-cell">${log.rationale}</td>
        <td><span class="badge-verdict ${log.verdict.includes('FRAUD') ? 'verdict-danger' : 'verdict-clean'}">${log.verdict}</span></td>
      `;
      tbody.appendChild(tr);
    });
  }

  renderAnalytics() {
    const container = document.getElementById('analyticsMetrics');
    if (!container) return;

    // P0-B evidence boundary: these cards describe what the product would measure.
    // They must not present simulated scenario values as validated product outcomes
    // until compatible post-change DIRECT_USER / PROXY or operational evidence exists.
    container.innerHTML = `
      <div class="analytics-stat-card">
        <div class="analytics-lbl">EVIDENCE STATUS</div>
        <div class="analytics-val mono text-warning">NOT MEASURED</div>
        <div class="analytics-sub mono">0 verified DIRECT_USER, 0 verified PROXY sessions</div>
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
        <div class="analytics-sub mono">Synthetic dataset for prototype stress testing, not production telemetry</div>
      </div>
    `;
  }

  renderCustomers() {
    const tbody = document.getElementById('customersTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    this.alerts.forEach(a => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="mono-cell">${a.customer.id}</td>
        <td class="bold">${a.customer.name}</td>
        <td class="mono-cell">${a.customer.email}</td>
        <td class="mono-cell">${a.customer.trustTier}</td>
        <td class="mono-cell">${a.customer.accountAge}</td>
        <td class="mono-cell">${a.customer.lifetimeVolume}</td>
        <td><span class="badge-tag ${a.customer.priorDisputes > 0 ? 'tag-warning' : 'tag-clean'}">${a.customer.priorDisputes} Disputes</span></td>
        <td><button class="btn-inspect-cust" data-alert="${a.id}">VIEW EVIDENCE</button></td>
      `;

      tr.querySelector('.btn-inspect-cust').addEventListener('click', () => this.navigate('queue', a.id));

      tbody.appendChild(tr);
    });
  }

  updateHeaderCounters() {
    const openBadge = document.getElementById('kpiOpenAlerts');
    if (openBadge) {
      const activePending = this.alerts.filter(a => a.status === 'HIGH_RISK' || a.status === 'RULE_CONFLICT' || a.status === 'NEEDS_VERIFICATION').length;
      openBadge.textContent = `${activePending} Pending Reviews`;
    }
  }

  showToast(msg) {
    let toast = document.getElementById('sentryToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'sentryToast';
      toast.className = 'sentry-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.sentryConsole = new SentryFraudConsole();
});