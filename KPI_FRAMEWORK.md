# KPI Framework

## Activation

- **Time to first suite run** — signup → first completed eval run. The core "aha" moment is seeing a real verdict on a real feature.
- **Time to first registered feature** — signup → first project registered. Precedes everything else in the funnel.

## Engagement

- **Suites run per active org per week** — proxy for the tool being in the actual engineering loop, not a one-time demo.
- **% of runs that include at least one non-judge method** (programmatic or human) — signals teams trust the platform enough to build real rubrics, not just a single LLM-judge pass.
- **Review queue completion rate** — pending human-review items completed within 48h. A backed-up queue means the human-in-the-loop workflow isn't sticking.

## Trust / rigor

- **% of regression flags with p < 0.05** — should be ~100% by construction (`detectRegression` only flags below that threshold), tracked to catch any bypass of the gate.
- **Judge-vs-human agreement (Cohen's kappa)** — tracked per org over time; a declining kappa means the judge rubric needs tightening, a leading indicator worth surfacing before it erodes trust in judge-only runs.

## Governance / safety

- **Promotions auto-blocked vs. approved-with-override** — a healthy ratio means the gate is catching real regressions without excessive false positives forcing overrides.
- **Guardrail block rate in production** (guardrail_logs where decision='block' / total checks) — sudden spikes indicate either a real safety incident or an overly strict policy; both are worth an alert.
- **Median time from promotion request to decision** — governance shouldn't become a bottleneck; this is the metric that would catch it if it does.

## Retention / expansion

- **Features registered per org over time** — expansion within an existing org (more of their surface area under eval) is a stronger signal than raw seat count for a tool like this.
- **Orgs with an active guardrail policy in production** — the runtime half of the product; an org using eval only, never guardrails, is under-realizing the product's governance thesis.
