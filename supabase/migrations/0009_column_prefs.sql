-- Per-user column order/visibility preference for the leads table.

create table if not exists lead_table_prefs (
  owner_id uuid primary key references profiles (id) on delete cascade,
  columns jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table lead_table_prefs enable row level security;

create policy lead_table_prefs_all on lead_table_prefs for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
