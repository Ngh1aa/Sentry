# Sentry Round 01 — Decision Log

This log names the consequential product decisions that Round 01 is intended to challenge. Current entries are design decisions, not validated outcomes.

## D-01 — Split investigation workspace

- **Current decision:** Keep queue priority, evidence context and decision dock visible within one investigation workspace.
- **Evidence state:** `WORKING_PROTOTYPE + HYPOTHESIS`
- **Risk:** Density may improve context retention while reducing learnability or increasing visual search cost.
- **Evidence that could change it:** Participants repeatedly lose the evidence needed to justify a decision, or require navigation/reorientation before acting.
- **Next evidence:** Task 1.

## D-02 — Multiple consequence-specific decision actions

- **Current decision:** Freeze, allow, step-up verification and escalation remain distinct actions with explicit consequence language.
- **Evidence state:** `WORKING_PROTOTYPE + HYPOTHESIS`
- **Risk:** Too many actions may look powerful but create ambiguity under time pressure.
- **Evidence that could change it:** Participants cannot predict consequences or confuse verification/escalation with final dispositions.
- **Next evidence:** Tasks 1–2.

## D-03 — Rationale as part of the decision, not post-hoc notes

- **Current decision:** Analyst rationale stays attached to the disposition and audit trail.
- **Evidence state:** `WORKING_PROTOTYPE + HYPOTHESIS`
- **Risk:** Free-text may be slow or inconsistent; categorical tags alone may be insufficient for independent review.
- **Evidence that could change it:** Participants omit critical evidence, cannot reconstruct why an action was taken, or treat rationale as optional busywork.
- **Next evidence:** Tasks 1–2.

## D-04 — Failed audit save blocks auto-advance and preserves work

- **Current decision:** A failed audit write must preserve rationale, keep the same alert in context, and offer explicit retry/review rather than silently advancing.
- **Evidence state:** `WORKING_PROTOTYPE` via `recovery-scenario.html`; human comprehension remains unvalidated.
- **Risk:** Recovery controls may still be misunderstood or create duplicate-action anxiety.
- **Evidence that could change it:** Participants think the action already executed, cannot tell what was preserved, or choose unsafe repeated actions.
- **Next evidence:** Task 3.

## Update rule

Only change a decision’s evidence state when the cited session/evidence IDs exist. A changed UI is an **iteration** until the affected task is retested.
