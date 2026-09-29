# Sentry — Validation Round 01

**Evidence state:** `PLANNED_VALIDATION`  
**Study type:** moderated task-based usability / decision-comprehension test  
**Prototype:** `index.html` + `recovery-scenario.html`  
**Target:** 5 participants; prefer fraud/risk/ops practitioners, otherwise clearly label adjacent operations/compliance proxies.

## Decision map

- `D-01` — Can an analyst explain *why* an alert is risky using evidence, not only the composite score?
- `D-02` — Can an analyst distinguish freeze, allow, step-up verification and escalation consequences?
- `D-03` — Does the split workspace preserve enough evidence context to support a defensible decision?
- `D-04` — When audit persistence fails, does the recovery model preserve rationale and prevent unsafe auto-advance?

## Research questions

1. Which evidence do participants inspect before acting?
2. Do they understand the relationship between risk score, triggered rules and conflicting signals?
3. Can they state the consequence of each decision action before clicking it?
4. Do they notice whether rationale will remain traceable?
5. In the failure scenario, do they retry, review or accidentally assume the action already completed?

## Tasks

### Task 1 — Investigate a high-risk alert
Prompt: “Review the highest-priority alert and tell me whether you would allow, verify, escalate or freeze it. Show me what evidence supports your choice.”

Observe evidence sequence, ignored signals, reliance on score, rule-conflict comprehension and rationale quality.

### Task 2 — Resolve ambiguity
Prompt: “This alert contains conflicting policy signals. Decide what you would do next and explain what would need to be preserved for another reviewer.”

Observe escalation vs irreversible action, ownership/handoff expectations and traceability.

### Task 3 — Recover from audit-save failure
Open `recovery-scenario.html`.
Prompt: “Record the freeze decision. Something goes wrong while saving. Continue in the safest way you can.”

Observe whether rationale is perceived as preserved, whether the participant expects auto-advance, retry/review choice and confidence after recovery.

## Measures

For each task record:
- outcome: success / partial / failure;
- critical decision error: yes / no;
- evidence used before decision;
- time to decision (approximate seconds);
- moderator assistance: none / light / direct;
- confidence: 1–5 after task;
- observable rationale quality: evidence-linked / score-only / unclear;
- recovery outcome for Task 3.

A **critical decision error** is an action or interpretation that would materially weaken safety or auditability in a real fraud workflow, e.g. assuming a failed audit write succeeded or freezing/allowing while misunderstanding the evidence consequence.

## Moderator rules

- Do not teach fraud terminology mid-task unless participant inclusion criteria explicitly allow a proxy-study explanation before the task begins.
- Ask “What are you looking for?” and “What do you expect to happen?” rather than explaining the UI.
- Separate domain knowledge gaps from interface comprehension failures.
- Record behavior before interpretation.
- Never convert proxy participants into practitioner evidence.

## Claim boundary

Until real session records exist, valid wording is only: **“A moderated validation round is prepared; direct-user evidence has not been collected yet.”**
