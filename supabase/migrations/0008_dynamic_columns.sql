-- Simplify lead sources to LinkedIn / Prem Sir / Own, add the new lead
-- detail columns the team actually tracks, and let any team member add
-- extra custom columns that show up across the leads tables.

alter type lead_source add value if not exists 'linkedin';
alter type lead_source add value if not exists 'prem_sir';
alter type lead_source add value if not exists 'own';

alter table leads add column if not exists about_company text;
alter table leads add column if not exists about_person text;
alter table leads add column if not exists solutions text;
alter table leads add column if not exists products text;
alter table leads add column if not exists ai_synergy text;
alter table leads add column if not exists applications text;
alter table leads add column if not exists partners text;
alter table leads add column if not exists annual_revenue text;
alter table leads add column if not exists custom_fields jsonb not null default '{}'::jsonb;

create table if not exists lead_field_defs (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  position integer not null default 0,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

alter table lead_field_defs enable row level security;

create policy lead_field_defs_select on lead_field_defs for select using (is_active_member());
create policy lead_field_defs_insert on lead_field_defs for insert with check (is_active_member());
create policy lead_field_defs_delete on lead_field_defs for delete using (is_active_member());

create or replace function update_lead_custom_field(p_lead_id uuid, p_key text, p_value text)
returns void
language plpgsql
security invoker
as $$
begin
  update leads
  set custom_fields = jsonb_set(coalesce(custom_fields, '{}'::jsonb), array[p_key], to_jsonb(p_value), true)
  where id = p_lead_id;
end;
$$;
