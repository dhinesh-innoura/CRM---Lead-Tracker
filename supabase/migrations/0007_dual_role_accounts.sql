-- Dhinesh and Sujitha get two logins each: an admin account (existing email)
-- and a separate BDO ("user") account, so they can switch roles by signing
-- in as a different account rather than toggling one profile's role.

do $$
declare
  v_admin_password text := 'adminTracker360!';
  v_user_password text := 'Tracker360!';
  v_team jsonb := '[
    {"base_email": "dhinesh@aivision360.com", "user_email": "dhinesh.user@aivision360.com", "full_name": "Dhinesh"},
    {"base_email": "sujitha@aivision360.com", "user_email": "sujitha.user@aivision360.com", "full_name": "Sujitha"}
  ]'::jsonb;
  v_member jsonb;
  v_user_id uuid;
begin
  for v_member in select * from jsonb_array_elements(v_team)
  loop
    -- ensure the existing admin account uses the new admin password
    update auth.users
    set encrypted_password = crypt(v_admin_password, gen_salt('bf'))
    where email = v_member ->> 'base_email';

    update profiles
    set role = 'admin'
    where email = v_member ->> 'base_email';

    -- create (or update) the separate BDO account
    select id into v_user_id from auth.users where email = v_member ->> 'user_email';

    if v_user_id is null then
      insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, raw_user_meta_data, raw_app_meta_data,
        created_at, updated_at, confirmation_token, recovery_token,
        email_change_token_new, email_change
      ) values (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        v_member ->> 'user_email',
        crypt(v_user_password, gen_salt('bf')),
        now(),
        jsonb_build_object('full_name', v_member ->> 'full_name', 'requested_role', 'bdo'),
        '{"provider":"email","providers":["email"]}'::jsonb,
        now(),
        now(),
        '',
        '',
        '',
        ''
      )
      returning id into v_user_id;
    else
      update auth.users
      set encrypted_password = crypt(v_user_password, gen_salt('bf'))
      where id = v_user_id;
    end if;

    update profiles
    set role = 'bdo', full_name = v_member ->> 'full_name'
    where id = v_user_id;
  end loop;
end;
$$;
