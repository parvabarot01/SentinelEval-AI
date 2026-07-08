-- SentinelEval core schema
-- Multi-tenant via org_id + RLS. Every table scoped to an organization except
-- organizations/org_members themselves.

create extension if not exists "pgcrypto";

-- ── Organizations & membership ──────────────────────────────────────────────

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create type org_role as enum ('owner', 'admin', 'engineer', 'reviewer', 'viewer');

create table org_members (
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role org_role not null default 'engineer',
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

create index org_members_user_idx on org_members(user_id);

-- helper: is the current auth user a member of this org (and optionally at least `min_role`)
create or replace function is_org_member(check_org_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from org_members
    where org_id = check_org_id and user_id = auth.uid()
  );
$$;

create or replace function org_role_of(check_org_id uuid)
returns org_role
language sql
security definer
stable
as $$
  select role from org_members
  where org_id = check_org_id and user_id = auth.uid()
  limit 1;
$$;

alter table organizations enable row level security;
alter table org_members enable row level security;

create policy "members can read their org" on organizations
  for select using (is_org_member(id));

create policy "members can read their membership rows" on org_members
  for select using (is_org_member(org_id));

create policy "owners/admins manage membership" on org_members
  for all using (org_role_of(org_id) in ('owner', 'admin'))
  with check (org_role_of(org_id) in ('owner', 'admin'));

-- ── Projects (an LLM feature under test) & versioned config ────────────────

create table projects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  unique (org_id, slug)
);

create type project_environment as enum ('dev', 'staging', 'prod');

create table project_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  org_id uuid not null references organizations(id) on delete cascade,
  version_label text not null,
  environment project_environment not null default 'dev',
  system_prompt text not null default '',
  model text not null default 'llama-3.3-70b-versatile',
  temperature numeric not null default 0.2,
  config jsonb not null default '{}'::jsonb,
  is_current_for_env boolean not null default false,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create index project_versions_project_idx on project_versions(project_id, environment);

-- ── Eval datasets & test cases ──────────────────────────────────────────────

create table eval_datasets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  name text not null,
  description text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create table dataset_versions (
  id uuid primary key default gen_random_uuid(),
  dataset_id uuid not null references eval_datasets(id) on delete cascade,
  org_id uuid not null references organizations(id) on delete cascade,
  version_number int not null,
  note text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  unique (dataset_id, version_number)
);

create table test_cases (
  id uuid primary key default gen_random_uuid(),
  dataset_id uuid not null references eval_datasets(id) on delete cascade,
  dataset_version_id uuid not null references dataset_versions(id) on delete cascade,
  org_id uuid not null references organizations(id) on delete cascade,
  input text not null,
  expected_output text,
  reference text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index test_cases_dataset_version_idx on test_cases(dataset_version_id);

-- ── Eval suites & rubrics/criteria ──────────────────────────────────────────

create table eval_suites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create type criterion_type as enum ('llm_judge', 'programmatic', 'human');
create type programmatic_check_kind as enum ('json_schema', 'regex', 'keyword', 'groundedness', 'pii');

create table rubrics (
  id uuid primary key default gen_random_uuid(),
  suite_id uuid not null references eval_suites(id) on delete cascade,
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  description text,
  criterion_type criterion_type not null default 'llm_judge',
  programmatic_kind programmatic_check_kind,
  weight numeric not null default 1,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index rubrics_suite_idx on rubrics(suite_id);

-- ── Eval runs & results ──────────────────────────────────────────────────────

create type run_status as enum ('queued', 'running', 'completed', 'failed');

create table eval_runs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  project_version_id uuid not null references project_versions(id) on delete cascade,
  suite_id uuid not null references eval_suites(id) on delete cascade,
  dataset_version_id uuid not null references dataset_versions(id) on delete cascade,
  status run_status not null default 'queued',
  triggered_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index eval_runs_project_idx on eval_runs(project_id, created_at desc);
create index eval_runs_suite_idx on eval_runs(suite_id, created_at desc);

create type score_method as enum ('llm_judge', 'programmatic', 'human');
create type case_verdict as enum ('pass', 'watch', 'block', 'pending');

create table eval_case_results (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references eval_runs(id) on delete cascade,
  org_id uuid not null references organizations(id) on delete cascade,
  test_case_id uuid not null references test_cases(id) on delete cascade,
  rubric_id uuid not null references rubrics(id) on delete cascade,
  method score_method not null,
  score numeric,
  verdict case_verdict not null default 'pending',
  rationale text,
  raw_output text,
  reviewer_id uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index eval_case_results_run_idx on eval_case_results(run_id);
create index eval_case_results_rubric_idx on eval_case_results(rubric_id);

create type review_status as enum ('pending', 'completed');
create type review_decision as enum ('accept', 'edit', 'reject');

create table human_review_queue (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  run_id uuid not null references eval_runs(id) on delete cascade,
  test_case_id uuid not null references test_cases(id) on delete cascade,
  rubric_id uuid not null references rubrics(id) on delete cascade,
  assigned_to uuid references auth.users(id),
  status review_status not null default 'pending',
  decision review_decision,
  notes text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index human_review_queue_assignee_idx on human_review_queue(assigned_to, status);

-- ── Guardrails ───────────────────────────────────────────────────────────────

create type guardrail_direction as enum ('pre', 'post');
create type guardrail_decision as enum ('allow', 'block', 'flag');

create table guardrail_policies (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  checks jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create table guardrail_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  policy_id uuid references guardrail_policies(id) on delete set null,
  direction guardrail_direction not null,
  input text,
  output text,
  decision guardrail_decision not null,
  failing_checks jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index guardrail_logs_project_idx on guardrail_logs(project_id, created_at desc);

-- ── Promotion governance ─────────────────────────────────────────────────────

create type promotion_status as enum ('pending', 'approved', 'rejected', 'auto_blocked');

create table promotions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  from_version_id uuid references project_versions(id),
  to_version_id uuid not null references project_versions(id),
  environment project_environment not null,
  status promotion_status not null default 'pending',
  regression_summary jsonb not null default '{}'::jsonb,
  requested_by uuid references auth.users(id),
  decided_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create index promotions_project_idx on promotions(project_id, created_at desc);

-- ── Audit log ────────────────────────────────────────────────────────────────

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  actor_id uuid references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_org_idx on audit_log(org_id, created_at desc);

-- ── RLS: enable + standard "org member can read, engineer+ can write" policy ─

do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'projects', 'project_versions', 'eval_datasets', 'dataset_versions', 'test_cases',
      'eval_suites', 'rubrics', 'eval_runs', 'eval_case_results', 'human_review_queue',
      'guardrail_policies', 'guardrail_logs', 'promotions', 'audit_log'
    ])
  loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy "org members read" on %I for select using (is_org_member(org_id))', t
    );
    execute format(
      'create policy "org engineers write" on %I for insert with check (org_role_of(org_id) in (''owner'',''admin'',''engineer''))', t
    );
    execute format(
      'create policy "org engineers update" on %I for update using (org_role_of(org_id) in (''owner'',''admin'',''engineer'')) with check (org_role_of(org_id) in (''owner'',''admin'',''engineer''))', t
    );
    execute format(
      'create policy "org admins delete" on %I for delete using (org_role_of(org_id) in (''owner'',''admin''))', t
    );
  end loop;
end $$;

-- reviewers additionally need write access to human_review_queue for their own assignments
create policy "reviewers complete their assignments" on human_review_queue
  for update using (assigned_to = auth.uid()) with check (assigned_to = auth.uid());
