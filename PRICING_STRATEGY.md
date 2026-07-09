# Pricing Strategy

## v1: free, by architecture

The current build runs entirely on free tiers (Supabase, Vercel, Upstash Redis + QStash, Groq) — this isn't a promotional "free tier" of a paid product, it's the actual zero-dollar cost structure the whole system was built against (see project README/ARCHITECTURE.md for the specific free-tier ceilings each service imposes). There is no billing code in v1, intentionally: the immediate goal is proving the activation loop (see NORTH_STAR_METRIC.md), not monetization.

## Where a future paid tier would come from

Pricing should follow the same wedge-then-expand shape as the GTM motion, not be introduced ahead of it:

| Tier (future) | Unlocks | Rationale |
|---|---|---|
| **Free** | Everything currently built, within the underlying free-tier ceilings (Groq rate limits, Supabase row/storage limits, QStash message quota) | Keeps the activation loop frictionless; a team can fully evaluate the product's value before any payment conversation |
| **Team** | Higher throughput (a paid judge-model tier or dedicated Groq/model capacity), more seats, email/Slack alerting on guardrail blocks and regression gates | The point at which an org's usage naturally exceeds the free-tier ceiling is the natural upgrade trigger — not an arbitrary feature gate |
| **Enterprise** | SSO/SAML, custom data retention, dedicated regional deployment, SLA on the guardrail-check endpoint's latency | These map directly to the Compliance/Risk and Executive personas' actual asks, which only surface once an account has real production dependency on the guardrail endpoint |

## Principle

Never gate the core safety mechanic (the regression gate, the guardrail block) behind a paid tier — that would undercut the product's own thesis that safety shouldn't be optional. Paid tiers gate *scale and operational guarantees* (throughput, alerting, SLA, compliance features), not whether unsafe output gets blocked.

## What's deliberately not decided yet

Per-seat vs. usage-based pricing, and specific price points, are out of scope until real usage data exists (see KPI_FRAMEWORK.md's engagement metrics) — pricing a product with zero live usage data would be guessing, not strategy.
