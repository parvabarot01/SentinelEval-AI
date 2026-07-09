# North Star Metric

## Weekly regression-catches: eval runs that flag a statistically significant score drop before a version reaches prod

**Definition:** count of eval runs, per week, where `detectRegression` (see `src/lib/stats.ts`) flags `isRegression = true` on at least one criterion, for a version that had not yet been promoted to `prod` at the time of the run.

## Why this metric, not another

- It's the moment the product's entire thesis pays off: a regression caught in staging is a regression that never reached a real user. Every other metric (runs/week, orgs active, suites created) is an input to this one, not the outcome itself.
- It's resistant to vanity inflation. Counting "eval runs" alone rewards busywork; counting "regressions caught before prod" only goes up when the tool is doing its actual job — and it can't be gamed by running suites that don't matter, because the metric requires a real, statistically significant drop.
- It ties directly to the guardrail and governance features too: a regression caught here is a promotion that gets auto-blocked in the governance layer, which is itself logged and auditable. The metric is traceable to a concrete row in `promotions` with `status = 'auto_blocked'`, not a self-reported survey number.

## Leading indicators that feed it

1. Features registered (nothing to evaluate without a registered feature)
2. Suites with at least one criterion (an empty suite can't fail)
3. Datasets with enough test cases for a statistically meaningful sample (the z-test's power depends on `total` — very small datasets rarely clear p < 0.05 even for a real regression)
4. Runs per version pair (need both a baseline and a candidate run on the same suite to compare)

## What "good" looks like over time

Early on, a healthy trajectory is a *rising* regression-catch rate as more suites and features onboard — that's adoption, not instability. Maturity looks like the catch rate stabilizing or declining per-feature as teams tighten their prompts in response to what the suite already caught, while the total addressable surface (features under active eval) keeps growing.
