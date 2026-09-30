# Sentry — Next Evidence Plan

Status: `PLANNED / READY_FOR_EXECUTION`

Canonical reviewer prototype: https://sentry-xi-lime.vercel.app/

Workspace operating contract: `Ngh1aa/uiux-ai-workspace` — source truth → acceptance criteria → execution → verification → root-cause repair → report.

Current evidence boundary:
- recruiter-facing Design Lens exists;
- D-01…D-04 are product/design decisions under test, not validated outcomes;
- the audit-save recovery scenario is working prototype evidence, not human validation;
- verified DIRECT_USER sessions: **0**;
- verified PROXY sessions: **0**;
- do not claim lower decision time, fewer false positives, prevented fraud loss or improved recovery until compatible post-change evidence exists.

## Goal

Turn Sentry from a high-density fraud-operations concept into a recruiter-verifiable product-design case where every consequential action is traceable to evidence, state consequence and recovery.

`Decision → state/edge case → evidence → change → retest → still open`

## Execution order

### S0 — One canonical reviewer surface

Use `https://sentry-xi-lime.vercel.app/` as the canonical live prototype.

Acceptance criteria:
- portfolio and case-study live links point to this URL;
- Design Lens / reviewer entry is reachable from the same deployment or clearly linked from it;
- reviewer can return to the normal product quickly;
- review overlays are labeled as reviewer/prototype tools, not production capability.

### S1 — Recruiter-visible Decision Pins

Expose the four current decisions on the surfaces where they matter:

- **D-01 Split investigation workspace** — queue priority, evidence context and decision dock stay together.
- **D-02 Consequence-specific actions** — Freeze / Allow / Step-up / Escalate remain distinct and explain consequence.
- **D-03 Rationale is part of the decision** — rationale travels with disposition and audit trail.
- **D-04 Audit-save recovery** — failed audit write preserves work and blocks unsafe auto-advance.

Each pin/popover must show:
- current decision;
- evidence class;
- risk if wrong;
- trade-off;
- task/finding IDs when they exist;
- status (`PLANNED_VALIDATION`, later `ITERATED`, `RETESTED`, etc.).

### S2 — State / edge-case depth

Make these states directly inspectable in the reviewer surface and QA:

1. empty alert queue;
2. loading / evidence fetch;
3. decision/action error;
4. dense 50-link / relationship stress state;
5. failed audit save with preserved rationale and no auto-advance.

For each state verify:
- current alert remains identifiable;
- evidence already reviewed is not silently lost;
- system consequence is explicit;
- irreversible actions are not repeated accidentally;
- next safe action is visible;
- audit/recovery status is reconstructable.

### S3 — Before / current comparison

Use only an explicitly labeled conceptual baseline:

`CONCEPTUAL BASELINE / NOT A HISTORICAL SHIPPED SCREEN`

Compare the decision structure:
- fragmented queue / evidence / action context;
- versus one synchronized investigation workspace.

Do not imply the baseline was a real production predecessor.

### S4 — 60-second reviewer tour

Five stops, one reason per stop:

1. **Priority queue** — why this alert deserves attention now.
2. **Evidence correlation** — what evidence supports or contradicts risk.
3. **Decision consequence** — what Freeze / Allow / Step-up / Escalate actually does.
4. **Rationale + audit** — how another reviewer reconstructs the decision.
5. **Recovery** — what happens when audit save fails and what is preserved.

Tour copy explains decision reasoning, not feature marketing.

### S5 — Direct-user Round 01

Target: **3–5 real participants**, preferably 5.

Preferred DIRECT_USER population:
- fraud operations;
- risk operations;
- payments risk;
- compliance investigations;
- trust & safety;
- security operations with comparable triage/decision workflows.

Adjacent operations/compliance/security participants remain `PROXY` and are analyzed separately.

Priority tasks:
- **Task 1 / D-01:** triage an alert and justify the next action from visible evidence without losing queue context.
- **Task 2 / D-02 + D-03:** choose a consequence-specific action and explain expected consequence plus rationale.
- **Task 3 / D-04:** handle failed audit save; explain whether action committed, what was preserved and what to do next.
- **Task 4 / density stress:** locate the evidence needed for a decision in a high-link/high-density investigation state.

Evidence rules:
- no customer PII, real transaction data, credentials or confidential company screenshots in repo;
- record exact tested build/URL;
- record DIRECT_USER vs PROXY;
- observation and interpretation stay separate;
- atomic evidence only after integrity review;
- 0 sessions stays 0 until traceable participant records exist.

### S6 — Synthesis + prioritization

After 3–5 verified sessions:
- append atomic evidence IDs;
- synthesize repeated patterns and contradictions;
- map findings to D-01…D-04;
- assign P0/P1/P2/P3 based on consequence, frequency and recoverability;
- keep contradictory evidence visible;
- update `DECISION-LOG.md` with evidence IDs.

### S7 — Evidence-driven iteration

Change only decisions supported by verified evidence.

Likely repair owners:
- D-01 → workspace information architecture / context persistence;
- D-02 → action hierarchy and consequence language;
- D-03 → rationale structure / required evidence capture;
- D-04 → audit-save state model, preserved work and retry/review behavior.

A changed interface is labeled `ITERATION`, not “improved”.

### S8 — Retest

Freeze the changed build and rerun the affected task with **3–5 new or explicitly marked returning participants**.

Only compatible post-change evidence may move a finding to:
- `PARTIALLY_FIXED`;
- `FIXED_FOR_RETEST_SCOPE`;
- `RETESTED`.

If evidence is mixed or a consequence/recovery issue regresses, keep it open.

## Recruiter output after the loop

The homepage / case study / reviewer surface should expose, in 30–60 seconds:

`Problem → D-01…D-04 → N verified users → N atomic signals → what changed → retest result → what is still open`

Until Round 01 exists, use truthful placeholders:
- `Direct users · 0 verified`;
- `Round 01 · ready to recruit`;
- `Findings · not measured yet`.

## Definition of done for the next Sentry phase

- canonical Vercel reviewer URL is used consistently;
- decision pins and high-consequence failure/recovery states are inspectable;
- 60-second tour works at recruiter-relevant desktop widths and remains usable at mobile review widths;
- no console/runtime errors on reviewer-critical flows;
- direct-user package is linked to the exact tested build;
- evidence counts remain truthful;
- iteration is blocked until evidence exists;
- any post-change claim is blocked until retest evidence exists.
