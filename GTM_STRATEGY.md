# Go-to-Market Strategy

## Wedge

Self-serve, zero-cost entry for a single engineer or small team already shipping an LLM feature without a real eval process. The wedge is narrow on purpose: register one feature, build one suite, run it once, see a real score. That's the entire activation loop (see NORTH_STAR_METRIC.md), and it should take under fifteen minutes from signup.

## Who buys first

The ML/AI Engineer and AI/ML Product Manager personas are the entry point — they feel the pain (no regression safety net) directly and can adopt without procurement. The Compliance/Risk Officer and Executive personas become the expansion motion *inside* an account once a few features are already under eval: they're the ones who ask for the audit trail and the reliability scorecard once the tool is already load-bearing for the engineering team.

## Motion

1. **Self-serve signup, no sales touch** for the initial wedge — matches the zero-cost architecture (see PRICING_STRATEGY.md) and the persona's expectation of a normal dev-tool trial.
2. **Land on one feature, expand to the org's full surface area.** The product is designed so a second and third registered feature is a natural next step (shared suites/rubrics can be reused across features), not a re-onboarding.
3. **Guardrails as the retention hook.** Eval alone is a pre-ship tool that can be used sporadically; once a team wires the guardrail-check endpoint into their production backend, SentinelEval becomes load-bearing infrastructure, not an occasional tab.
4. **Governance as the expansion trigger.** Once guardrails are live and more than one person can promote a version, the regression gate and approval workflow become genuinely necessary — this is the natural point where a second seat (an approver) gets added.

## Positioning statement

For engineering teams shipping LLM features without a reliable safety net, SentinelEval is the evaluation-and-guardrail platform that catches regressions before they ship and blocks unsafe output at runtime — unlike stitching together a spreadsheet, an observability vendor, and a separate guardrails product, SentinelEval keeps eval results, guardrail decisions, and promotion governance in one system with one audit trail.

## Channels (v1, zero-cost-compatible)

- Technical content demonstrating the regression-gate mechanic concretely (a real before/after score drop, a real auto-block) — the product's core moment is demoable in under a minute and is the strongest marketing asset available without any ad spend.
- Open developer communities where the personas already are (not paid channels, consistent with the zero-dollar build constraint carrying into zero-dollar early GTM).
- Direct outreach to teams known to be building LLM features without an eval process — not a mass campaign, a targeted list.
