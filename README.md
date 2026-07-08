# SentinelEval

Enterprise LLM evaluation and guardrail platform. Define, run, and monitor
evaluation suites for LLM-powered features — LLM-as-judge scoring, programmatic
checks, human review, regression tracking across versions, and inline
production guardrails, all in one governed system.

## Why

Teams shipping GenAI features have no reliable way to answer "does this
actually work, and will it misbehave in production?" Most rely on vibes-based
prompt tweaking and manual spot-checks, with no regression safety net and no
audit trail. SentinelEval unifies pre-ship evaluation and runtime guardrails
with a governance layer over both.

## Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Data:** Supabase (Postgres, Auth, Storage, Row-Level Security)
- **Queue:** Upstash Redis + QStash for async eval runs and rate limiting
- **Stats:** `simple-statistics` for inter-rater agreement and confidence intervals
- **AI:** Groq (Llama 3.3 70B) for judge scoring, guardrail checks, and rationale generation

See `ARCHITECTURE.md` for the full schema and API design, and
`DESIGN_SYSTEM.md` for the visual language.

## Getting started

```bash
npm install
cp .env.local.example .env.local   # fill in your own Supabase / Groq / Upstash keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project docs

- `PRD.md`, `PERSONAS.md`, `COMPETITIVE_ANALYSIS.md`
- `ROADMAP.md`, `KPI_FRAMEWORK.md`, `NORTH_STAR_METRIC.md`
- `EVALUATION_METHODOLOGY.md`, `ARCHITECTURE.md`
- `GTM_STRATEGY.md`, `PRICING_STRATEGY.md`
- `BACKLOG.md`, `EXECUTIVE_SUMMARY.md`
