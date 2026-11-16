-- Saved custom filters for the leads list

create table saved_filters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references profiles (id) on delete cascade,
  query jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table saved_filters enable row level security;

create policy saved_filters_select on saved_filters for select using (owner_id = auth.uid());
create policy saved_filters_insert on saved_filters for insert with check (owner_id = auth.uid());
create policy saved_filters_delete on saved_filters for delete using (owner_id = auth.uid());

-- Bulk update RPCs (kept server-side as single statements rather than N round trips)

create or replace function bulk_update_status(p_lead_ids uuid[], p_status lead_status)
returns void
language plpgsql
security invoker
as $$
begin
  update leads set status = p_status where id = any(p_lead_ids);
end;
$$;

create or replace function bulk_update_assignment(p_lead_ids uuid[], p_assigned_to uuid)
returns void
language plpgsql
security invoker
as $$
begin
  update leads set assigned_to = p_assigned_to where id = any(p_lead_ids);
end;
$$;
