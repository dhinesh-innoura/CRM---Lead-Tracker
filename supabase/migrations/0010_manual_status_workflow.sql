-- Replace the lead status pipeline with a manually-driven 9-status workflow,
-- and add the structured data each status now requires (meeting details,
-- a quick response note, a hold reason).

drop trigger if exists leads_status_automation on leads;
drop function if exists bulk_update_status(uuid[], lead_status);
drop function if exists handle_lead_status_change();
drop function if exists run_daily_follow_up_sweep();
drop function if exists record_response(uuid, timestamptz, text, response_channel, response_outcome, boolean, text, date, uuid);
drop function if exists schedule_meeting(uuid, date, time, text, text, text, text, uuid);

alter table leads alter column status drop default;
alter type lead_status rename to lead_status_old;

create type lead_status as enum (
  'outreach_initiated',
  'follow_up',
  'meeting_scheduled',
  'response_received',
  'no_response',
  'meeting_completed',
  'successfully_converted',
  'meeting_rescheduled',
  'on_hold'
);

alter table leads
  alter column status type lead_status
  using (
    case status::text
      when 'new' then 'outreach_initiated'
      when 'researching' then 'outreach_initiated'
      when 'ready_to_contact' then 'outreach_initiated'
      when 'outreach_sent' then 'outreach_initiated'
      when 'follow_up_due' then 'follow_up'
      when 'responded' then 'response_received'
      when 'meeting_scheduled' then 'meeting_scheduled'
      when 'interested' then 'response_received'
      when 'negotiation' then 'follow_up'
      when 'converted' then 'successfully_converted'
      when 'not_interested' then 'no_response'
      when 'closed_lost' then 'on_hold'
      else 'outreach_initiated'
    end
  )::lead_status;

alter table leads alter column status set default 'outreach_initiated';
drop type lead_status_old;

alter table leads add column if not exists response_text text;
alter table leads add column if not exists response_date timestamptz;
alter table leads add column if not exists hold_reason text;

alter table meetings add column if not exists meeting_url text;

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
      new.next_follow_up_date := (current_date + 2);
      perform create_notification(
        new.assigned_to, 'follow_up_due', new.id,
        'Follow-up scheduled: ' || new.company_name,
        'Next follow-up set for ' || new.next_follow_up_date::text || '.'
      );
    end if;
  end if;

  return new;
end;
$$;

create trigger leads_status_automation
before insert or update on leads
for each row execute function handle_lead_status_change();

create or replace function run_daily_follow_up_sweep()
returns void
language plpgsql
security definer
as $$
declare
  r record;
begin
  update leads set status = 'follow_up'
  where status = 'outreach_initiated' and next_follow_up_date <= current_date;

  for r in
    select id as lead_id, assigned_to, company_name, next_follow_up_date
    from leads
    where status = 'follow_up' and next_follow_up_date <= current_date
  loop
    perform create_notification(
      r.assigned_to, 'follow_up_overdue', r.lead_id,
      'Follow-up due: ' || r.company_name,
      'Follow-up for ' || r.company_name || ' was due ' || r.next_follow_up_date::text || '.'
    );
  end loop;

  for r in
    select m.id as meeting_id, m.lead_id, m.meeting_date, l.assigned_to, l.company_name
    from meetings m
    join leads l on l.id = m.lead_id
    where m.status = 'scheduled' and m.meeting_date = current_date + 1
  loop
    perform create_notification(
      r.assigned_to, 'meeting_upcoming', r.lead_id,
      'Upcoming meeting: ' || r.company_name,
      'Meeting with ' || r.company_name || ' is scheduled for tomorrow (' || r.meeting_date::text || ').'
    );
  end loop;
end;
$$;

create or replace function bulk_update_status(p_lead_ids uuid[], p_status lead_status)
returns void
language plpgsql
security invoker
as $$
begin
  update leads set status = p_status where id = any(p_lead_ids);
end;
$$;

-- Meeting scheduled / rescheduled: records the meeting details and sets the
-- lead's status in one step.
create or replace function upsert_meeting(
  p_lead_id uuid,
  p_status lead_status,
  p_meeting_date date,
  p_meeting_time time,
  p_platform_or_location text,
  p_meeting_url text,
  p_actor uuid
) returns uuid
language plpgsql
security definer
as $$
declare
  v_id uuid;
  v_assigned uuid;
begin
  insert into meetings (lead_id, meeting_date, meeting_time, platform_or_location, meeting_url, status, created_by)
  values (p_lead_id, p_meeting_date, p_meeting_time, p_platform_or_location, p_meeting_url, 'scheduled', p_actor)
  returning id into v_id;

  select assigned_to into v_assigned from leads where id = p_lead_id;

  update leads set status = p_status where id = p_lead_id;

  insert into activities (lead_id, type, actor_id, details)
  values (p_lead_id, 'meeting_scheduled', p_actor, jsonb_build_object('meeting_id', v_id, 'meeting_date', p_meeting_date, 'status', p_status));

  perform create_notification(
    v_assigned, 'meeting_upcoming',
    p_lead_id,
    case when p_status = 'meeting_rescheduled' then 'Meeting rescheduled' else 'Meeting scheduled' end,
    'Meeting set for ' || p_meeting_date::text || '.'
  );

  return v_id;
end;
$$;

-- Response received: a single manually-typed response note.
create or replace function record_quick_response(p_lead_id uuid, p_response_text text, p_actor uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_assigned uuid;
begin
  update leads
  set status = 'response_received', response_text = p_response_text, response_date = now()
  where id = p_lead_id;

  select assigned_to into v_assigned from leads where id = p_lead_id;

  insert into activities (lead_id, type, actor_id, details)
  values (p_lead_id, 'response_recorded', p_actor, jsonb_build_object('response_text', p_response_text));

  perform create_notification(v_assigned, 'response_received', p_lead_id, 'Response received', 'A response was recorded.');
end;
$$;

create or replace function update_response_text(p_lead_id uuid, p_response_text text)
returns void
language plpgsql
security invoker
as $$
begin
  update leads
  set response_text = p_response_text, response_date = coalesce(response_date, now())
  where id = p_lead_id;
end;
$$;

-- On hold: captures the reason and sets the status together.
create or replace function set_lead_on_hold(p_lead_id uuid, p_reason text, p_actor uuid)
returns void
language plpgsql
security definer
as $$
begin
  update leads set status = 'on_hold', hold_reason = p_reason where id = p_lead_id;
  insert into activities (lead_id, type, actor_id, details)
  values (p_lead_id, 'status_changed', p_actor, jsonb_build_object('to', 'on_hold', 'reason', p_reason));
end;
$$;

create or replace function update_hold_reason(p_lead_id uuid, p_reason text)
returns void
language plpgsql
security invoker
as $$
begin
  update leads set hold_reason = p_reason where id = p_lead_id;
end;
$$;
