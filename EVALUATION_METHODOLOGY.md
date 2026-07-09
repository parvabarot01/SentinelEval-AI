# Evaluation Methodology

## Scoring methods

Every rubric (`rubrics` table) declares exactly one `criterion_type`, each scored differently:

### LLM-as-judge (`llm_judge`)

`src/lib/groq.ts#judgeCase` sends the judge model (Groq, `llama-3.3-70b-versatile`) the criterion name, its description, the input, the candidate output, and — if present — the reference/expected output. The judge responds with structured JSON (`response_format: json_object`) containing:

- `score` — 0 to 1
- `passed` — boolean
- `rationale` — 1–3 sentences, surfaced verbatim in the run detail's judge-rationale panel

Temperature is pinned to 0 for judge calls specifically, to keep repeat runs of the same version comparable — variance in the judge itself would otherwise be indistinguishable from a real regression.

### Programmatic checks (`programmatic`)

Deterministic, no model call except where the check itself requires judgment:

| Kind | Logic |
|---|---|
| `json_schema` | `JSON.parse` succeeds → pass. (Full schema validation beyond well-formedness is a documented v2 gap — see ROADMAP.md.) |
| `regex` | Configured pattern tested against output; a match is a *failure* for this check (used for "must not contain X") |
| `keyword` | Case-insensitive substring match against a configured block-list; a match is a failure |
| `groundedness` | Delegated to the judge model with a groundedness-specific system prompt, comparing output against the supplied reference — judgment is required, but the check kind is still "programmatic" in the sense that it's a fixed, non-configurable determination, not an open rubric |
| `pii` | Delegated to the judge model to detect names, emails, phone numbers, addresses, SSNs, card numbers |

### Human review (`human`)

The job worker (`src/app/api/jobs/run-eval/route.ts`) parks a `pending` result and creates a `human_review_queue` row instead of scoring automatically. A reviewer completes it via `/review`: **accept** (score 1), **edit/partial** (score 0.5, or a custom score), or **reject** (score 0) — with optional notes that become the result's rationale.

## Inter-rater agreement

`src/lib/stats.ts#cohensKappa` computes agreement beyond chance between judge and human pass/fail decisions on the same cases — a raw "% agreement" is misleading when most cases are easy passes, since two random raters would already agree often by chance. Kappa corrects for that.

## Confidence intervals

`wilsonConfidenceInterval` computes a Wilson score interval on any pass-rate proportion — chosen over the normal approximation because it stays well-behaved at the small sample sizes eval datasets realistically have (it doesn't produce an interval outside [0,1], unlike the normal approximation).

## Regression significance

`detectRegression` runs a two-proportion z-test comparing a baseline version's pass rate to a candidate version's pass rate on the *same suite*. A regression is flagged only when both:

1. The drop exceeds `minDelta` (default 3 percentage points), and
2. `p < 0.05` (two-tailed, using a standard-normal CDF via an Abramowitz-Stegun erf approximation, since `simple-statistics` doesn't ship one)

Both conditions matter: (1) alone would flag noise on small datasets; (2) alone would flag trivial, practically-meaningless drops on very large datasets. This is the check that feeds the promotion governance regression gate (see ARCHITECTURE.md).

## Guardrail taxonomy

Guardrail checks reuse the same `checkGuardrailText` logic as programmatic eval checks, applied inline to production traffic instead of a batch dataset:

- **pre** direction — checked before the feature's own model call (e.g., is the incoming request itself asking for something the policy blocks)
- **post** direction — checked on the generated response before it reaches the user

A `keyword`/`regex`/`pii` failure is a hard **block**; a `groundedness` failure is a softer **flag** (surfaced, logged, but not necessarily blocking) — reflecting that groundedness is inherently more judgment-dependent than a literal keyword or PII match. See `src/app/api/guardrails/check/route.ts`.
