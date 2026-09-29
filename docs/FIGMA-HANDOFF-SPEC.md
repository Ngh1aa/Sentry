# Sentry — Figma System + Handoff Spec

**Status:** implementation contract derived from the working prototype and design docs. This file does **not** claim the public Figma file already contains every page/state listed here.

## 00 — Cover / Prototype Guide

Show the primary review task:
**queue → inspect evidence → choose action → write rationale → recover from audit-save failure → verify trace**.

Link:
- main prototype;
- `recovery-scenario.html`;
- case study;
- evidence status: `PLANNED_VALIDATION` until real sessions exist.

## 01 — Product Context

Frame:
- analyst goal: make a defensible decision without losing evidence context;
- operational tension: speed vs review depth;
- product risk: fast but poorly supported irreversible action;
- project reality: simulated fraud operations; no production risk engine or immutable regulated storage.

## 02 — Research / Assumptions

Separate:
- product/domain assumptions;
- desk/benchmark evidence;
- `PLANNED_VALIDATION` Round 01;
- DIRECT_USER / PROXY evidence, empty until sessions exist.

Do not place simulated MTTD, false-positive or loss-prevention numbers in a measured-outcome section.

## 03 — User Flows

Required flows:
1. queue → high-risk alert → evidence → disposition;
2. rule conflict → review → escalation;
3. ambiguous evidence → step-up verification;
4. false positive → allow + rationale;
5. audit save failure → preserve rationale → retry/review → success;
6. case handoff → audit reconstruction.

Annotate irreversible vs recoverable actions.

## 04 — Information Architecture

Map:
- Alert Queue;
- Cases;
- Rules Engine;
- Customers / entities;
- Analytics;
- Audit Log;
- persistent Decision Dock.

Show which information is global, alert-scoped, case-scoped and audit-scoped.

## 05 — Wireframes

Grayscale only. Include:
- split investigation workspace;
- collapsed/narrow behavior;
- rule conflict;
- decision rationale;
- failure/retry state;
- audit confirmation.

## 06 — Explorations / Decisions

Document at least:
- dashboard→detail navigation vs split workspace vs fully configurable workspace;
- density vs learnability;
- speed vs review depth;
- automation vs explainability;
- free-text rationale vs structured tags vs hybrid;
- silent retry vs blocking recovery state for audit persistence.

Every selected direction needs a rejected alternative and cost.

## 07 — Design System

### Foundations
- typography: Inter + JetBrains Mono roles;
- neutral workspace surfaces;
- semantic risk/status tokens;
- spacing/grid;
- dense table/list rhythm;
- focus ring and non-color status semantics;
- motion/easing rules.

### Components
- navigation tabs;
- filter controls;
- alert queue card;
- risk badge;
- evidence card;
- risk gauge/visual wrappers;
- rule/conflict banner;
- decision action button;
- rationale tags + textarea;
- toast;
- table rows;
- recovery/error banner;
- audit record.

### States
`default · hover · focus · pressed · disabled · loading · empty · error · success · conflict · escalated · frozen · needs verification` where applicable.

## 08 — Final Screens

Group by task:
- prioritize work;
- investigate;
- resolve ambiguity;
- act;
- recover;
- reconstruct decision history.

Avoid presenting analytics as measured product impact; they remain simulated scenario telemetry.

## 09 — Prototype

The prototype page should let a reviewer run:
1. normal high-risk investigation;
2. rule conflict;
3. step-up verification;
4. audit failure recovery.

The recovery prototype must preserve rationale, block unsafe auto-advance, and expose retry/review choices.

## 10 — Handoff / Specs

Document:
- desktop workspace minimum widths and narrow-layout behavior;
- queue/evidence/decision ownership boundaries;
- long customer/merchant/rule text overflow;
- table truncation + expansion rules;
- focus order and keyboard shortcuts;
- action confirmation semantics;
- audit-save loading/error/retry behavior;
- idempotency concern for production repeated actions;
- role/permission boundaries for analyst vs supervisor;
- color-independent risk/status communication;
- reduced-motion behavior;
- production dependencies: risk services, auth/RBAC, immutable storage, case ownership, real telemetry and compliance controls.

## Review gate

Reviewer-ready means the file makes the **decision system** inspectable, not merely the visual density. A reviewer should be able to see what happens before, during and after a consequential decision—including failure.
