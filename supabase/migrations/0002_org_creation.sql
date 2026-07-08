-- Self-serve org creation. Plain INSERT policies on organizations/org_members
-- can't express "create the org and become its first owner in one step"
-- because org_members' write policy requires an existing owner/admin — which
-- doesn't exist yet for a brand new org. A SECURITY DEFINER function sidesteps
-- that chicken-and-egg problem for this one, narrow, intentional case.

create or replace function create_organization(org_name text, org_slug text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into organizations (name, slug) values (org_name, org_slug)
  returning id into new_org_id;

  insert into org_members (org_id, user_id, role) values (new_org_id, auth.uid(), 'owner');

  insert into audit_log (org_id, actor_id, action, entity_type, entity_id, after)
  values (new_org_id, auth.uid(), 'org.created', 'organization', new_org_id, jsonb_build_object('name', org_name, 'slug', org_slug));

  return new_org_id;
end;
$$;

revoke all on function create_organization(text, text) from public;
grant execute on function create_organization(text, text) to authenticated;
