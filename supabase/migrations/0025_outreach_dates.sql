alter table leads add column if not exists outreach_date date;
alter table leads add column if not exists last_outreach_date date;

-- Backfill from existing automation: last_contacted_at was already being set
-- the first time a lead's status became outreach_initiated.
update leads
set outreach_date = coalesce(outreach_date, last_contacted_at::date),
    last_outreach_date = coalesce(last_outreach_date, last_contacted_at::date)
where last_contacted_at is not null;

create or replace function handle_lead_status_change()
returns trigger
language plpgsql
as $$
begin
  if (tg_op = 'UPDATE' and new.assigned_to is distinct from old.assigned_to and new.assigned_to is not null) then
    perform create_notification(
      new.assigned_to, 'lead_assigned', new.id,
      'Lead assigned: ' || new.company_name,
      'You have been assigned the lead ' || new.company_name || '.'
    );
    insert into activities (lead_id, type, actor_id, details)
    values (new.id, 'lead_assigned', new.assigned_to, jsonb_build_object('assigned_to', new.assigned_to));
  end if;

  if (tg_op = 'INSERT') then
    insert into activities (lead_id, type, actor_id, details)
    values (new.id, 'lead_created', new.created_by, jsonb_build_object('status', new.status));
    if new.assigned_to is not null then
      perform create_notification(
        new.assigned_to, 'lead_assigned', new.id,
        'Lead assigned: ' || new.company_name,
        'You have been assigned the lead ' || new.company_name || '.'
      );
    end if;
    return new;
  end if;

  if (new.status is distinct from old.status) then
    insert into activities (lead_id, type, actor_id, details)
    values (new.id, 'status_changed', new.assigned_to, jsonb_build_object('from', old.status, 'to', new.status));

    if new.status = 'outreach_initiated' then
      new.last_contacted_at := coalesce(new.last_contacted_at, now());
      new.outreach_date := coalesce(new.outreach_date, current_date);
      new.last_outreach_date := current_date;
      new.next_follow_up_date := (current_date + 2);
      perform create_notification(
        new.assigned_to, 'follow_up_due', new.id,
        'Follow-up scheduled: ' || new.company_name,
        'Next follow-up set for ' || new.next_follow_up_date::text || '.'
      );
    end if;

    if new.status = 'follow_up' then
      new.last_outreach_date := current_date;
    end if;
  end if;

  return new;
end;
$$;
