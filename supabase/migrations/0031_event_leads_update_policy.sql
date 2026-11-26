-- event_leads only had select/insert/delete policies. Marking a lead active
-- for an event (toggleLeadActive's event_leads.is_active_lead update) was
-- silently blocked by row-level security — no policy matched UPDATE, so the
-- write affected zero rows with no error, and the button looked broken.
create policy event_leads_update on public.event_leads
  for update
  using (is_active_member())
  with check (is_active_member());
