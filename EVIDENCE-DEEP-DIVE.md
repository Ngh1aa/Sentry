# Sentry — Evidence Deep Dive

Status: `TECHNICAL_PROOF READY / DIRECT_USER ROUND 01 READY_TO_RECRUIT`

This package makes the product reasoning inspectable through:

`Decision Pins → state/edge cases → conceptual before/current → 60-second tour → direct-user test → Decision Log → iteration → retest`

## Inspect now

- `design-lens.html` — four decision pins, conceptual baseline/current comparison and a five-step recruiter tour.
- `recruiter-state-lab.html` — empty/loading/error/stress operational states.
- `recovery-scenario.html` — audit-save failure/retry behavior.
- `research/validation/sentry-round-01/` — moderated validation package and empty evidence ledger.
- `qa/evidence-lens.spec.mjs` — browser gate for the design-lens and research truth boundary.

## Decision map

- `D-01` — Split investigation workspace.
- `D-02` — Consequence-specific decision actions.
- `D-03` — Rationale as part of the decision.
- `D-04` — Failed audit save preserves work and blocks auto-advance.

## Human gate

Current verified direct-user sessions: **0**.

The state lab, QA and recovery scenario are technical/product evidence, not human validation. After real sessions produce traceable evidence, update the existing Round 01 Decision Log, iterate the affected decision, freeze that changed build and rerun the affected task before making any improvement claim.
