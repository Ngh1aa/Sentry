# Sentry Round 01 — Screener + Consent

## Preferred participant criteria

Prioritize people who have recent experience with at least one of:
- fraud/risk operations;
- payments operations;
- compliance investigation;
- trust & safety review;
- security operations using alert queues and evidence review.

If recruiting domain practitioners is not feasible, adjacent operations/compliance/security participants may be used only as **PROXY** evidence and must stay labeled as such.

## Exclude / do not collect

Do not ask for:
- real customer identities;
- real transaction details;
- employer-confidential rules or thresholds;
- credentials, account numbers or production screenshots;
- sensitive incident details.

The prototype uses simulated data only.

## Screener questions

1. Which of these best describes your recent work? fraud/risk ops / payments ops / compliance / trust & safety / security ops / other.
2. In the past 12 months, have you reviewed alerts, cases or exceptions that required a decision and written rationale?
3. Have you used a queue or case-management tool where decisions needed an audit trail?
4. Are you comfortable completing a 30–40 minute prototype session using fictional data?
5. Are you willing to let anonymized behavioral observations be used in a portfolio case study? This is optional; participation may proceed without portfolio consent.

## Consent script

Before the session, confirm:
- the product is a portfolio prototype, not a live fraud platform;
- all case data is fictional/simulated;
- participation is voluntary and can stop at any time;
- no employer/customer-confidential data should be shared;
- notes will use participant IDs rather than names;
- recording, if any, requires separate explicit permission;
- portfolio use of anonymized evidence requires separate explicit permission.

## Evidence classification

- Domain practitioner matching the preferred criteria → `DIRECT_USER` for this concept audience.
- Adjacent operations/compliance/security participant → `PROXY`.
- Designer/developer reviewing the UI → not user-validation evidence; classify as critique/peer review separately.
