-- Allow removing a created event. Leads that belonged to it are kept but
-- unlinked (event_id set to null) instead of blocking the delete.
alter table leads drop constraint if exists leads_event_id_fkey;
alter table leads
  add constraint leads_event_id_fkey foreign key (event_id) references events (id) on delete set null;

create policy events_delete on events for delete using (is_active_member());
