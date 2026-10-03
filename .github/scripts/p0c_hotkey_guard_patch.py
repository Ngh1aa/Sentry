from pathlib import Path

root = Path(__file__).resolve().parents[2]
path = root / 'js' / 'app.js'
text = path.read_text(encoding='utf-8')

old = """      // Tactical Decision hotkeys:
      else if (e.key === 'b' || e.key === 'B') this.requestDecision('FROZEN');
      else if (e.key === 'a' || e.key === 'A') this.requestDecision('APPROVED');
      else if (e.key === 'v' || e.key === 'V') this.requestDecision('NEEDS_VERIFICATION');
      else if (e.key === 'Escape' && this.pendingDecision) this.cancelPendingDecision('Pending decision cancelled.');
"""
new = """      // Tactical decision hotkeys are scoped to the investigation queue.
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
"""
count = text.count(old)
if count != 1:
    raise SystemExit(f'hotkey block: expected one match, found {count}')
path.write_text(text.replace(old, new, 1), encoding='utf-8')
print('P0-C hotkey guard patched')
