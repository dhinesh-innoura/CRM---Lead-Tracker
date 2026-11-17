-- The BEFORE INSERT trigger on leads logs an activity row referencing the
-- new lead's id before that row is actually written, so the FK check must
-- be deferred to the end of the transaction instead of running immediately.
alter table activities
  alter constraint activities_lead_id_fkey deferrable initially deferred;
