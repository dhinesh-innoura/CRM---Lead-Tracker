-- Permanent fix for the class of bug behind 0016 and 0027: any BEFORE INSERT
-- trigger on leads that inserts into a child table referencing the new
-- lead's id will fail its FK check, because the lead row doesn't exist yet
-- while that trigger is running. activities and notifications were fixed
-- one at a time as triggers started touching them; make every table that
-- references leads(id) deferrable up front so a future trigger can't hit
-- this again.
alter table public.lead_contacts
  alter constraint lead_contacts_lead_id_fkey deferrable initially deferred;

alter table public.responses
  alter constraint responses_lead_id_fkey deferrable initially deferred;

alter table public.meetings
  alter constraint meetings_lead_id_fkey deferrable initially deferred;

alter table public.follow_ups
  alter constraint follow_ups_lead_id_fkey deferrable initially deferred;

alter table public.event_leads
  alter constraint event_leads_lead_id_fkey deferrable initially deferred;
