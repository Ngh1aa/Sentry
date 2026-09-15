// SENTRY // Tactical Orbital Threat Radar & Mesh Visualizer
// High-performance, Retina-aware 60fps 2D Canvas rendering

class SentryRadar {
  constructor(canvasId, containerId) {
    this.canvas = document.getElementById(canvasId);
    this.container = document.getElementById(containerId);
    if (!this.canvas || !this.container) return;

    this.ctx = this.canvas.getContext('2d');
    this.sweepAngle = 0;
    this.sweepSpeed = 0.018; // Smooth radar sweep speed
    this.nodes = [];
    this.packets = [];
    this.threatVectors = [];
    this.interceptRings = [];
    this.hoveredNode = null;
    this.selectedNode = null;
    this.isAlertMode = false;
    this.alertTimer = 0;

    this.initNodes();
    this.resize();
    this.bindEvents();
    this.initPackets();
    this.animate();
  }

  initNodes() {
    this.nodes = (SENTRY_DATA && SENTRY_DATA.nodes) ? JSON.parse(JSON.stringify(SENTRY_DATA.nodes)) : [];
  }

  resize() {
    if (!this.container || !this.canvas) return;
    const rect = this.container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    this.width = rect.width;
    this.height = rect.height;
    
    this.canvas.width = Math.floor(this.width * dpr);
    this.canvas.height = Math.floor(this.height * dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    
    this.ctx.scale(dpr, dpr);
    this.centerX = this.width / 2;
    this.centerY = this.height / 2;
    this.radius = Math.min(this.centerX, this.centerY) * 0.88;
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resize());

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      let found = null;
      for (const node of this.nodes) {
        const nx = this.centerX + (node.coords.x - 0.5) * (this.radius * 1.8);
        const ny = this.centerY + (node.coords.y - 0.5) * (this.radius * 1.8);
        const dist = Math.hypot(mouseX - nx, mouseY - ny);
        if (dist <= 22) {
          found = node;
          break;
        }
      }

      if (found !== this.hoveredNode) {
        this.hoveredNode = found;
        this.canvas.style.cursor = found ? 'pointer' : 'crosshair';
        if (found && window.sentryAudio) {
          window.sentryAudio.playTacticalClick();
        }
      }
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.hoveredNode = null;
    });

    this.canvas.addEventListener('click', (e) => {
      if (this.hoveredNode) {
        this.selectedNode = this.hoveredNode;
        if (window.sentryApp && window.sentryApp.onSelectNode) {
          window.sentryApp.onSelectNode(this.hoveredNode);
        }
        if (window.sentryAudio) {
          window.sentryAudio.playTacticalClick();
        }
      }
    });
  }

  initPackets() {
    this.packets = [];
    for (let i = 0; i < 14; i++) {
      this.spawnPacket();
    }
  }

  spawnPacket() {
    if (this.nodes.length < 2) return;
    const fromIdx = Math.floor(Math.random() * this.nodes.length);
    let toIdx = Math.floor(Math.random() * this.nodes.length);
    while (toIdx === fromIdx) {
      toIdx = Math.floor(Math.random() * this.nodes.length);
    }

    this.packets.push({
      from: this.nodes[fromIdx],
      to: this.nodes[toIdx],
      progress: Math.random(),
      speed: 0.003 + Math.random() * 0.005,
      isThreat: false
    });
  }

  triggerAttackSimulation() {
    this.isAlertMode = true;
    this.alertTimer = 0;
    
    const targetNode = this.nodes.find(n => n.id === 'node-virginia') || this.nodes[0];
    this.threatVectors = [];

    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6 + (Math.random() - 0.5) * 0.3;
      const startDist = this.radius * 1.25;
      this.threatVectors.push({
        originX: this.centerX + Math.cos(angle) * startDist,
        originY: this.centerY + Math.sin(angle) * startDist,
        targetNode: targetNode,
        progress: 0,
        speed: 0.006 + Math.random() * 0.004,
        id: `VEC-${900 + i}`,
        intercepted: false
      });
    }

    if (window.sentryAudio) {
      window.sentryAudio.playAlarmPulse();
    }
  }

  neutralizeSimulation() {
    this.threatVectors.forEach(vec => {
      vec.intercepted = true;
      const nx = this.centerX + (vec.targetNode.coords.x - 0.5) * (this.radius * 1.8);
      const ny = this.centerY + (vec.targetNode.coords.y - 0.5) * (this.radius * 1.8);
      const curX = vec.originX + (nx - vec.originX) * vec.progress;
      const curY = vec.originY + (ny - vec.originY) * vec.progress;
      
      this.interceptRings.push({
        x: curX,
        y: curY,
        radius: 4,
        maxRadius: 40,
        alpha: 1,
        color: '#00ff9d'
      });
    });

    setTimeout(() => {
      this.isAlertMode = false;
      this.threatVectors = [];
    }, 900);

    if (window.sentryAudio) {
      window.sentryAudio.playNeutralizeSuccess();
    }
  }

  drawGridAndRings() {
    const ctx = this.ctx;
    const cx = this.centerX;
    const cy = this.centerY;
    const r = this.radius;

    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
    ctx.lineWidth = 1;

    const ringFractions = [0.25, 0.5, 0.75, 1.0];
    const ringDistances = ['250 KM', '500 KM', '1,000 KM', '2,500 KM'];

    ringFractions.forEach((frac, idx) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r * frac, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(0, 240, 255, 0.35)';
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(ringDistances[idx], cx + 6, cy - (r * frac) + 12);
    });

    ctx.beginPath();
    ctx.moveTo(cx - r, cy);
    ctx.lineTo(cx + r, cy);
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx, cy + r);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.1)';
    ctx.stroke();

    ctx.setLineDash([2, 6]);
    ctx.beginPath();
    const dOffset = r * 0.7071;
    ctx.moveTo(cx - dOffset, cy - dOffset);
    ctx.lineTo(cx + dOffset, cy + dOffset);
    ctx.moveTo(cx - dOffset, cy + dOffset);
    ctx.lineTo(cx + dOffset, cy - dOffset);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.06)';
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(0, 240, 255, 0.6)';
    ctx.font = '10px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('000° [NORTH]', cx, cy - r - 12);
    ctx.fillText('180° [SOUTH]', cx, cy + r + 12);
    ctx.fillText('270° [WEST]', cx - r - 32, cy);
    ctx.fillText('090° [EAST]', cx + r + 32, cy);

    ctx.restore();
  }

  drawSweepBeam() {
    const ctx = this.ctx;
    const cx = this.centerX;
    const cy = this.centerY;
    const r = this.radius;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.sweepAngle);

    const beamAngle = Math.PI / 4;
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    
    if (this.isAlertMode) {
      gradient.addColorStop(0, 'rgba(255, 0, 85, 0.35)');
      gradient.addColorStop(0.8, 'rgba(255, 0, 85, 0.12)');
      gradient.addColorStop(1, 'rgba(255, 0, 85, 0)');
    } else {
      gradient.addColorStop(0, 'rgba(0, 240, 255, 0.35)');
      gradient.addColorStop(0.8, 'rgba(0, 240, 255, 0.08)');
      gradient.addColorStop(1, 'rgba(0, 240, 255, 0)');
    }

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r, -beamAngle, 0);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(r, 0);
    ctx.strokeStyle = this.isAlertMode ? '#ff0055' : '#00f0ff';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = this.isAlertMode ? '#ff0055' : '#00f0ff';
    ctx.shadowBlur = 8;
    ctx.stroke();

    ctx.restore();
  }

  drawNodes() {
    const ctx = this.ctx;

    this.nodes.forEach(node => {
      const nx = this.centerX + (node.coords.x - 0.5) * (this.radius * 1.8);
      const ny = this.centerY + (node.coords.y - 0.5) * (this.radius * 1.8);
      const isSelected = this.selectedNode && this.selectedNode.id === node.id;
      const isHovered = this.hoveredNode && this.hoveredNode.id === node.id;
      const isUnderThreat = this.isAlertMode && (node.id === 'node-virginia');

      ctx.save();
      const pulseSize = 10 + Math.sin(Date.now() * 0.005 + node.ping) * 3;
      ctx.beginPath();
      ctx.arc(nx, ny, pulseSize + (isSelected ? 6 : 0), 0, Math.PI * 2);
      ctx.strokeStyle = isUnderThreat 
        ? 'rgba(255, 0, 85, 0.7)' 
        : (isSelected ? 'rgba(0, 240, 255, 0.8)' : 'rgba(0, 255, 157, 0.3)');
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(nx, ny, isHovered || isSelected ? 6.5 : 4.5, 0, Math.PI * 2);
      ctx.fillStyle = isUnderThreat ? '#ff0055' : (isSelected ? '#00f0ff' : '#00ff9d');
      ctx.shadowColor = isUnderThreat ? '#ff0055' : '#00ff9d';
      ctx.shadowBlur = 10;
      ctx.fill();

      // Node label placement
      ctx.shadowBlur = 0;
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = isUnderThreat ? '#ff5577' : (isSelected ? '#00f0ff' : '#d2e4f0');
      ctx.textAlign = 'center';
      
      const labelOffsetY = (node.id === 'node-frankfurt') ? -14 : 17;
      ctx.fillText(node.name.split(' ')[0], nx, ny + labelOffsetY);

      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.fillStyle = isUnderThreat ? '#ff0055' : 'rgba(0, 240, 255, 0.6)';
      const subOffsetY = (node.id === 'node-frankfurt') ? -4 : 27;
      ctx.fillText(`${node.ping}ms // ${node.status}`, nx, ny + subOffsetY);

      if (isUnderThreat) {
        ctx.strokeStyle = '#ff0055';
        ctx.lineWidth = 1.5;
        const box = 18;
        ctx.strokeRect(nx - box, ny - box, box * 2, box * 2);
        
        ctx.fillStyle = '#ff0055';
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillText('CRITICAL // ZERO-DAY THREAT TARGET', nx, ny - 24);
      }

      ctx.restore();
    });
  }

  drawPackets() {
    const ctx = this.ctx;

    this.packets.forEach(p => {
      p.progress += p.speed;
      if (p.progress >= 1) {
        p.progress = 0;
      }

      const x1 = this.centerX + (p.from.coords.x - 0.5) * (this.radius * 1.8);
      const y1 = this.centerY + (p.from.coords.y - 0.5) * (this.radius * 1.8);
      const x2 = this.centerX + (p.to.coords.x - 0.5) * (this.radius * 1.8);
      const y2 = this.centerY + (p.to.coords.y - 0.5) * (this.radius * 1.8);

      const curX = x1 + (x2 - x1) * p.progress;
      const curY = y1 + (y2 - y1) * p.progress;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.04)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(curX, curY, 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 240, 255, 0.75)';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 4;
      ctx.fill();
    });
  }

  drawThreatVectors() {
    if (!this.threatVectors || this.threatVectors.length === 0) return;
    const ctx = this.ctx;

    this.threatVectors.forEach(vec => {
      if (vec.intercepted) return;
      vec.progress += vec.speed;
      if (vec.progress > 0.85) {
        vec.progress = 0.85;
      }

      const nx = this.centerX + (vec.targetNode.coords.x - 0.5) * (this.radius * 1.8);
      const ny = this.centerY + (vec.targetNode.coords.y - 0.5) * (this.radius * 1.8);

      const curX = vec.originX + (nx - vec.originX) * vec.progress;
      const curY = vec.originY + (ny - vec.originY) * vec.progress;

      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(255, 0, 85, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(vec.originX, vec.originY);
      ctx.lineTo(curX, curY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.arc(curX, curY, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ff0055';
      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = 10;
      ctx.fill();

      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.fillStyle = '#ff5577';
      ctx.fillText(vec.id, curX + 8, curY - 4);

      ctx.restore();
    });
  }

  drawInterceptRings() {
    if (!this.interceptRings || this.interceptRings.length === 0) return;
    const ctx = this.ctx;

    for (let i = this.interceptRings.length - 1; i >= 0; i--) {
      const ring = this.interceptRings[i];
      ring.radius += 1.8;
      ring.alpha -= 0.035;

      if (ring.alpha <= 0) {
        this.interceptRings.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
      ctx.strokeStyle = ring.color;
      ctx.globalAlpha = Math.max(0, ring.alpha);
      ctx.lineWidth = 2;
      ctx.shadowColor = ring.color;
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.restore();
    }
  }

  drawTooltip() {
    if (!this.hoveredNode) return;
    const ctx = this.ctx;
    const node = this.hoveredNode;
    const nx = this.centerX + (node.coords.x - 0.5) * (this.radius * 1.8);
    const ny = this.centerY + (node.coords.y - 0.5) * (this.radius * 1.8);

    const tooltipWidth = 190;
    const tooltipHeight = 90;
    let tipX = nx + 14;
    let tipY = ny - 45;

    if (tipX + tooltipWidth > this.width - 20) {
      tipX = nx - tooltipWidth - 14;
    }
    if (tipY < 20) tipY = 20;

    ctx.save();
    ctx.fillStyle = 'rgba(9, 12, 20, 0.92)';
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 12;

    ctx.beginPath();
    ctx.roundRect(tipX, tipY, tooltipWidth, tooltipHeight, 4);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px "Space Grotesk", sans-serif';
    ctx.fillText(node.name, tipX + 10, tipY + 18);

    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillStyle = '#8f9cae';
    ctx.fillText(`REGION:   ${node.region}`, tipX + 10, tipY + 34);
    ctx.fillText(`THROUGHPUT: ${node.ingress}`, tipX + 10, tipY + 48);
    ctx.fillText(`CPU LOAD: ${node.cpu}% | MEM: ${node.mem}%`, tipX + 10, tipY + 62);
    
    ctx.fillStyle = '#00ff9d';
    ctx.fillText(`INTEGRITY: ${node.shieldIntegrity}% [CLICK TO INSPECT]`, tipX + 10, tipY + 76);

    ctx.restore();
  }

  animate() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    this.sweepAngle += this.sweepSpeed;
    if (this.sweepAngle >= Math.PI * 2) {
      this.sweepAngle = 0;
      if (window.sentryAudio && Math.random() > 0.65) {
        window.sentryAudio.playRadarPing();
      }
    }

    this.drawGridAndRings();
    this.drawSweepBeam();
    this.drawPackets();
    this.drawThreatVectors();
    this.drawInterceptRings();
    this.drawNodes();
    this.drawTooltip();

    requestAnimationFrame(() => this.animate());
  }
}

window.SentryRadar = SentryRadar;
