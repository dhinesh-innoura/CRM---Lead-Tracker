-- profiles_update_self (0003_rls.sql) lets a user update their own row with no
-- column restriction, so any BDO could self-promote by setting role='admin'
-- or is_active=true via a direct API call. Lock those two columns unless the
-- actor already has admin privileges.
create or replace function protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    new.role := old.role;
    new.is_active := old.is_active;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_privileges on profiles;
create trigger protect_profile_privileges
before update on profiles
for each row
execute function protect_profile_privileges();
