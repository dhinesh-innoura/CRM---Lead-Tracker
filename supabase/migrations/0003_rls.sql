-- Row Level Security: any authenticated team member (profile with is_active)
-- can read/write shared data; admins get elevated rights for team management.

alter table profiles enable row level security;
alter table leads enable row level security;
alter table lead_contacts enable row level security;
alter table activities enable row level security;
alter table responses enable row level security;
alter table meetings enable row level security;
alter table follow_ups enable row level security;
alter table notifications enable row level security;
alter table import_batches enable row level security;

create or replace function is_active_member()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and is_active = true
  );
$$;

create or replace function is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin' and is_active = true
  );
$$;

-- profiles: everyone active can read all profiles (for assignment dropdowns);
-- only admins can insert/update/delete other profiles; a user can update their own row.
create policy profiles_select on profiles for select using (is_active_member());
create policy profiles_update_self on profiles for update using (id = auth.uid());
create policy profiles_admin_all on profiles for all using (is_admin()) with check (is_admin());

-- leads: shared visibility for all active members
create policy leads_select on leads for select using (is_active_member());
create policy leads_insert on leads for insert with check (is_active_member());
create policy leads_update on leads for update using (is_active_member());
create policy leads_delete on leads for delete using (is_admin());

create policy lead_contacts_all on lead_contacts for all
  using (is_active_member()) with check (is_active_member());

create policy activities_select on activities for select using (is_active_member());
create policy activities_insert on activities for insert with check (is_active_member());

create policy responses_all on responses for all
  using (is_active_member()) with check (is_active_member());

create policy meetings_all on meetings for all
  using (is_active_member()) with check (is_active_member());

create policy follow_ups_all on follow_ups for all
  using (is_active_member()) with check (is_active_member());

create policy notifications_select on notifications for select using (recipient_id = auth.uid());
create policy notifications_update on notifications for update using (recipient_id = auth.uid());
create policy notifications_insert on notifications for insert with check (is_active_member());

create policy import_batches_all on import_batches for all
  using (is_active_member()) with check (is_active_member());

-- Auto-create a profile row when a new auth user is created (magic-link signup)
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email,
    case
      when lower(new.email) in ('dhinesh@aivision360.com', 'sujitha@aivision360.com')
        then coalesce(new.raw_user_meta_data ->> 'requested_role', 'admin')::user_role
      else 'bdo'
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function handle_new_user();
