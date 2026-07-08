-- Org-scoped API keys, used to authenticate the inline guardrail-check
-- endpoint from the customer's own backend — that call has no browser
-- session, so it can't ride the normal cookie-based RLS path. Only the
-- SHA-256 hash is stored; the plaintext key is shown once, at creation.

create table api_keys (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  key_hash text not null unique,
  key_prefix text not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  last_used_at timestamptz,
  revoked_at timestamptz
);

create index api_keys_org_idx on api_keys(org_id);
create index api_keys_hash_idx on api_keys(key_hash);

alter table api_keys enable row level security;

create policy "org members read api keys" on api_keys
  for select using (is_org_member(org_id));

create policy "org admins manage api keys" on api_keys
  for all using (org_role_of(org_id) in ('owner', 'admin'))
  with check (org_role_of(org_id) in ('owner', 'admin'));
