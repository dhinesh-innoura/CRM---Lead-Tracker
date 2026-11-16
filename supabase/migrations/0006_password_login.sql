-- Switch to simple name + password login (no email delivery required).
-- Creates/updates the 6 team accounts directly with a known password so
-- the login flow never depends on outbound email.

create extension if not exists pgcrypto;

do $$
declare
  v_password text := 'Tracker360!';
  v_team jsonb := '[
    {"email": "dhinesh@aivision360.com", "full_name": "Dhinesh", "requested_role": "admin"},
    {"email": "sujitha@aivision360.com", "full_name": "Sujitha", "requested_role": "admin"},
    {"email": "monica@aivision360.com", "full_name": "Monica"},
    {"email": "kezi@aivision360.com", "full_name": "Kezi"},
    {"email": "george@aivision360.com", "full_name": "George"},
    {"email": "arun@aivision360.com", "full_name": "Arun"}
  ]'::jsonb;
  v_member jsonb;
  v_user_id uuid;
begin
  for v_member in select * from jsonb_array_elements(v_team)
  loop
    select id into v_user_id from auth.users where email = v_member ->> 'email';

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
        v_member ->> 'email',
        crypt(v_password, gen_salt('bf')),
        now(),
        jsonb_build_object('full_name', v_member ->> 'full_name', 'requested_role', v_member ->> 'requested_role'),
        '{"provider":"email","providers":["email"]}'::jsonb,
        now(),
        now(),
        '',
        '',
        '',
        ''
      );
    else
      update auth.users
      set encrypted_password = crypt(v_password, gen_salt('bf')),
          email_confirmed_at = coalesce(email_confirmed_at, now())
      where id = v_user_id;
    end if;
  end loop;
end;
$$;
