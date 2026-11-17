alter table leads add column if not exists is_active_lead boolean not null default false;
create index if not exists leads_is_active_lead_idx on leads (is_active_lead);
