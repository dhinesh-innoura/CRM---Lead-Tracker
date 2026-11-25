-- Migration 0022: Remove admin role configurations and dual accounts for Dhinesh and Sujitha.
-- Consolidates all accounts into standard BDO team member accounts and removes duplicate admin accounts.

create extension if not exists pgcrypto;

do $$
declare
  v_user_password text := 'Tracker360!';
  v_pair record;
  v_primary_id uuid;
  v_duplicate_id uuid;
begin
  -- 1. Merge dual accounts for Dhinesh and Sujitha:
  -- Base email (dhinesh@aivision360.com / sujitha@aivision360.com) becomes the single BDO account.
  -- The temporary duplicate (dhinesh.user@aivision360.com / sujitha.user@aivision360.com) is merged and removed.
  for v_pair in
    select * from (
      values
        ('dhinesh@aivision360.com', 'dhinesh.user@aivision360.com', 'Dhinesh'),
        ('sujitha@aivision360.com', 'sujitha.user@aivision360.com', 'Sujitha')
    ) as t(base_email, user_email, member_name)
  loop
    select id into v_primary_id from auth.users where email = v_pair.base_email;
    select id into v_duplicate_id from auth.users where email = v_pair.user_email;

    -- If primary exists, ensure its password is the standard password and role is 'bdo'
    if v_primary_id is not null then
      update auth.users
      set encrypted_password = crypt(v_user_password, gen_salt('bf'))
      where id = v_primary_id;

      update public.profiles
      set role = 'bdo', full_name = v_pair.member_name, is_active = true
      where id = v_primary_id;
    end if;

    -- If duplicate user account exists, reassign data to primary account
    if v_duplicate_id is not null and v_primary_id is not null then
      update public.leads set created_by = v_primary_id where created_by = v_duplicate_id;
      update public.leads set assigned_to = v_primary_id where assigned_to = v_duplicate_id;
      update public.activities set actor_id = v_primary_id where actor_id = v_duplicate_id;
      update public.meetings set created_by = v_primary_id where created_by = v_duplicate_id;
      update public.responses set recorded_by = v_primary_id where recorded_by = v_duplicate_id;
      update public.notifications set recipient_id = v_primary_id where recipient_id = v_duplicate_id;

      -- Remove the duplicate profile and auth user
      delete from public.profiles where id = v_duplicate_id;
      delete from auth.users where id = v_duplicate_id;
    elsif v_duplicate_id is not null and v_primary_id is null then
      -- If only duplicate exists, convert it to the base email
      update auth.users
      set email = v_pair.base_email, encrypted_password = crypt(v_user_password, gen_salt('bf'))
      where id = v_duplicate_id;

      update public.profiles
      set email = v_pair.base_email, role = 'bdo', full_name = v_pair.member_name, is_active = true
      where id = v_duplicate_id;
    end if;
  end loop;

  -- 2. Ensure all other profiles with role 'admin' are updated to 'bdo'
  update public.profiles
  set role = 'bdo'
  where role = 'admin';
end;
$$;

-- 3. Update handle_new_user() trigger function to never assign 'admin' role
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email,
    'bdo'
  )
  on conflict (id) do update
  set role = 'bdo';
  return new;
end;
$$;

-- 4. (Intentionally not widening profiles_admin_all to is_active_member(): that
-- would let any active BDO select/insert/update/delete any profile, including
-- role escalation and deleting other accounts. profiles_admin_all stays
-- admin-gated; profiles_update_self plus the protect_profile_privileges
-- trigger (0017) already let every user manage their own non-privileged
-- fields, which covers the actual need here.
