-- Queue items are created unassigned (assigned_to null) — any reviewer in the
-- org should be able to claim and complete one, not just whoever it was
-- pre-assigned to. The original policy only covered the pre-assigned case,
-- which meant a plain 'reviewer' role (not engineer/admin/owner) could never
-- complete an unclaimed item.

drop policy "reviewers complete their assignments" on human_review_queue;

create policy "reviewers complete or claim queue items" on human_review_queue
  for update
  using (assigned_to = auth.uid() or assigned_to is null)
  with check (assigned_to = auth.uid());

-- Completing a review also writes the score onto eval_case_results, but the
-- table's generic "org engineers update" policy only covers engineer/admin/
-- owner — a plain 'reviewer' role couldn't otherwise ever score a human
-- criterion, which is the entire point of the role.
create policy "reviewers score human results" on eval_case_results
  for update
  using (method = 'human' and org_role_of(org_id) in ('reviewer', 'engineer', 'admin', 'owner'))
  with check (method = 'human' and org_role_of(org_id) in ('reviewer', 'engineer', 'admin', 'owner'));
