// SENTRY // Fraud & Risk Operations Console — Interaction Engine
// Forensic / Dense / Controlled / High-Stakes Decision Workspace

class SentryFraudConsole {
  constructor() {
    this.currentView = 'queue';
    this.activeAlertId = 'ALT-8921';
    this.currentFilter = 'ALL';
    this.searchTerm = '';
    this.selectedTag = '';
    this.alerts = JSON.parse(JSON.stringify(SENTRY_DATA.alerts));
    this.auditLog = JSON.parse(JSON.stringify(SENTRY_DATA.auditLog));

    this.init();
  }

  init() {
    this.bindNavigation();
    this.bindFilters();
    this.bindSearch();
    this.bindDecisionPanel();
    this.bindThemeToggle();
    this.renderAlertQueue();
    this.renderActiveAlert();
    this.renderRulesEngine();
    this.renderAuditLog();
    this.renderAnalytics();
    this.renderCustomers();
    this.updateHeaderCounters();
  }

  bindNavigation() {
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const view = tab.getAttribute('data-view');
        this.switchView(view);
      });
    });

    // Keyboard shortcuts for fraud analysts: [1]-[6]
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === '1') this.switchView('queue');
      else if (e.key === '2') this.switchView('cases');
      else if (e.key === '3') this.switchView('rules');
      else if (e.key === '4') this.switchView('customers');
      else if (e.key === '5') this.switchView('analytics');
      else if (e.key === '6') this.switchView('audit');
      // Tactical Decision hotkeys:
      else if (e.key === 'b' || e.key === 'B') this.executeDecision('FROZEN', 'Account Blocked & Frozen by Analyst');
      else if (e.key === 'a' || e.key === 'A') this.executeDecision('APPROVED', 'Transaction Approved by Analyst');
      else if (e.key === 'v' || e.key === 'V') this.executeDecision('NEEDS_VERIFICATION', 'Step-up 2FA/Biometric Challenge Issued');
    });
  }

  switchView(viewId) {
    this.currentView = viewId;

    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.classList.toggle('active', tab.getAttribute('data-view') === viewId);
    });

    document.querySelectorAll('.console-view').forEach(view => {
      view.classList.toggle('active', view.id === `view-${viewId}`);
    });
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
    // Rationale tag buttons
    document.querySelectorAll('.tag-btn').forEach(tag => {
      tag.addEventListener('click', () => {
        document.querySelectorAll('.tag-btn').forEach(t => t.classList.remove('active'));
        tag.classList.add('active');
        this.selectedTag = tag.getAttribute('data-tag');
        
        const noteArea = document.getElementById('analystNoteInput');
        if (noteArea && !noteArea.value.includes(`[${this.selectedTag}]`)) {
          noteArea.value = `[${this.selectedTag}] ` + noteArea.value;
        }
      });
    });

    // Decision action buttons
    const btnFreeze = document.getElementById('btnActionFreeze');
    const btnApprove = document.getElementById('btnActionApprove');
    const btnStepUp = document.getElementById('btnActionStepUp');
    const btnEscalate = document.getElementById('btnActionEscalate');
    const btnFalsePositive = document.getElementById('btnActionFalsePositive');

    if (btnFreeze) {
      btnFreeze.addEventListener('click', () => this.executeDecision('FROZEN', 'Account Frozen & Outbound Rail Air-Gapped'));
    }
    if (btnApprove) {
      btnApprove.addEventListener('click', () => this.executeDecision('APPROVED', 'Approved & Allowed to Settle'));
    }
    if (btnStepUp) {
      btnStepUp.addEventListener('click', () => this.executeDecision('NEEDS_VERIFICATION', 'Out-of-band Step-up Verification Dispatched'));
    }
    if (btnEscalate) {
      btnEscalate.addEventListener('click', () => this.executeDecision('ESCALATED', 'Escalated to Risk Supervisor for Sign-off'));
    }
    if (btnFalsePositive) {
      btnFalsePositive.addEventListener('click', () => this.executeDecision('FALSE_POSITIVE', 'Marked False Positive & Sent to Model Tuning Loop'));
    }
  }

  bindThemeToggle() {
    const toggleBtn = document.getElementById('btnThemeToggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark-theme');
        toggleBtn.innerHTML = isDark 
          ? `<span class="icon">🌙</span> Dark Terminal` 
          : `<span class="icon">☀️</span> Clinical Light`;
      });
    }
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

    if (filtered.length === 0) {
      container.innerHTML = `<div class="queue-empty">No alerts matching current filter.</div>`;
      return;
    }

    filtered.forEach(alert => {
      const card = document.createElement('div');
      const isSelected = alert.id === this.activeAlertId;
      card.className = `queue-alert-card status-${alert.status.toLowerCase()} ${isSelected ? 'active' : ''}`;
      
      let statusBadge = '';
      if (alert.status === 'HIGH_RISK') {
        statusBadge = `<span class="badge-status badge-danger">RISK ${alert.riskSpectrum.totalScore}</span>`;
      } else if (alert.ruleConflict) {
        statusBadge = `<span class="badge-status badge-conflict">RULE CONFLICT</span>`;
      } else if (alert.status === 'NEEDS_VERIFICATION') {
        statusBadge = `<span class="badge-status badge-warning">VERIFY</span>`;
      } else if (alert.status === 'FROZEN') {
        statusBadge = `<span class="badge-status badge-frozen">FROZEN</span>`;
      } else if (alert.status === 'APPROVED' || alert.status === 'RESOLVED') {
        statusBadge = `<span class="badge-status badge-clean">RESOLVED</span>`;
      } else {
        statusBadge = `<span class="badge-status badge-neutral">${alert.status}</span>`;
      }

      card.innerHTML = `
        <div class="alert-card-top">
          <span class="alert-card-id mono">${alert.id}</span>
          ${statusBadge}
        </div>
        <div class="alert-card-cust">${alert.customer.name}</div>
        <div class="alert-card-amt mono">${alert.transaction.amountFormatted}</div>
        <div class="alert-card-merchant">${alert.transaction.merchant}</div>
        <div class="alert-card-bottom">
          <span class="alert-card-rule mono">${alert.triggeredRules[0] ? alert.triggeredRules[0].name : 'BASELINE'}</span>
          <span class="alert-card-time mono">${alert.transaction.timestamp.split('(')[1].replace(')', '')}</span>
        </div>
      `;

      card.addEventListener('click', () => {
        this.activeAlertId = alert.id;
        this.renderAlertQueue();
        this.renderActiveAlert();
      });

      container.appendChild(card);
    });

    // Update queue count pill
    const countEl = document.getElementById('queueCountBadge');
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
      custInfoEl.innerHTML = `<span class="bold text-white">${alert.customer.name}</span> <span class="text-muted">(${alert.customer.id})</span> · <span class="badge-tag tag-clean">${alert.customer.trustTier}</span> · Age: ${alert.customer.accountAge} · Vol: ${alert.customer.lifetimeVolume}`;
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
        canvasSub.textContent = '⚠️ Canvas Hash Spoof Detected';
        canvasSub.className = 'dissect-sub mono text-danger';
      }
      if (hwBox) hwBox.className = 'dissect-box highlight-danger';
    } else {
      if (canvasEl) canvasEl.innerHTML = `<span class="badge-tag tag-clean">AUTHENTIC</span> ${alert.device.actualHardware || 'Hardware Verified'}`;
      if (canvasSub) {
        canvasSub.textContent = '✓ Authentic Hardware Signature';
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
    
    // Clear previous note input
    const noteArea = document.getElementById('analystNoteInput');
    if (noteArea) {
      noteArea.value = alert.analystDecision ? `[Resolved] ${alert.analystDecision}` : '';
    }
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
      const color = seg.color || '#EF4444';
      pill.innerHTML = `
        <span class="spectrum-cat"><span class="spectrum-dot" style="background-color: ${color};"></span>${label}</span>
        <span class="spectrum-pts mono bold" style="color: ${color};">${score >= 0 ? '+' : ''}${score}</span>
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
      conflictBanner.innerHTML = `
        <div class="conflict-title">⚠️ SYSTEM RULE CONFLICT DETECTED</div>
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

  executeDecision(verdict, defaultNote) {
    const alert = this.alerts.find(a => a.id === this.activeAlertId);
    if (!alert) return;

    const noteInput = document.getElementById('analystNoteInput');
    const noteText = (noteInput && noteInput.value.trim()) ? noteInput.value.trim() : defaultNote;

    alert.status = verdict;
    alert.analystDecision = noteText;

    // Log in Audit Trail
    const newAudit = {
      id: `AUD-${Math.floor(10000 + Math.random() * 90000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      actor: `${SENTRY_DATA.systemMetrics.analyst} (${SENTRY_DATA.systemMetrics.analystRole})`,
      entity: `${alert.id} / ${alert.customer.id}`,
      action: verdict,
      rationale: noteText,
      verdict: verdict === 'FROZEN' ? 'CONFIRMED_FRAUD' : (verdict === 'APPROVED' ? 'ALLOWED_CLEAN' : verdict),
      riskScoreAfter: alert.riskSpectrum.totalScore
    };

    this.auditLog.unshift(newAudit);

    this.showToast(`Case ${alert.id} resolved: ${verdict} recorded in immutable audit log.`);

    this.renderAlertQueue();
    this.renderActiveAlert();
    this.renderAuditLog();
    this.updateHeaderCounters();

    // Auto advance to next pending high-risk alert
    const nextAlert = this.alerts.find(a => a.status === 'HIGH_RISK' || a.status === 'RULE_CONFLICT' || a.status === 'NEEDS_VERIFICATION');
    if (nextAlert && nextAlert.id !== alert.id) {
      setTimeout(() => {
        this.activeAlertId = nextAlert.id;
        this.renderAlertQueue();
        this.renderActiveAlert();
      }, 400);
    }
  }

  renderRulesEngine() {
    const container = document.getElementById('rulesListContainer');
    if (!container) return;

    container.innerHTML = '';
    SENTRY_DATA.rulesInventory.forEach(rule => {
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
        ${rule.hasConflictNotice ? `<div class="rule-conflict-tag">⚠️ ${rule.hasConflictNotice}</div>` : ''}
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

    container.innerHTML = `
      <div class="analytics-stat-card">
        <div class="analytics-lbl">FRAUD LOSSES PREVENTED (30D)</div>
        <div class="analytics-val mono text-clean">$1,842,900 USD</div>
        <div class="analytics-sub mono">99.4% precision on high-confidence blocks</div>
      </div>
      <div class="analytics-stat-card">
        <div class="analytics-lbl">FALSE POSITIVE RATE</div>
        <div class="analytics-val mono">${SENTRY_DATA.systemMetrics.falsePositiveRate}</div>
        <div class="analytics-sub mono">Benchmark target < 3.0%</div>
      </div>
      <div class="analytics-stat-card">
        <div class="analytics-lbl">MEAN TIME TO DECIDE (MTTD)</div>
        <div class="analytics-val mono">${SENTRY_DATA.systemMetrics.mttrMinutes} min</div>
        <div class="analytics-sub mono">Reduced from 18.2 min via Split Workspace</div>
      </div>
      <div class="analytics-stat-card">
        <div class="analytics-lbl">RULE CONFLICT INCIDENCE</div>
        <div class="analytics-val mono text-warning">1.4%</div>
        <div class="analytics-sub mono">2 rules pending supervisor de-duplication</div>
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

      tr.querySelector('.btn-inspect-cust').addEventListener('click', () => {
        this.activeAlertId = a.id;
        this.switchView('queue');
        this.renderAlertQueue();
        this.renderActiveAlert();
      });

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
