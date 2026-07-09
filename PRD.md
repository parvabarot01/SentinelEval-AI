# Product Requirements Document — SentinelEval v1

## Problem

Teams shipping LLM-powered features have no reliable, repeatable way to answer two questions:

1. **Does this actually work?** Prompt and model changes ship on vibes — a manual spot-check by whoever wrote the prompt, with no regression safety net.
2. **Will it misbehave in production?** There's no systematic runtime check for PII leakage, off-topic answers, or ungrounded claims before a response reaches a user.

The result: quality regressions ship silently, unsafe outputs reach production, and when something goes wrong there's no audit trail of what was tested, blocked, or promoted — a real problem the moment a regulated customer or an internal compliance team asks "prove this was evaluated."

## Solution

SentinelEval unifies three things that are normally three separate tools (a spreadsheet, an observability vendor, a guardrails product) into one governed system:

- **Evaluation** — versioned datasets and suites, scored three ways (LLM-as-judge, programmatic checks, human review), with regression tracking across feature versions.
- **Guardrails** — an inline pre/post-response check endpoint the customer's own backend calls before serving a response.
- **Governance** — a regression gate on every promotion between environments, and a full audit trail on every suite mutation, guardrail block, and promotion decision.

## v1 scope (what's built)

| Area | Capability |
|---|---|
| Multi-tenancy | Organizations, role-based membership (owner/admin/engineer/reviewer/viewer), RLS-enforced isolation on every table |
| Feature registry | Register an LLM feature; version its prompt/model/temperature config per environment (dev/staging/prod) |
| Datasets | Versioned test cases (input + optional expected output/reference), tagged, copy-forward between versions |
| Suites | Named sets of criteria (rubrics), each scored by LLM judge, a programmatic check (JSON schema / regex / keyword / groundedness / PII), or routed to human review |
| Eval runs | Async execution (Upstash QStash) of a suite against a feature version and dataset version; per-case results persisted with rationale |
| Scoring | Groq-backed LLM-as-judge with structured verdicts; programmatic checks; a review queue for human-scored criteria |
| Regression tracking | Per-suite score trend across runs; two-proportion z-test flags a statistically meaningful drop, not noise |
| Guardrails | Policy builder (per feature, per check kind); API-key-authenticated inline check endpoint returning allow/block/flag; full activity log |
| Governance | Promotion requests auto-compare candidate vs. currently-deployed version per suite; regressions auto-block; admin/owner approval required to go live, with full audit trail |
| AI decision layer | "Why did this run get blocked, and which criterion is driving it?" — grounded strictly in that run's actual scores |
| Executive view | Dashboard home: hero billboard surfaces the single highest-severity unresolved item; reliability scorecard tiles one per feature |

## Out of scope for v1 (see ROADMAP.md)

- Email/Slack invite flow for org membership (membership exists and is RLS-enforced; self-serve invite UI is deferred)
- SSO/SAML
- Per-criterion custom judge prompts beyond name/description
- Multi-region / self-hosted deployment
- Usage-based billing enforcement (pricing model is defined in PRICING_STRATEGY.md; metering isn't wired yet)

## Success criteria

See KPI_FRAMEWORK.md and NORTH_STAR_METRIC.md. In short: an eval suite that catches a regression before it ships is the core value moment, and time-to-first-suite-run is the core activation metric.
