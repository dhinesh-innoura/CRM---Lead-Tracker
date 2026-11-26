-- Table Customization and Saved Filters were stored one-per-user with no
-- notion of which page they belonged to, so customizing columns or saving a
-- filter on Own Leads also silently changed what you saw on Assigned Leads
-- and every Event Leads page (and vice versa) for that same user. Scope both
-- to the page (basePath, e.g. "/leads", "/leads/sir-given", "/events/<id>").

alter table public.lead_table_prefs drop constraint if exists lead_table_prefs_pkey;
alter table public.lead_table_prefs add column if not exists scope text not null default '/leads';
update public.lead_table_prefs set scope = '/leads' where scope is null;
alter table public.lead_table_prefs add primary key (owner_id, scope);

alter table public.saved_filters add column if not exists scope text not null default '/leads';
