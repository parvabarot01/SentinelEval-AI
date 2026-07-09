# Executive Summary

**SentinelEval** is an evaluation and guardrail platform for teams shipping LLM-powered features. It answers the two questions every team building with LLMs eventually gets asked and rarely has a good answer for: *does this actually work*, and *will it misbehave in production*.

## What's built (this pass)

The full loop, end to end, in one governed system:

**Register → Evaluate → Track → Gate → Guard → Report**

A team registers an LLM feature and versions its prompt/model config per environment. They build a versioned test dataset and a suite of scoring criteria — each criterion scored by an LLM judge, a deterministic programmatic check, or routed to a human reviewer. Runs execute asynchronously and produce per-case results with rationale. Scores are tracked across versions with real statistical rigor (a two-proportion significance test, not a raw delta), so a promotion between environments is automatically compared against what's currently live and **auto-blocked** if it regresses — an admin has to explicitly approve an override, and that decision is permanently audit-logged. In production, the same checks run inline via a guardrail endpoint the team's own backend calls before serving a response. An executive dashboard rolls all of it up into a single reliability scorecard.

## Why it's built this way

Every architectural choice traces back to one constraint: **zero ongoing cost** (Supabase, Vercel, Upstash, and Groq free tiers), and one product thesis: **evaluation and guardrails should share one schema and one audit trail**, not live in three disconnected tools. See ARCHITECTURE.md for the technical detail and PRICING_STRATEGY.md for why paid tiers, when they exist, will gate scale and compliance features — never the core safety mechanic.

## Current state

All three originally-planned sprints' worth of scope are implemented and wired against real Supabase/Groq/Upstash calls. What's **not** done yet, deliberately: live external service credentials aren't connected in this pass — the codebase is the real, final implementation (real queries, real RLS, real API calls), gated behind environment variables the user will supply. See CLAUDE.md (local-only) and README.md for exactly what's needed to go live.

## What's next

See ROADMAP.md — the highest-priority items are a self-serve org invite flow, alerting on guardrail blocks and auto-blocked promotions, and chunked eval-run execution so large datasets don't bump into the free-tier serverless function duration ceiling.
