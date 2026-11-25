-- 0023_centralized_leads_and_events.sql (added by another session) reset
-- leads_select/update/delete back to is_active_member(), undoing the
-- explicit "leads are private to whoever created/is assigned to them"
-- requirement from 0020_leads_private_to_owner.sql. Restore it.
drop policy if exists leads_select on leads;
drop policy if exists leads_update on leads;
drop policy if exists leads_delete on leads;

create policy leads_select on leads for select
  using (is_admin() or created_by = auth.uid() or assigned_to = auth.uid() or owner_id = auth.uid());

create policy leads_update on leads for update
  using (is_admin() or created_by = auth.uid() or assigned_to = auth.uid() or owner_id = auth.uid());

create policy leads_delete on leads for delete
  using (is_admin() or created_by = auth.uid());
