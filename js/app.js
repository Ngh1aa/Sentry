// SENTRY // Main Application Controller & Interaction Logic
// Portfolio-grade interaction fidelity, real-time telemetry, and incident response

class SentryApp {
  constructor() {
    this.currentTab = 'warroom';
    this.radar = null;
    this.selectedIncident = null;
    this.activeRole = 'Commander L4';
    this.severityFilter = 'ALL';
    this.searchTerm = '';
    this.isAttackActive = false;

    this.init();
  }

  init() {
    this.initRadar();
    this.renderKPIs();
    this.renderIncidentFeed();
    this.renderSparkline();
    this.renderThreatMatrix();
    this.renderFleetNodes();
    this.renderPolicies();
    this.renderForensics();
    this.bindEvents();
    this.startLiveTelemetryPulse();
  }

  initRadar() {
    if (window.SentryRadar) {
      this.radar = new SentryRadar('radarCanvas', 'radarContainer');
    }
  }

  bindEvents() {
    // Navigation tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const targetView = tab.getAttribute('data-view');
        this.switchView(targetView);
        if (window.sentryAudio) window.sentryAudio.playTacticalClick();
      });
    });

    // Simulate attack button
    const simBtn = document.getElementById('btnSimulateAttack');
    if (simBtn) {
      simBtn.addEventListener('click', () => this.triggerAttackSimulation());
    }

    // Audio toggle button
    const audioBtn = document.getElementById('btnAudioToggle');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        const isEnabled = window.sentryAudio.toggle();
        audioBtn.innerHTML = isEnabled 
          ? `<span class="icon">🔊</span> SFX: ON <span class="tab-key">M</span>` 
          : `<span class="icon">🔇</span> SFX: OFF <span class="tab-key">M</span>`;
        audioBtn.classList.toggle('active', isEnabled);
      });
    }

    // Emergency banner air-gap button
    const airgapBtn = document.getElementById('btnEmergencyAirgap');
    if (airgapBtn) {
      airgapBtn.addEventListener('click', () => this.neutralizeAttack());
    }

    // Drawer close buttons
    const closeDrawerBtn = document.getElementById('btnCloseDrawer');
    const drawerBackdrop = document.getElementById('drawerBackdrop');
    if (closeDrawerBtn) {
      closeDrawerBtn.addEventListener('click', () => this.closeIncidentDrawer());
    }
    if (drawerBackdrop) {
      drawerBackdrop.addEventListener('click', () => this.closeIncidentDrawer());
    }

    // Threat matrix search and filters
    const searchInput = document.getElementById('threatSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchTerm = e.target.value.toLowerCase();
        this.renderThreatMatrix();
      });
    }

    document.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.severityFilter = chip.getAttribute('data-severity');
        this.renderThreatMatrix();
        if (window.sentryAudio) window.sentryAudio.playTacticalClick();
      });
    });

    // Role switcher
    const roleSelect = document.getElementById('roleSelector');
    if (roleSelect) {
      roleSelect.addEventListener('change', (e) => {
        this.activeRole = e.target.value;
        this.showToast(`Active Persona switched to: ${this.activeRole}`);
        if (window.sentryAudio) window.sentryAudio.playTacticalClick();
      });
    }

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === '1') this.switchView('warroom');
      else if (e.key === '2') this.switchView('threats');
      else if (e.key === '3') this.switchView('fleet');
      else if (e.key === '4') this.switchView('policies');
      else if (e.key === '5') this.switchView('forensics');
      else if (e.key === 's' || e.key === 'S') this.triggerAttackSimulation();
      else if (e.key === 'a' || e.key === 'A') {
        if (this.isAttackActive) this.neutralizeAttack();
      }
      else if (e.key === 'm' || e.key === 'M') {
        if (audioBtn) audioBtn.click();
      }
      else if (e.key === 'Escape') this.closeIncidentDrawer();
    });
  }

  switchView(viewId) {
    this.currentTab = viewId;

    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.classList.toggle('active', tab.getAttribute('data-view') === viewId);
    });

    document.querySelectorAll('.app-view').forEach(view => {
      view.classList.toggle('active', view.id === `view-${viewId}`);
    });

    if (viewId === 'warroom' && this.radar) {
      setTimeout(() => this.radar.resize(), 50);
    }
  }

  renderKPIs() {
    const s = SENTRY_DATA.systemStatus;
    const defconBadge = document.getElementById('kpiDefcon');
    if (defconBadge) {
      defconBadge.textContent = s.defconLabel;
      defconBadge.className = `status-pill defcon-${s.defcon}`;
    }

    const blockedEl = document.getElementById('kpiBlocked');
    if (blockedEl) blockedEl.textContent = s.blockedThreats24h.toLocaleString();

    const ingressEl = document.getElementById('kpiIngress');
    if (ingressEl) ingressEl.textContent = s.ingressThroughput;

    const latencyEl = document.getElementById('kpiLatency');
    if (latencyEl) latencyEl.textContent = `${s.avgP99Latency} ${s.p99Unit}`;

    const nodesEl = document.getElementById('kpiNodes');
    if (nodesEl) nodesEl.textContent = `${s.globalNodesActive}/${s.globalNodesTotal} NODES`;
  }

  renderSparkline() {
    const svg = document.getElementById('telemetrySparkline');
    if (!svg) return;

    const data = SENTRY_DATA.telemetryHistory.latencyP99;
    const width = 280;
    const height = 48;
    const padding = 4;

    const min = Math.min(...data) - 1;
    const max = Math.max(...data) + 1;

    const points = data.map((val, idx) => {
      const x = padding + (idx / (data.length - 1)) * (width - padding * 2);
      const y = height - padding - ((val - min) / (max - min)) * (height - padding * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');

    svg.innerHTML = `
      <polyline points="${points}" fill="none" stroke="#00f0ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      <circle cx="${points.split(' ').slice(-1)[0].split(',')[0]}" cy="${points.split(' ').slice(-1)[0].split(',')[1]}" r="3" fill="#00ff9d" />
    `;
  }

  renderIncidentFeed() {
    const container = document.getElementById('incidentFeedContainer');
    if (!container) return;

    container.innerHTML = '';
    SENTRY_DATA.incidents.forEach(inc => {
      const card = document.createElement('div');
      card.className = `incident-card sev-${inc.severity.toLowerCase()}`;
      card.innerHTML = `
        <div class="incident-header">
          <span class="badge-severity ${inc.severity.toLowerCase()}">${inc.severity}</span>
          <span class="incident-id">${inc.id}</span>
          <span class="incident-time">${inc.timestamp}</span>
        </div>
        <div class="incident-title">${inc.title}</div>
        <div class="incident-meta">
          <span><strong class="meta-label">TARGET:</strong> ${inc.target}</span>
          <span><strong class="meta-label">VECTOR:</strong> ${inc.vector}</span>
          <span><strong class="meta-label">SOURCE:</strong> ${inc.sourceIp} (${inc.geo})</span>
        </div>
        <div class="incident-footer">
          <span class="incident-status status-${inc.status.toLowerCase()}">● ${inc.status}</span>
          <button class="btn-inspect" data-incident-id="${inc.id}">INSPECT TRACE →</button>
        </div>
      `;

      card.querySelector('.btn-inspect').addEventListener('click', () => {
        this.openIncidentDrawer(inc);
      });

      container.appendChild(card);
    });
  }

  renderThreatMatrix() {
    const tbody = document.getElementById('threatMatrixBody');
    if (!tbody) return;

    let filtered = SENTRY_DATA.incidents.filter(inc => {
      const matchesSev = this.severityFilter === 'ALL' || inc.severity === this.severityFilter;
      const matchesSearch = !this.searchTerm || 
        inc.title.toLowerCase().includes(this.searchTerm) ||
        inc.id.toLowerCase().includes(this.searchTerm) ||
        inc.target.toLowerCase().includes(this.searchTerm) ||
        inc.sourceIp.toLowerCase().includes(this.searchTerm);
      return matchesSev && matchesSearch;
    });

    tbody.innerHTML = '';
    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="empty-state">No matching threat vectors detected in current telemetry snapshot.</td></tr>`;
      return;
    }

    filtered.forEach(inc => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong class="mono-id">${inc.id}</strong></td>
        <td><span class="badge-severity ${inc.severity.toLowerCase()}">${inc.severity}</span></td>
        <td>
          <div class="table-threat-title">${inc.title}</div>
          <div class="table-threat-vector">${inc.vector}</div>
        </td>
        <td class="mono-cell">${inc.target}</td>
        <td class="mono-cell">${inc.sourceIp}<br><span class="muted-sub">${inc.geo}</span></td>
        <td><span class="incident-status status-${inc.status.toLowerCase()}">● ${inc.status}</span></td>
        <td>
          <button class="btn-table-action" data-incident-id="${inc.id}">DEEP AUDIT</button>
        </td>
      `;

      tr.querySelector('.btn-table-action').addEventListener('click', () => {
        this.openIncidentDrawer(inc);
      });

      tbody.appendChild(tr);
    });
  }

  renderFleetNodes() {
    const grid = document.getElementById('fleetNodesGrid');
    if (!grid) return;

    grid.innerHTML = '';
    SENTRY_DATA.nodes.forEach(node => {
      const card = document.createElement('div');
      card.className = `node-card ${node.status === 'AIR_GAPPED' ? 'node-airgapped' : ''}`;
      card.innerHTML = `
        <div class="node-card-header">
          <div>
            <div class="node-name">${node.name}</div>
            <div class="node-region">${node.region} // ${node.ipRange}</div>
          </div>
          <span class="node-status-pill status-${node.status.toLowerCase()}">${node.status}</span>
        </div>

        <div class="node-metrics-grid">
          <div class="metric-box">
            <span class="metric-label">RTT PING</span>
            <span class="metric-val mono">${node.ping} ms</span>
          </div>
          <div class="metric-box">
            <span class="metric-label">INGRESS</span>
            <span class="metric-val mono">${node.ingress}</span>
          </div>
          <div class="metric-box">
            <span class="metric-label">THROUGHPUT</span>
            <span class="metric-val mono">${node.rps}</span>
          </div>
          <div class="metric-box">
            <span class="metric-label">SHIELD HEALTH</span>
            <span class="metric-val mono accent-green">${node.shieldIntegrity}%</span>
          </div>
        </div>

        <div class="progress-bar-group">
          <div class="progress-label-row">
            <span>CPU UTILIZATION</span>
            <span>${node.cpu}%</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill ${node.cpu > 70 ? 'fill-warn' : ''}" style="width: ${node.cpu}%"></div>
          </div>
        </div>

        <div class="progress-bar-group">
          <div class="progress-label-row">
            <span>MEMORY SATURATION</span>
            <span>${node.mem}%</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill ${node.mem > 70 ? 'fill-warn' : ''}" style="width: ${node.mem}%"></div>
          </div>
        </div>

        <div class="node-card-actions">
          <button class="btn-node-action btn-ping" data-node="${node.id}">TRACE PING</button>
          <button class="btn-node-action btn-isolate" data-node="${node.id}">
            ${node.status === 'AIR_GAPPED' ? 'RECONNECT' : 'ISOLATE'}
          </button>
        </div>
      `;

      card.querySelector('.btn-ping').addEventListener('click', () => {
        this.showToast(`Ping sent to ${node.name}: Round-trip 9.2ms (Zero packet loss).`);
        if (window.sentryAudio) window.sentryAudio.playRadarPing();
      });

      card.querySelector('.btn-isolate').addEventListener('click', (e) => {
        if (node.status === 'AIR_GAPPED') {
          node.status = 'OPTIMAL';
          this.showToast(`${node.name} reconnected to global Sentinel mesh.`);
        } else {
          node.status = 'AIR_GAPPED';
          this.showToast(`WARNING: ${node.name} air-gapped from network egress.`);
        }
        this.renderFleetNodes();
        if (window.sentryAudio) window.sentryAudio.playTacticalClick();
      });

      grid.appendChild(card);
    });
  }

  renderPolicies() {
    const container = document.getElementById('policiesList');
    if (!container) return;

    container.innerHTML = '';
    SENTRY_DATA.autonomousPolicies.forEach(pol => {
      const card = document.createElement('div');
      card.className = 'policy-card';
      card.innerHTML = `
        <div class="policy-header">
          <div class="policy-title-group">
            <span class="policy-id mono">${pol.id}</span>
            <h3 class="policy-name">${pol.name}</h3>
            <span class="policy-category-badge">${pol.category}</span>
          </div>
          <span class="policy-enforcer-badge">AUTOPILOT ENFORCED</span>
        </div>

        <div class="policy-flow-diagram">
          <div class="flow-step trigger-step">
            <div class="step-label">NEURAL TRIGGER CONDITION</div>
            <div class="step-content mono">${pol.trigger}</div>
          </div>
          <div class="flow-arrow">→</div>
          <div class="flow-step action-step">
            <div class="step-label">AUTONOMOUS MITIGATION ACTION</div>
            <div class="step-content mono">${pol.action}</div>
          </div>
        </div>

        <div class="policy-footer">
          <div class="policy-stat">
            <span class="stat-lbl">APPLIED INCIDENTS:</span>
            <span class="stat-num mono">${pol.appliedCount.toLocaleString()}</span>
          </div>
          <div class="policy-stat">
            <span class="stat-lbl">NEURAL CONFIDENCE:</span>
            <span class="stat-num mono accent-cyan">${pol.confidenceScore}%</span>
          </div>
          <div class="policy-stat">
            <span class="stat-lbl">ORIGIN:</span>
            <span class="stat-num">${pol.author}</span>
          </div>
          <button class="btn-edit-policy" data-pol="${pol.id}">EDIT LOGIC</button>
        </div>
      `;

      card.querySelector('.btn-edit-policy').addEventListener('click', () => {
        this.showToast(`Rule configuration for ${pol.id} is managed by L4 Neural Autopilot.`);
      });

      container.appendChild(card);
    });
  }

  renderForensics() {
    const tbody = document.getElementById('forensicsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    SENTRY_DATA.forensicsAuditLedger.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="mono-cell">${item.id}</td>
        <td class="mono-cell">${item.timestamp}</td>
        <td><span class="event-type-badge">${item.eventType}</span></td>
        <td class="mono-cell">${item.actor}</td>
        <td class="mono-cell">${item.targetEntity}</td>
        <td class="mono-cell proof-cell" title="Click to verify cryptographic zero-knowledge proof">
          <code>${item.sha256Proof}</code>
        </td>
        <td><span class="badge-verdict ${item.verdict.includes('PASSED') || item.verdict.includes('SUCCESS') || item.verdict.includes('VALID') ? 'verdict-clean' : 'verdict-action'}">${item.verdict}</span></td>
      `;

      tr.querySelector('.proof-cell').addEventListener('click', () => {
        this.showToast(`Cryptographic Zero-Knowledge proof verified for ${item.id}. Valid merkle anchor on block #194,821.`);
      });

      tbody.appendChild(tr);
    });
  }

  openIncidentDrawer(inc) {
    this.selectedIncident = inc;
    const drawer = document.getElementById('incidentDrawer');
    const backdrop = document.getElementById('drawerBackdrop');
    if (!drawer) return;

    document.getElementById('drawerIncidentId').textContent = inc.id;
    document.getElementById('drawerSeverity').textContent = inc.severity;
    document.getElementById('drawerSeverity').className = `badge-severity ${inc.severity.toLowerCase()}`;
    document.getElementById('drawerTitle').textContent = inc.title;
    document.getElementById('drawerTarget').textContent = inc.target;
    document.getElementById('drawerVector').textContent = inc.vector;
    document.getElementById('drawerSource').textContent = `${inc.sourceIp} (${inc.geo}) - ${inc.asn}`;
    document.getElementById('drawerAiRemediation').textContent = inc.aiRemediation;

    const traceContainer = document.getElementById('drawerTraceWaterfall');
    if (traceContainer) {
      traceContainer.innerHTML = '';
      inc.trace.forEach((span, idx) => {
        const item = document.createElement('div');
        item.className = 'trace-waterfall-row';
        item.innerHTML = `
          <div class="trace-span-name mono">
            <span class="span-index">0${idx+1}.</span> ${span.span}
          </div>
          <div class="trace-duration mono">${span.duration}</div>
          <div class="trace-status-pill status-${span.status.toLowerCase()}">${span.status} [${span.code}]</div>
          ${span.flag ? `<div class="trace-flag-alert mono">⚠️ ${span.flag}</div>` : ''}
        `;
        traceContainer.appendChild(item);
      });
    }

    const payloadEl = document.getElementById('drawerRawPayload');
    if (payloadEl) {
      payloadEl.textContent = inc.payloadSample;
    }

    drawer.classList.add('open');
    if (backdrop) backdrop.classList.add('open');
    if (window.sentryAudio) window.sentryAudio.playTacticalClick();
  }

  closeIncidentDrawer() {
    const drawer = document.getElementById('incidentDrawer');
    const backdrop = document.getElementById('drawerBackdrop');
    if (drawer) drawer.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
    this.selectedIncident = null;
  }

  onSelectNode(node) {
    this.showToast(`Active Radar Focus: ${node.name} (Ping: ${node.ping}ms | Shield: ${node.shieldIntegrity}%)`);
  }

  triggerAttackSimulation() {
    if (this.isAttackActive) return;
    this.isAttackActive = true;

    if (this.radar) {
      this.radar.triggerAttackSimulation();
    }

    const banner = document.getElementById('emergencyAlertBanner');
    if (banner) banner.classList.add('active');

    const defconBadge = document.getElementById('kpiDefcon');
    if (defconBadge) {
      defconBadge.textContent = 'DEFCON 2 // CRITICAL ELEVATED THREAT';
      defconBadge.className = 'status-pill defcon-2 active-alert';
    }

    const simulatedInc = {
      id: `INC-${Math.floor(1000 + Math.random() * 9000)}`,
      title: "Active Multi-Vector Adversarial Neural Exploit & Edge Ingress Saturation",
      target: "neural-vault-04.iad-09",
      severity: "CRITICAL",
      severityScore: 9.9,
      vector: "Distributed Layer 7 Zero-Day & Model Weight Exfiltration",
      sourceIp: "198.51.100.99 (Inbound Swarm)",
      geo: "Global Proxy Mesh",
      asn: "AS-DEFCON-ROGUE",
      status: "ACTIVE_CONTAINMENT",
      timestamp: "Just now",
      aiRemediation: "Sentinel autonomous air-gap standing by for commander trigger.",
      trace: [
        { span: "edge-ingress-mesh", duration: "0.8ms", status: "SATURATED", code: 503, flag: "Volumetric Spike" },
        { span: "auth-sentinel-vault", duration: "1.2ms", status: "BREACH_ATTEMPT", code: 401 },
        { span: "neural-vault-04", duration: "112ms", status: "UNDER_ATTACK", code: 500, flag: "Target Pod" }
      ],
      payloadSample: "SIMULATED_EXPLOIT: [0xDEADBEEF] BUFFER_OVERRUN_IN_LLM_WEIGHTS_TENSOR"
    };

    SENTRY_DATA.incidents.unshift(simulatedInc);
    this.renderIncidentFeed();
    this.renderThreatMatrix();

    this.showToast("⚠️ DEFCON 2: Inbound cyber assault detected! Sentinel defense active.");
  }

  neutralizeAttack() {
    if (!this.isAttackActive) return;

    const terminalLog = document.getElementById('emergencyLog');
    const airgapBtn = document.getElementById('btnEmergencyAirgap');
    if (airgapBtn) airgapBtn.disabled = true;

    if (terminalLog) {
      terminalLog.innerHTML = `<span class="mono">> Engaging SENTRY Autonomous eBPF Filter...</span>`;
      
      setTimeout(() => {
        terminalLog.innerHTML += `<br><span class="mono">> Pod neural-vault-04 isolated into air-gapped quarantine enclosure...</span>`;
      }, 350);

      setTimeout(() => {
        terminalLog.innerHTML += `<br><span class="mono">> Ingress swarm blacklisted. Dropped 8.4M malicious packets at NIC ring buffer.</span>`;
      }, 700);

      setTimeout(() => {
        terminalLog.innerHTML += `<br><span class="mono accent-green">> THREAT COMPLETELY NEUTRALIZED. FLEET INTEGRITY VERIFIED (100%).</span>`;
        
        if (this.radar) {
          this.radar.neutralizeSimulation();
        }

        SENTRY_DATA.systemStatus.blockedThreats24h += 14280;
        this.renderKPIs();

        if (SENTRY_DATA.incidents[0]) {
          SENTRY_DATA.incidents[0].status = 'NEUTRALIZED';
          this.renderIncidentFeed();
          this.renderThreatMatrix();
        }

        setTimeout(() => {
          this.isAttackActive = false;
          if (airgapBtn) airgapBtn.disabled = false;
          const banner = document.getElementById('emergencyAlertBanner');
          if (banner) banner.classList.remove('active');

          const defconBadge = document.getElementById('kpiDefcon');
          if (defconBadge) {
            defconBadge.textContent = 'DEFCON 5 // OPTIMAL SHIELD';
            defconBadge.className = 'status-pill defcon-5';
          }
          this.showToast("Defense Autopilot: All systems normalized. Defcon 5 restored.");
        }, 1200);

      }, 1050);
    }
  }

  startLiveTelemetryPulse() {
    setInterval(() => {
      if (this.isAttackActive) return;

      const p99 = (14.0 + (Math.random() - 0.5) * 0.6).toFixed(1);
      const latencyEl = document.getElementById('kpiLatency');
      if (latencyEl) latencyEl.textContent = `${p99} ms`;

      const throughput = (4.80 + (Math.random() - 0.5) * 0.08).toFixed(2);
      const ingressEl = document.getElementById('kpiIngress');
      if (ingressEl) ingressEl.textContent = `${throughput} TB/s`;
    }, 3000);
  }

  showToast(message) {
    let toast = document.getElementById('sentryToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'sentryToast';
      toast.className = 'sentry-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 3500);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.sentryApp = new SentryApp();
});
