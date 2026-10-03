from pathlib import Path

root = Path(__file__).resolve().parents[2]
app_path = root / 'js' / 'app.js'
qa_path = root / 'qa' / 'evidence-lens.spec.mjs'

app = app_path.read_text(encoding='utf-8')

def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one match, found {count}')
    return text.replace(old, new, 1)

# Correct JS regex literals: classification tags must never count toward rationale length.
app = replace_once(
    app,
    "noteArea.value = `[${this.selectedTag}] ` + noteArea.value.replace(/^\\\\[[^\\\\]]+\\\\]\\\\s*/, '');",
    "noteArea.value = `[${this.selectedTag}] ` + noteArea.value.replace(/^\\[[^\\]]+\\]\\s*/, '');",
    'tag prefix regex'
)
app = replace_once(
    app,
    "return (value || '').trim().replace(/^\\\\[[^\\\\]]+\\\\]\\\\s*/, '').trim();",
    "return (value || '').trim().replace(/^\\[[^\\]]+\\]\\s*/, '').trim();",
    'rationale normalization regex'
)

# Treat committed notes as read-only state rather than a validation error.
old_validation = """    const meaningful = this.normalizeRationaleText(raw);
    const valid = meaningful.length >= this.decisionMinRationaleLength && !raw.startsWith('[Resolved]');

    if (message) {
      if (!meaningful) {
        message.textContent = `Rationale required. Explain the evidence and reasoning in at least ${this.decisionMinRationaleLength} characters.`;
        message.className = 'rationale-validation-message is-error';
      } else if (!valid) {
"""
new_validation = """    const meaningful = this.normalizeRationaleText(raw);
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
"""
app = replace_once(app, old_validation, new_validation, 'resolved rationale state')

# The commit function itself must enforce acknowledgement; the UI cannot be the only guard.
app = replace_once(
    app,
    "    this.executeDecision(pending.verdict, pending.rationale, pending);",
    "    this.executeDecision(pending.verdict, pending.rationale, { ...pending, evidenceReviewAcknowledged: true });",
    'confirmation acknowledgement context'
)
app = replace_once(
    app,
    "    if (this.isFinalDecisionStatus(alert.status)) {\n      this.showToast(`Decision already committed for ${alert.id}.`);\n      return false;\n    }\n\n    const meaningful = this.normalizeRationaleText(noteText);",
    "    if (this.isFinalDecisionStatus(alert.status)) {\n      this.showToast(`Decision already committed for ${alert.id}.`);\n      return false;\n    }\n    if (!context.evidenceReviewAcknowledged) {\n      this.showToast('Decision blocked: evidence review acknowledgement is required.');\n      return false;\n    }\n\n    const meaningful = this.normalizeRationaleText(noteText);",
    'commit acknowledgement guard'
)
app = replace_once(
    app,
    "      evidenceReviewAcknowledged: true",
    "      evidenceReviewAcknowledged: Boolean(context.evidenceReviewAcknowledged)",
    'audit acknowledgement truth'
)

app_path.write_text(app, encoding='utf-8')

# Add one regression assertion proving direct executeDecision cannot bypass the UI safety gate.
qa = qa_path.read_text(encoding='utf-8')
needle = """  await expect(statusBadge).toContainText('HIGH RISK');

  // A destructive hotkey cannot commit or even stage without human rationale.
"""
replacement = """  await expect(statusBadge).toContainText('HIGH RISK');

  const bypassResult = await page.evaluate(() => window.sentryConsole.executeDecision(
    'APPROVED',
    'Reviewed the alert evidence and would otherwise allow this transaction.',
    { evidenceReviewAcknowledged: false }
  ));
  expect(bypassResult).toBe(false);
  await expect(statusBadge).toContainText('HIGH RISK');

  // A destructive hotkey cannot commit or even stage without human rationale.
"""
qa = replace_once(qa, needle, replacement, 'direct commit bypass regression')
qa_path.write_text(qa, encoding='utf-8')

print('P0-C guard hardening applied')
