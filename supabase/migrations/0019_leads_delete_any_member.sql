-- Any active team member can now remove leads from the table (Remove
-- All / Remove one), matching who can insert/update leads. Previously
-- this was admin-only, which would have silently blocked the delete
-- buttons for regular BDOs.
drop policy if exists leads_delete on leads;
create policy leads_delete on leads for delete using (is_active_member());
