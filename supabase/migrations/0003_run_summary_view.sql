-- Per-run rollup used by the runs list, run detail, and dashboards, so we
-- aren't doing N+1 aggregation queries from the app. security_invoker makes
-- the view respect the querying user's RLS on the underlying tables rather
-- than the view owner's — required on every RLS-protected view here.

create view eval_run_summary
with (security_invoker = true)
as
select
  r.id as run_id,
  r.org_id,
  r.project_id,
  r.project_version_id,
  r.suite_id,
  r.dataset_version_id,
  r.status,
  r.triggered_by,
  r.created_at,
  r.completed_at,
  count(c.id) as total_cases,
  count(c.id) filter (where c.verdict = 'pass') as pass_count,
  count(c.id) filter (where c.verdict = 'watch') as watch_count,
  count(c.id) filter (where c.verdict = 'block') as block_count,
  count(c.id) filter (where c.verdict = 'pending') as pending_count,
  avg(c.score) filter (where c.score is not null) as avg_score
from eval_runs r
left join eval_case_results c on c.run_id = r.id
group by r.id;
