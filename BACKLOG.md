# Backlog

All Sprint 1–3 scope was built in one continuous pass rather than three paused sprints. Items are tagged by the sprint they'd have belonged to under the original three-sprint plan, for traceability against PRD.md/ROADMAP.md.

## Sprint 1 — Foundation, datasets, suite builder

- [x] Design system foundation: tokens, fonts, motion, nav/hero/rail/card/gauge components
- [x] Multi-tenant schema + RLS (organizations, org_members, RBAC)
- [x] Auth (email/password) + self-serve org creation
- [x] Project/feature registry with versioned prompt/model config per environment
- [x] Dataset management: versioned datasets, test cases
- [x] Suite builder: judge / programmatic / human criteria
- [x] Audit log on every mutation

## Sprint 2 — Eval execution, scoring, regression tracking

- [x] Async eval run engine (QStash)
- [x] LLM-as-judge scoring (Groq, structured verdicts)
- [x] Programmatic checks (JSON schema well-formedness, regex, keyword, groundedness, PII)
- [x] Human review queue (accept/edit/reject)
- [x] Inter-rater agreement (Cohen's kappa), Wilson confidence intervals
- [x] Regression tracking: two-proportion z-test, per-suite score trend chart
- [x] Run detail drilldown (per-criterion breakdown, judge rationale)

## Sprint 3 — Guardrails, governance, executive layer

- [x] Guardrail policy builder + inline check endpoint (API-key authenticated) + activity log
- [x] Promotion governance: auto regression gate + admin/owner approval workflow
- [x] AI decision layer ("why did this run get blocked")
- [x] Executive dashboard home: hero billboard + reliability scorecard
- [x] Security hardening: headers, rate limiting, RLS gap fixes

## Deferred (see ROADMAP.md V2/V3 for the full list)

- [ ] Self-serve org invite flow (email/Slack)
- [ ] Full JSON schema validation (currently well-formedness only)
- [ ] Custom judge prompt per rubric
- [ ] Guardrail-block / auto-block alerting (email/Slack)
- [ ] Bulk dataset import (CSV/JSONL)
- [ ] Chunked eval-run execution for large dataset × rubric counts (free-tier function duration ceiling)
