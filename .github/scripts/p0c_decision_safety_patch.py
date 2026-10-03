from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)


# ---------------------------------------------------------------------------
# index.html — make the safety contract visible and provide an explicit
# second-step confirmation surface.
# ---------------------------------------------------------------------------
index_path = ROOT / "index.html"
index = index_path.read_text(encoding="utf-8")
old = '''          <!-- Analyst Rationale & Note Box -->
          <div class="rationale-dock-box">
            <span class="rationale-lbl">Mandatory Rationale Note:</span>
            <div class="tag-buttons-cloud">
              <button class="tag-btn" data-tag="Account Takeover (ATO)">ATO</button>
              <button class="tag-btn" data-tag="Carding Botnet">Carding Bot</button>
              <button class="tag-btn" data-tag="Impossible Travel">Impossible Travel</button>
              <button class="tag-btn" data-tag="Friendly Fraud">Friendly Fraud</button>
              <button class="tag-btn" data-tag="Legitimate Travel">Legit Travel</button>
            </div>
            <textarea class="analyst-note-textarea" id="analystNoteInput" placeholder="Document investigative rationale before committing high-stakes decision..."></textarea>
          </div>

          <!-- Audit Compliance Stamp -->'''
new = '''          <!-- Analyst Rationale & Note Box -->
          <div class="rationale-dock-box">
            <span class="rationale-lbl">Mandatory Rationale Note:</span>
            <div class="tag-buttons-cloud">
              <button class="tag-btn" data-tag="Account Takeover (ATO)">ATO</button>
              <button class="tag-btn" data-tag="Carding Botnet">Carding Bot</button>
              <button class="tag-btn" data-tag="Impossible Travel">Impossible Travel</button>
              <button class="tag-btn" data-tag="Friendly Fraud">Friendly Fraud</button>
              <button class="tag-btn" data-tag="Legitimate Travel">Legit Travel</button>
            </div>
            <textarea class="analyst-note-textarea" id="analystNoteInput" aria-describedby="rationaleValidationMessage" placeholder="Explain the evidence reviewed and why this action is justified..."></textarea>
            <div class="rationale-validation-message" id="rationaleValidationMessage" role="status" aria-live="polite">Explain the evidence and reasoning in at least 20 characters. Classification tags do not count as rationale.</div>
          </div>

          <!-- Decision Safety Gate -->
          <div class="decision-safety-status" id="decisionSafetyStatus" role="status" aria-live="polite">
            Rationale + evidence-review confirmation required before any decision is committed.
          </div>
          <div class="decision-confirm-panel" id="decisionConfirmPanel" hidden>
            <div class="decision-confirm-eyebrow">SECOND-STEP CONFIRMATION</div>
            <div class="decision-confirm-title" id="pendingDecisionTitle">Confirm decision</div>
            <div class="decision-confirm-impact" id="pendingDecisionImpact"></div>
            <label class="decision-ack-row" for="decisionEvidenceAck">
              <input type="checkbox" id="decisionEvidenceAck">
              <span>I reviewed the evidence, triggered rules and customer context for this alert.</span>
            </label>
            <div class="decision-confirm-actions">
              <button class="decision-confirm-btn secondary" id="btnCancelDecision" type="button">Cancel</button>
              <button class="decision-confirm-btn primary" id="btnConfirmDecision" type="button" disabled>Commit decision</button>
            </div>
          </div>

          <!-- Audit Compliance Stamp -->'''
index = replace_once(index, old, new, "decision safety markup")
index_path.write_text(index, encoding="utf-8")


# ---------------------------------------------------------------------------
# app.js — root-cause fix: no default rationale, no one-keystroke commit,
# explicit second step, recommendation-override warning, final-state lock.
# ---------------------------------------------------------------------------
app_path = ROOT / "js" / "app.js"
app = app_path.read_text(encoding="utf-8")

app = replace_once(
    app,
    "    this.selectedTag = '';\n    this.alerts = JSON.parse(JSON.stringify(SENTRY_DATA.alerts));",
    "    this.selectedTag = '';\n    this.pendingDecision = null;\n    this.decisionMinRationaleLength = 20;\n    this.alerts = JSON.parse(JSON.stringify(SENTRY_DATA.alerts));",
    "constructor decision state",
)

app = replace_once(
    app,
    "      else if (e.key === 'b' || e.key === 'B') this.executeDecision('FROZEN', 'Account Blocked & Frozen by Analyst');\n      else if (e.key === 'a' || e.key === 'A') this.executeDecision('APPROVED', 'Transaction Approved by Analyst');\n      else if (e.key === 'v' || e.key === 'V') this.executeDecision('NEEDS_VERIFICATION', 'Step-up 2FA/Biometric Challenge Issued');",
    "      else if (e.key === 'b' || e.key === 'B') this.requestDecision('FROZEN');\n      else if (e.key === 'a' || e.key === 'A') this.requestDecision('APPROVED');\n      else if (e.key === 'v' || e.key === 'V') this.requestDecision('NEEDS_VERIFICATION');\n      else if (e.key === 'Escape' && this.pendingDecision) this.cancelPendingDecision('Pending decision cancelled.');",
    "decision hotkeys",
)

bind_pattern = re.compile(r"  bindDecisionPanel\(\) \{.*?\n  \}\n\n  renderAlertQueue\(\) \{", re.S)
bind_replacement = '''  bindDecisionPanel() {
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
          noteArea.value = `[${this.selectedTag}] ` + noteArea.value.replace(/^\\[[^\\]]+\\]\\s*/, '');
        }
        this.updateRationaleValidation();
      });
    });

    if (noteArea) {
      noteArea.addEventListener('input', () => {
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

  renderAlertQueue() {'''
app, count = bind_pattern.subn(bind_replacement, app, count=1)
if count != 1:
    raise SystemExit(f"bindDecisionPanel replacement failed: {count}")

app = replace_once(
    app,
    "    // Clear previous note input\n    const noteArea = document.getElementById('analystNoteInput');\n    if (noteArea) {\n      noteArea.value = alert.analystDecision ? `[Resolved] ${alert.analystDecision}` : '';\n    }",
    "    // Reset decision drafting when the active alert changes. A committed\n    // decision is displayed read-only and cannot be silently overwritten.\n    this.pendingDecision = null;\n    this.selectedTag = '';\n    document.querySelectorAll('.tag-btn').forEach(t => t.classList.remove('active'));\n    const noteArea = document.getElementById('analystNoteInput');\n    if (noteArea) {\n      noteArea.value = alert.analystDecision ? `[Resolved] ${alert.analystDecision}` : '';\n      noteArea.readOnly = this.isFinalDecisionStatus(alert.status);\n    }\n    this.resetDecisionGuard();\n    this.updateRationaleValidation();\n    this.syncDecisionPanelState(alert);",
    "active alert decision reset",
)

execute_pattern = re.compile(r"  executeDecision\(verdict, defaultNote\) \{.*?\n  \}\n\n  renderRulesEngine\(\) \{", re.S)
execute_replacement = '''  isFinalDecisionStatus(status) {
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
    return (value || '').trim().replace(/^\\[[^\\]]+\\]\\s*/, '').trim();
  }

  validateDecisionRationale({ focus = false } = {}) {
    const noteArea = document.getElementById('analystNoteInput');
    const message = document.getElementById('rationaleValidationMessage');
    const raw = noteArea ? noteArea.value.trim() : '';
    const meaningful = this.normalizeRationaleText(raw);
    const valid = meaningful.length >= this.decisionMinRationaleLength && !raw.startsWith('[Resolved]');

    if (message) {
      if (!meaningful) {
        message.textContent = `Rationale required. Explain the evidence and reasoning in at least ${this.decisionMinRationaleLength} characters.`;
        message.className = 'rationale-validation-message is-error';
      } else if (!valid) {
        message.textContent = `${meaningful.length}/${this.decisionMinRationaleLength} rationale characters — add the evidence and reasoning behind the action.`;
        message.className = 'rationale-validation-message is-error';
      } else {
        message.textContent = `Rationale ready · ${meaningful.length} characters of analyst reasoning.`;
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

    this.executeDecision(pending.verdict, pending.rationale, pending);
  }

  executeDecision(verdict, noteText, context = {}) {
    const alert = this.alerts.find(a => a.id === this.activeAlertId);
    if (!alert) return false;
    if (this.isFinalDecisionStatus(alert.status)) {
      this.showToast(`Decision already committed for ${alert.id}.`);
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
      evidenceReviewAcknowledged: true
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
      rationale: rationaleParts.join(' · '),
      verdict: verdict === 'FROZEN' ? 'CONFIRMED_FRAUD' : (verdict === 'APPROVED' ? 'ALLOWED_CLEAN' : verdict),
      riskScoreAfter: alert.riskSpectrum.totalScore
    };

    this.auditLog.unshift(newAudit);
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
      }, 400);
    }
    return true;
  }

  renderRulesEngine() {'''
app, count = execute_pattern.subn(execute_replacement, app, count=1)
if count != 1:
    raise SystemExit(f"executeDecision replacement failed: {count}")

app_path.write_text(app, encoding="utf-8")


# ---------------------------------------------------------------------------
# styles.css — visual hierarchy for validation, staged decision, override,
# disabled/final states. Append once to minimize unrelated CSS churn.
# ---------------------------------------------------------------------------
css_path = ROOT / "css" / "styles.css"
css = css_path.read_text(encoding="utf-8")
marker = "/* P0-C Decision Safety */"
if marker in css:
    raise SystemExit("P0-C CSS marker already exists")
css += r'''

/* P0-C Decision Safety */
.btn-decision:disabled {
  opacity: 0.42;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.rationale-validation-message,
.decision-safety-status,
.decision-confirm-panel {
  font-family: var(--font-mono);
  font-size: 0.64rem;
  line-height: 1.45;
}

.rationale-validation-message {
  color: var(--text-muted);
}

.rationale-validation-message.is-error {
  color: var(--risk-high);
}

.rationale-validation-message.is-valid {
  color: var(--risk-clean);
}

.decision-safety-status {
  padding: 9px 10px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
  background: var(--bg-surface-input);
  color: var(--text-secondary);
}

.decision-safety-status.is-staged {
  border-color: var(--accent-blue);
  color: #FFFFFF;
}

.decision-safety-status.is-locked {
  border-color: rgba(255, 255, 255, 0.16);
  color: var(--text-muted);
}

.decision-confirm-panel {
  padding: 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--accent-blue);
  background: rgba(50, 39, 97, 0.32);
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.decision-confirm-panel[hidden] {
  display: none;
}

.decision-confirm-eyebrow {
  color: var(--accent-blue);
  font-size: 0.58rem;
  letter-spacing: 0.08em;
}

.decision-confirm-title {
  color: #FFFFFF;
  font-weight: 800;
  font-size: 0.74rem;
}

.decision-confirm-impact {
  color: var(--text-secondary);
}

.decision-confirm-impact.is-override {
  color: var(--risk-warn);
}

.decision-ack-row {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  color: var(--text-secondary);
  cursor: pointer;
}

.decision-ack-row input {
  margin-top: 2px;
  accent-color: var(--accent-blue);
}

.decision-confirm-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 7px;
}

.decision-confirm-btn {
  min-height: 34px;
  border-radius: var(--radius-sm);
  border: 1px solid rgba(255, 255, 255, 0.14);
  font-family: var(--font-mono);
  font-size: 0.64rem;
  font-weight: 700;
  cursor: pointer;
}

.decision-confirm-btn.primary {
  background: var(--btn-primary);
  color: #FFFFFF;
  border-color: var(--accent-blue);
}

.decision-confirm-btn.secondary {
  background: var(--bg-surface-input);
  color: var(--text-secondary);
}

.decision-confirm-btn:disabled {
  opacity: 0.42;
  cursor: not-allowed;
}
'''
css_path.write_text(css, encoding="utf-8")


# ---------------------------------------------------------------------------
# QA — exercise the actual analyst path: empty rationale blocked; hotkey stages;
# acknowledgement gates commit; audit preserves human rationale; final lock;
# recommendation override is explicitly surfaced.
# ---------------------------------------------------------------------------
qa_path = ROOT / "qa" / "evidence-lens.spec.mjs"
qa = qa_path.read_text(encoding="utf-8")
qa_marker = "test('Sentry research truth gate remains planned until real sessions exist', async () => {"
if qa_marker not in qa:
    raise SystemExit("QA insertion marker not found")
new_test = r'''test('Sentry decision safety requires rationale, review acknowledgement and second-step commit', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${baseURL}/index.html`, { waitUntil: 'domcontentloaded' });

  const note = page.locator('#analystNoteInput');
  const guard = page.locator('#decisionConfirmPanel');
  const validation = page.locator('#rationaleValidationMessage');
  const statusBadge = page.locator('#evidenceStateBadge');

  await expect(statusBadge).toContainText('HIGH RISK');

  // A destructive hotkey cannot commit or even stage without human rationale.
  await page.keyboard.press('b');
  await expect(validation).toContainText('Rationale required');
  await expect(guard).toBeHidden();
  await expect(statusBadge).toContainText('HIGH RISK');

  await note.fill('Reviewed device spoofing, impossible travel and the newly added beneficiary.');
  await page.keyboard.press('b');

  // Hotkey now stages the decision; it still cannot commit in one step.
  await expect(guard).toBeVisible();
  await expect(page.locator('#pendingDecisionTitle')).toContainText('BLOCK & FREEZE');
  await expect(page.locator('#btnConfirmDecision')).toBeDisabled();
  await expect(statusBadge).toContainText('HIGH RISK');

  await page.locator('#decisionEvidenceAck').check();
  await expect(page.locator('#btnConfirmDecision')).toBeEnabled();
  await page.locator('#btnConfirmDecision').click();

  // The immutable audit trail keeps the analyst's actual rationale, not a default note.
  await expect(page.locator('#auditLogTableBody')).toContainText('Reviewed device spoofing, impossible travel and the newly added beneficiary.');
  await expect(page.locator('#auditLogTableBody')).toContainText('FROZEN');

  // Re-opening the committed alert locks decision controls against silent overwrite.
  await page.evaluate(() => {
    window.sentryConsole.activeAlertId = 'ALT-8921';
    window.sentryConsole.switchView('queue');
    window.sentryConsole.renderAlertQueue();
    window.sentryConsole.renderActiveAlert();
  });
  await expect(page.locator('#btnActionFreeze')).toBeDisabled();
  await expect(page.locator('#decisionSafetyStatus')).toContainText('Decision committed: FROZEN');

  // A decision that conflicts with the model recommendation is visibly flagged.
  await page.locator('.queue-alert-card', { hasText: 'ALT-8920' }).click();
  await note.fill('Travel evidence is plausible, but the unresolved policy conflict requires a supervisor-safe containment choice.');
  await page.locator('#btnActionFreeze').click();
  await expect(page.locator('#pendingDecisionImpact')).toContainText('overrides the model recommendation');
  await page.locator('#btnCancelDecision').click();

  await fs.mkdir('qa-artifacts', { recursive: true });
  await page.screenshot({ path: 'qa-artifacts/sentry-decision-safety.png', fullPage: true });
});

'''
qa = qa.replace(qa_marker, new_test + qa_marker, 1)
qa_path.write_text(qa, encoding="utf-8")

print("P0-C decision safety patch applied")
