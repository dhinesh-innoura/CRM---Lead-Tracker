-- "Mark Active" and delete on the Event Leads page were operating on the
-- shared master lead row, so marking/removing a lead there also changed it
-- everywhere else the same lead appears (Own Leads, Assigned Leads). Give
-- events their own "active" flag so it's scoped to that event only.
alter table public.event_leads add column if not exists is_active_lead boolean not null default false;
