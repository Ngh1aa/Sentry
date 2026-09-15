// SENTRY // Visual Diagram & Chart Rendering Engine
// Procedural SVG Generation: Spline Curves, Donut Gauges, Flight Hops & Entity Flow

const SentryVisuals = {

  // 1. Generate Smooth Cubic Spline Area Chart for Velocity Anomaly
  renderVelocityChart(containerId, curveData, isDark = true) {
    const container = document.getElementById(containerId);
    if (!container || !curveData) return;

    const width = 360;
    const height = 140;
    const padX = 28;
    const padY = 24;

    const maxVal = Math.max(...curveData.actualValues, 100) * 1.15;
    const minVal = 0;

    const pointsActual = curveData.actualValues.map((val, idx) => {
      const x = padX + (idx / (curveData.actualValues.length - 1)) * (width - padX * 2);
      const y = height - padY - ((val - minVal) / (maxVal - minVal)) * (height - padY * 2);
      return { x, y, val };
    });

    const pointsBaseline = curveData.baselineValues.map((val, idx) => {
      const x = padX + (idx / (curveData.baselineValues.length - 1)) * (width - padX * 2);
      const y = height - padY - ((val - minVal) / (maxVal - minVal)) * (height - padY * 2);
      return { x, y, val };
    });

    // Generate smooth cubic bezier SVG path
    function buildSmoothPath(pts) {
      if (pts.length < 2) return '';
      let d = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = i > 0 ? pts[i - 1] : pts[i];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = i !== pts.length - 2 ? pts[i + 2] : p2;

        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;

        d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
      }
      return d;
    }

    const actualPath = buildSmoothPath(pointsActual);
    const baselinePath = buildSmoothPath(pointsBaseline);
    const areaPath = `${actualPath} L ${pointsActual[pointsActual.length - 1].x} ${height - padY} L ${pointsActual[0].x} ${height - padY} Z`;

    const lastPt = pointsActual[pointsActual.length - 1];

    container.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" class="chart-svg" style="width: 100%; height: 100%;">
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#FF3B69" stop-opacity="0.38"/>
            <stop offset="100%" stop-color="#FF3B69" stop-opacity="0.0"/>
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <!-- Baseline normal curve (Soft Cyan) -->
        <path d="${baselinePath}" fill="none" stroke="#00F0FF" stroke-width="1.8" stroke-dasharray="3 3" opacity="0.6"/>

        <!-- Anomaly Area Fill -->
        <path d="${areaPath}" fill="url(#areaGradient)"/>

        <!-- Anomaly Line (Vibrant Crimson) -->
        <path d="${actualPath}" fill="none" stroke="#FF3B69" stroke-width="2.6" filter="url(#glow)"/>

        <!-- Spike Highlight Indicator -->
        <line x1="${lastPt.x}" y1="${lastPt.y}" x2="${lastPt.x}" y2="${height - padY}" stroke="#FF3B69" stroke-width="1.2" stroke-dasharray="2 2" opacity="0.7"/>
        <circle cx="${lastPt.x}" cy="${lastPt.y}" r="4.5" fill="#FF3B69" stroke="#FFFFFF" stroke-width="2" filter="url(#glow)"/>

        <!-- Floating Value Tag -->
        <g transform="translate(${lastPt.x - 72}, ${lastPt.y - 30})">
          <rect width="68" height="20" rx="3" fill="#FF3B69"/>
          <text x="34" y="14" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="700" fill="#FFFFFF" text-anchor="middle">${curveData.spikeValue}</text>
        </g>

        <!-- X Axis Labels -->
        <text x="${pointsActual[0].x}" y="${height - 6}" font-family="'JetBrains Mono', monospace" font-size="9" fill="#8F9CAE">00:00</text>
        <text x="${width / 2}" y="${height - 6}" font-family="'JetBrains Mono', monospace" font-size="9" fill="#8F9CAE" text-anchor="middle">10m Window</text>
        <text x="${lastPt.x}" y="${height - 6}" font-family="'JetBrains Mono', monospace" font-size="9" font-weight="700" fill="#FF3B69" text-anchor="end">Current</text>
      </svg>
    `;
  },

  // 2. Generate Circular Donut Progress Ring (Visual Signature)
  renderDonutGauge(containerId, score, maxScore = 100) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const strokeOffset = circumference - (score / maxScore) * circumference;

    let strokeColor = '#FF3B69';
    let gradeLabel = 'CRITICAL';
    if (score < 50) {
      strokeColor = '#00E599';
      gradeLabel = 'CLEAN';
    } else if (score < 75) {
      strokeColor = '#FFB547';
      gradeLabel = 'REVIEW';
    }

    container.innerHTML = `
      <div class="donut-gauge-wrap">
        <svg viewBox="0 0 140 140" class="donut-svg">
          <circle cx="70" cy="70" r="${radius}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="12"/>
          <circle cx="70" cy="70" r="${radius}" fill="none" stroke="${strokeColor}" stroke-width="12"
            stroke-dasharray="${circumference}" stroke-dashoffset="${strokeOffset}"
            stroke-linecap="round" transform="rotate(-90 70 70)"
            style="transition: stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1);"/>
        </svg>
        <div class="donut-center-text">
          <span class="donut-score mono bold" style="color: ${strokeColor};">${score}%</span>
          <span class="donut-lbl">${gradeLabel}</span>
        </div>
      </div>
    `;
  },

  // 3. Generate Geolocation Hop & Flight Path Diagram (Visual Hop Arc)
  renderGeoHopDiagram(containerId, geoData) {
    const container = document.getElementById(containerId);
    if (!container || !geoData) return;

    const isImpossible = geoData.isImpossible;
    const arcColor = isImpossible ? '#FF3B69' : '#00E599';

    container.innerHTML = `
      <div class="geo-hop-box">
        <div class="geo-hop-header">
          <span class="geo-tag mono">${geoData.distanceKm} // DELTA ${geoData.timeDeltaMin}</span>
          <span class="badge-tag ${isImpossible ? 'tag-danger' : 'tag-clean'}">${geoData.speedKmh}</span>
        </div>

        <svg viewBox="0 0 320 80" class="geo-arc-svg" style="width: 100%; height: 80px;">
          <!-- Node 1 (Origin) -->
          <circle cx="45" cy="55" r="8" fill="rgba(0, 240, 255, 0.2)"/>
          <circle cx="45" cy="55" r="4.5" fill="#00F0FF"/>
          <text x="45" y="74" font-family="'JetBrains Mono', monospace" font-size="9" fill="#94A3B8" text-anchor="middle">${geoData.origin.name.split(' ')[0]}</text>

          <!-- Parabolic Flight Arc -->
          <path d="M 45 55 Q 160 5, 275 55" fill="none" stroke="${arcColor}" stroke-width="2.4" stroke-dasharray="5 4"/>

          <!-- Traveling packet icon -->
          <circle cx="160" cy="30" r="3.5" fill="${arcColor}"/>

          <!-- Node 2 (Destination) -->
          <circle cx="275" cy="55" r="${isImpossible ? 10 : 8}" fill="${isImpossible ? 'rgba(255, 59, 105, 0.25)' : 'rgba(0, 229, 153, 0.2)'}"/>
          <circle cx="275" cy="55" r="4.5" fill="${arcColor}"/>
          <text x="275" y="74" font-family="'JetBrains Mono', monospace" font-size="9" fill="${isImpossible ? '#FF3B69' : '#94A3B8'}" font-weight="700" text-anchor="middle">${geoData.destination.name.split(' ')[0]}</text>
        </svg>

        <div class="geo-verdict-bar ${isImpossible ? 'text-danger' : 'text-clean'} mono bold">
          ${isImpossible ? '⚡' : '✓'} ${geoData.verdict}
        </div>
      </div>
    `;
  },

  // 4. Render Virtual/Physical Payment Card Widget (From Attached Image Inspiration)
  renderVirtualCard(containerId, cardVisual, amountFormatted) {
    const container = document.getElementById(containerId);
    if (!container || !cardVisual) return;

    container.innerHTML = `
      <div class="virtual-card-widget" style="background: ${cardVisual.gradient};">
        <div class="card-widget-top">
          <div class="card-brand-title">${cardVisual.type}</div>
          <div class="card-network-logo">${cardVisual.brand}</div>
        </div>

        <div class="card-chip-row">
          <div class="card-emv-chip" style="background: ${cardVisual.chipColor};">
            <div class="chip-line"></div>
          </div>
          <svg class="contactless-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M8.5 16.5a5 5 0 0 1 0-9"/>
            <path d="M12 19a8.5 8.5 0 0 1 0-14"/>
            <path d="M15.5 21.5a12 12 0 0 1 0-19"/>
          </svg>
        </div>

        <div class="card-pan-row mono">${cardVisual.panMasked}</div>

        <div class="card-widget-bottom">
          <div>
            <div class="card-sub-lbl">CARDHOLDER</div>
            <div class="card-holder-name">${cardVisual.cardholder}</div>
          </div>
          <div style="text-align: right;">
            <div class="card-sub-lbl">EXPIRES</div>
            <div class="card-holder-name mono">${cardVisual.expiry}</div>
          </div>
        </div>
      </div>
    `;
  },

  // 5. Render Entity Relationship Flow Nodes
  renderEntityGraph(containerId, graphData) {
    const container = document.getElementById(containerId);
    if (!container || !graphData) return;

    let nodesHtml = '';
    graphData.forEach((step, idx) => {
      const isDanger = step.status === 'danger';
      nodesHtml += `
        <div class="entity-step-node ${isDanger ? 'node-danger' : 'node-clean'}">
          <div class="entity-name">${step.from}</div>
          <div class="entity-arrow-wrap">
            <span class="entity-link-lbl mono">${step.label}</span>
            <span class="entity-arrow">➔</span>
          </div>
          <div class="entity-target">${step.to}</div>
        </div>
      `;
    });

    container.innerHTML = `<div class="entity-graph-strip">${nodesHtml}</div>`;
  }
};

window.SentryVisuals = SentryVisuals;
