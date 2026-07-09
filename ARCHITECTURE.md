# Architecture

## Stack

- **Frontend/API:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4. Hosted free on Vercel.
- **Data:** Supabase Postgres, with Row-Level Security on every org-scoped table. Auth via Supabase Auth (email/password).
- **Async queue:** Upstash QStash publishes eval-run jobs; the job worker runs as a signed-callback Next.js route handler.
- **Rate limiting:** Upstash Redis via `@upstash/ratelimit`, sliding window, applied to the two highest-traffic routes only (eval-run creation, guardrail check).
- **AI:** Groq (`llama-3.3-70b-versatile`) for LLM-as-judge scoring, PII/groundedness guardrail checks, the feature-under-test simulation, and the AI decision layer's rationale generation.
- **Stats:** `simple-statistics` plus a small custom layer (`src/lib/stats.ts`) for Cohen's kappa, Wilson confidence intervals, and a two-proportion z-test for regression significance.

## Multi-tenancy

Every domain table carries `org_id` and has RLS enabled. Two helper SQL functions (`is_org_member`, `org_role_of`, both `security definer`) back every policy. Five roles, ascending: `viewer < reviewer < engineer < admin < owner`. The generic pattern (see `supabase/migrations/0001_init.sql`'s final `do $$ ... $$` block) is: any org member can `select`; `engineer`+ can `insert`/`update`; `admin`+ can `delete`. Two tables need role-specific carve-outs beyond that generic pattern (see `0005_review_claim_fix.sql`):

- `human_review_queue` — a `reviewer` can claim and complete an *unassigned* item, not just one pre-assigned to them.
- `eval_case_results` — a `reviewer` can update rows where `method = 'human'` specifically, since the generic policy only covers `engineer`+.

Org creation is the one place RLS is deliberately bypassed: `create_organization(org_name, org_slug)` is a `security definer` Postgres function, because inserting the org row and the creator's `owner` membership row has to happen atomically before any RLS policy referencing that membership could otherwise allow it (a chicken-and-egg problem for a brand-new org).

## Schema (see `supabase/migrations/` for the authoritative DDL)

```
organizations ─┬─ org_members (role: owner|admin|engineer|reviewer|viewer)
               ├─ projects ─── project_versions (env: dev|staging|prod, is_current_for_env)
               ├─ eval_datasets ─── dataset_versions ─── test_cases
               ├─ eval_suites ─── rubrics (criterion_type: llm_judge|programmatic|human)
               ├─ eval_runs ─── eval_case_results (method, score, verdict, rationale)
               │                └─ human_review_queue (status, decision, notes)
               ├─ guardrail_policies (checks: jsonb[]) ─── guardrail_logs
               ├─ promotions (from/to project_version, status, regression_summary jsonb)
               ├─ api_keys (hashed, for the guardrail-check endpoint)
               └─ audit_log (actor, action, entity, before/after jsonb)
```

`eval_run_summary` is a `security_invoker` view aggregating `eval_case_results` per run (total/pass/watch/block/pending counts, average score) — used by the runs list, run detail, suite trend chart, and dashboard home, so those pages don't each hand-roll the same aggregation query.

## Eval run design

1. `POST /api/runs` validates the project version/suite/dataset version belong to the caller's org, inserts an `eval_runs` row (`status: queued`), audit-logs it, and publishes `{ runId }` to QStash targeting `/api/jobs/run-eval`.
2. QStash calls back into `/api/jobs/run-eval` with a signed payload, verified via `@upstash/qstash`'s `Receiver` (current + next signing key, for zero-downtime key rotation). This route runs on the Supabase **service-role** client (`src/lib/supabase/admin.ts`) since the callback carries no user session.
3. The worker sets `status: running`, loads the project version, every rubric in the suite, and every test case in the dataset version, then for each test case: calls the feature-under-test (Groq, using the version's system prompt/model/temperature), then scores that output against every rubric per its `criterion_type` (judge / programmatic / parked for human review).
4. On completion, `status: completed` and `completed_at` are set. Any unhandled error sets `status: failed` — a run never silently disappears.

**Known free-tier ceiling:** the worker scores every test case × rubric combination serially, in one function invocation. Vercel's free-tier function duration limit bounds how large a single run can practically be; a dataset/suite combination producing hundreds of judge calls should be chunked into multiple QStash messages in a future pass rather than one long-running invocation. Noted here rather than silently exceeded.

## Guardrail-check design

`POST /api/guardrails/check` is the one endpoint meant to be called by the customer's own backend, not a browser — authenticated with a bearer API key (`api_keys.key_hash`, SHA-256, plaintext shown once at creation), not a Supabase session, and rate-limited (60/min per key). It loads all `is_active` policies for the given `project_id`, runs every configured check against the given text, and returns `{ decision: allow|block|flag, failingChecks }`. `keyword`/`regex`/`pii` failures block; `groundedness` failures flag (softer signal — see EVALUATION_METHODOLOGY.md). Every call is logged to `guardrail_logs` regardless of outcome, including allows, so guardrail activity has a complete history, not just an exception log.

## Promotion governance design

`POST /api/promotions` compares the candidate version against whichever version currently has `is_current_for_env = true` for the requested environment, per suite that both versions have a completed run for, using `detectRegression` (two-proportion z-test, see EVALUATION_METHODOLOGY.md). Any suite regression sets the promotion to `auto_blocked`; otherwise `pending`. `PATCH /api/promotions/[id]` (admin/owner only) approves (flips `is_current_for_env` on the project_versions rows) or rejects, always audit-logged with the full before/after promotion row.

## Security

- RLS on every org-scoped table (see above).
- Zod validation on every API route's input.
- Rate limiting on the two highest-traffic routes (eval-run creation, guardrail check) — the ones the plan specifically calls out as load-bearing.
- Security headers set globally in `next.config.ts` (CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy).
- Secrets only ever read from environment variables (`.env.local.example` documents every one required); nothing is hardcoded.
- Full audit trail on every suite/dataset mutation, guardrail decision, and promotion decision (`audit_log`).

## Free-tier ceilings to watch (note, not silently exceed)

- **Groq:** free-tier rate limits will throttle large eval runs (many test cases × many judge criteria) — see the chunking note above.
- **Supabase free tier:** row and storage limits; `audit_log` and `eval_case_results` are the fastest-growing tables and are the first to watch.
- **Upstash QStash free tier:** message-count ceiling; each eval run is currently one message regardless of dataset size (see chunking note).
- **Vercel free tier:** serverless function duration cap bounds the largest single eval run the worker can complete in one invocation.
