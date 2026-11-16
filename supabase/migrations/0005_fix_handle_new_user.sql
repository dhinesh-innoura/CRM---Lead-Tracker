-- Fix "Database error saving new user": the auth.users insert trigger runs
-- under the supabase_auth_admin role, whose search_path does not include
-- public, so unqualified table/type names inside the trigger function can
-- fail to resolve. Recreate with fully-qualified names and an explicit
-- search_path, and grant the auth admin role what it needs to write profiles.

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
    case
      when lower(new.email) in ('dhinesh@aivision360.com', 'sujitha@aivision360.com')
        then coalesce(new.raw_user_meta_data ->> 'requested_role', 'admin')::public.user_role
      else 'bdo'
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

grant usage on schema public to supabase_auth_admin;
grant select, insert, update on public.profiles to supabase_auth_admin;
