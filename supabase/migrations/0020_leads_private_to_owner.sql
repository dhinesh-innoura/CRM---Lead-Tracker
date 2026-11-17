-- Leads should now only be visible to the person who imported/entered them
-- (or whoever they're assigned to), not the whole team. Admins still see
-- everything for Reports & Analytics / Audit Log.
drop policy if exists leads_select on leads;
drop policy if exists leads_update on leads;
drop policy if exists leads_delete on leads;

create policy leads_select on leads for select
  using (is_admin() or created_by = auth.uid() or assigned_to = auth.uid());

create policy leads_update on leads for update
  using (is_admin() or created_by = auth.uid() or assigned_to = auth.uid());

create policy leads_delete on leads for delete
  using (is_admin() or created_by = auth.uid());

-- A lead's activity log and meetings should follow the same visibility as
-- the lead itself, instead of being visible to every active member.
create or replace function owns_lead(p_lead_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select is_admin() or exists (
    select 1 from leads l
    where l.id = p_lead_id and (l.created_by = auth.uid() or l.assigned_to = auth.uid())
  );
$$;

drop policy if exists activities_select on activities;
create policy activities_select on activities for select using (owns_lead(lead_id));

drop policy if exists meetings_all on meetings;
create policy meetings_select on meetings for select using (owns_lead(lead_id));
create policy meetings_insert on meetings for insert with check (owns_lead(lead_id));
create policy meetings_update on meetings for update using (owns_lead(lead_id));
create policy meetings_delete on meetings for delete using (owns_lead(lead_id));
