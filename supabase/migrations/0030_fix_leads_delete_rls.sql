-- The delete policy only allowed whoever originally created a lead to
-- delete it. Once a lead is reassigned to someone else (via the Assignee
-- dropdown) or has a different owner, that person's Remove/Remove All click
-- silently deleted nothing — no error, the row just never matched the
-- policy. Bring delete in line with the existing select/update policies,
-- which already allow the owner and current assignee too.
drop policy if exists leads_delete on public.leads;
create policy leads_delete on public.leads
  for delete
  using (is_admin() or created_by = auth.uid() or owner_id = auth.uid() or assigned_to = auth.uid());
