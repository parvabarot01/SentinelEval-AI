# Personas

## AI/ML Product Manager — "is this safe to ship?"

Owns the roadmap for one or more LLM features. Doesn't write the prompts but signs off on shipping them. Needs a yes/no answer backed by evidence, not a raw log dump.

- **Primary screens:** dashboard home (hero billboard), governance
- **Core question:** "Did the last version regress on anything, and is it safe to promote?"
- **What SentinelEval gives them:** the regression gate's auto-block/pending decision, plus the AI decision layer's plain-English "why" when something's blocked.

## ML/AI Engineer — "run the suite, gate on the result"

Writes and iterates on prompts/model configs. Wants eval results in a normal engineering loop — run a suite, see per-criterion breakdown, fix what failed, re-run.

- **Primary screens:** suites, runs, run detail drilldown
- **Core question:** "Which criterion is failing, and on which specific inputs?"
- **What SentinelEval gives them:** per-rubric grouped results with judge rationale, failing-case drilldown, score trend across their own iteration history.

## Data Scientist / Applied Scientist — "is this score meaningful?"

Cares about the statistical defensibility of a score, not just the number. Distrusts a single-run pass rate with no context.

- **Primary screens:** run detail, governance (regression comparison)
- **Core question:** "Is a 4-point drop real, or noise from a 20-case dataset?"
- **What SentinelEval gives them:** a two-proportion z-test behind every regression flag (`src/lib/stats.ts`), not just a raw delta — a run is only flagged when p < 0.05, so promotion decisions don't churn on sampling noise.

## Compliance / Risk Officer — "prove it was tested"

Doesn't touch the day-to-day loop but is the one who gets asked, after an incident, "was this reviewed before it shipped." Needs an audit trail, not a dashboard.

- **Primary screens:** (reads exports from) audit_log, governance history, guardrail activity
- **Core question:** "Who approved this promotion, when, and what was the evidence?"
- **What SentinelEval gives them:** every suite mutation, guardrail decision, and promotion decision is written to `audit_log` with actor, before/after state, and timestamp — nothing is mutated silently.

## Executive — "one number for the whole portfolio"

Doesn't want per-criterion detail. Wants to know, across every LLM feature the company ships, what's healthy and what's at risk.

- **Primary screens:** dashboard home reliability scorecard
- **Core question:** "Which features are red right now, across the whole org?"
- **What SentinelEval gives them:** a wall of verdict-colored tiles, one per feature, each showing its most recent run's score — health readable from color alone before reading a single number.
