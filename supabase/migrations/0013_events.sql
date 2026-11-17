create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_date date not null,
  end_date date,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

alter table events enable row level security;
create policy events_select on events for select using (is_active_member());
create policy events_insert on events for insert with check (is_active_member());

alter table leads add column if not exists event_id uuid references events (id);
create index if not exists leads_event_id_idx on leads (event_id);
