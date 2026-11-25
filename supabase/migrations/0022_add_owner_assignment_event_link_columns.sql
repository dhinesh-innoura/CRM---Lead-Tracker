-- The app code references leads.owner_id, leads.assigned_by, leads.assigned_at,
-- and an event_leads join table that were never actually migrated in, causing
-- "column/table does not exist" failures on lead create/import/assign. Add them.
alter table leads add column if not exists owner_id uuid references profiles (id);
alter table leads add column if not exists assigned_by uuid references profiles (id);
alter table leads add column if not exists assigned_at timestamptz;

update leads set owner_id = created_by where owner_id is null;

create index if not exists leads_owner_id_idx on leads (owner_id);

create table if not exists event_leads (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  lead_id uuid not null references leads (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (event_id, lead_id)
);

alter table event_leads enable row level security;
create policy event_leads_select on event_leads for select using (is_active_member());
create policy event_leads_insert on event_leads for insert with check (is_active_member());
create policy event_leads_delete on event_leads for delete using (is_active_member());

-- default privileges from 0015_grant_all_tables.sql apply select/insert/update/delete
-- to authenticated automatically for this new table, but grant explicitly to be safe.
grant select, insert, update, delete on event_leads to authenticated;
