# Roadmap

## v1 — shipped this build (see PROGRESS_LOG.md for the full technical log)

The complete loop end to end: register a feature → version its prompt/model config → build a dataset → build a suite → run it async → score it three ways (judge / programmatic / human) → track regressions across versions → gate promotion on a statistically real regression → enforce guardrails on production traffic → roll everything up into an executive scorecard, with a full audit trail throughout.

Everything in PRD.md's "v1 scope" table is built and wired against real Supabase/Groq/Upstash calls — pending the user connecting live credentials (this build deliberately stopped short of live external service connection; see CLAUDE.md).

## V2 — next

- **Org invite flow.** Membership and RBAC are fully modeled and RLS-enforced (`org_members`, five roles); what's missing is a self-serve email invite UI. Right now membership requires direct database action.
- **Deeper JSON schema validation.** The `json_schema` programmatic check currently verifies well-formedness only; validating against an actual configured schema (not just "is this valid JSON") is the natural next step.
- **Custom judge prompts per rubric.** The judge currently derives its instructions from a rubric's name + description; a power-user path to supply a fully custom judge prompt/scoring rubric per criterion would give more control for nuanced criteria.
- **Alerting.** Guardrail blocks and auto-blocked promotions currently surface only in-app (dashboard hero, rails). Email/Slack notification on these events is a natural retention feature once an org's usage is real.
- **SSO/SAML.** Needed before any real enterprise motion (see GTM_STRATEGY.md's enterprise tier).
- **Bulk dataset import** (CSV/JSONL upload) — right now test cases are added one at a time through the UI, fine for the activation loop but a real friction point at dataset sizes beyond a few dozen cases.

## V3 — later

- **Usage-based billing enforcement**, once PRICING_STRATEGY.md's paid tiers have real demand signal.
- **Multi-region / dedicated deployment** for enterprise data-residency requirements.
- **A judge-model marketplace** (multiple judge models, not just Groq's Llama 3.3 70B) — deferred because it adds real complexity (calibration across judges) that isn't worth it before the single-judge product has real usage.
- **Full agent/multi-step trace evaluation**, moving beyond single input→output scoring into evaluating an entire tool-calling trajectory — a meaningfully larger scope than v1's rubric-against-output model, intentionally deferred rather than half-built.

## Explicitly not planned

- Becoming a general observability platform (that's Arize Phoenix's and LangSmith's strength — see COMPETITIVE_ANALYSIS.md). SentinelEval's thesis is eval + guardrails + governance as one governed system, not tracing everything.
