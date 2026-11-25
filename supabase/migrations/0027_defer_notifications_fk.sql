-- Same timing issue as activities_lead_id_fkey (0016): handle_lead_status_change()
-- is a BEFORE INSERT trigger on leads that calls create_notification(), which
-- inserts into notifications referencing the new lead's id before that lead
-- row actually exists in the table, violating the (non-deferrable) FK.
alter table public.notifications
  alter constraint notifications_lead_id_fkey deferrable initially deferred;
