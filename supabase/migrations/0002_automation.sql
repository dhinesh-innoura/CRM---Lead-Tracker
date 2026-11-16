-- Tracker360 follow-up automation + notifications

-- Statuses for which the unanswered-outreach follow-up cycle must NOT run
-- responded, meeting_scheduled, converted, not_interested, closed_lost

create or replace function create_notification(
  p_recipient uuid,
  p_type notification_type,
  p_lead_id uuid,
  p_title text,
  p_body text
) returns void
language plpgsql
as $$
begin
  if p_recipient is null then
    return;
  end if;
  insert into notifications (recipient_id, type, lead_id, title, body)
  values (p_recipient, p_type, p_lead_id, p_title, p_body);
end;
$$;

-- Core trigger: runs on lead status changes and assignment changes
create or replace function handle_lead_status_change()
returns trigger
language plpgsql
as $$
declare
  v_next_follow_up date;
begin
  -- Assignment changed: notify new assignee
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

  -- Status changed
  if (new.status is distinct from old.status) then
    insert into activities (lead_id, type, actor_id, details)
    values (new.id, 'status_changed', new.assigned_to, jsonb_build_object('from', old.status, 'to', new.status));

    if new.status = 'outreach_sent' then
      new.last_contacted_at := coalesce(new.last_contacted_at, now());
      v_next_follow_up := (new.last_contacted_at::date + interval '2 days')::date;
      new.next_follow_up_date := v_next_follow_up;

      insert into follow_ups (lead_id, due_date, created_reason)
      values (new.id, v_next_follow_up, 'outreach_sent');

      insert into activities (lead_id, type, actor_id, details)
      values (new.id, 'outreach_sent', new.assigned_to, jsonb_build_object('next_follow_up_date', v_next_follow_up));

      perform create_notification(
        new.assigned_to, 'follow_up_due', new.id,
        'Follow-up scheduled: ' || new.company_name,
        'Next follow-up set for ' || v_next_follow_up::text || '.'
      );
    end if;

    -- Stop automatic cycle for terminal / responded-type statuses
    if new.status in ('responded', 'meeting_scheduled', 'converted', 'not_interested', 'closed_lost') then
      update follow_ups set status = 'cancelled'
      where lead_id = new.id and status = 'pending';
    end if;
  end if;

  return new;
end;
$$;

create trigger leads_status_automation
before insert or update on leads
for each row execute function handle_lead_status_change();

-- Called by the BDO after recording an unanswered follow-up activity, to roll
-- the follow-up forward by another 2 days. Exposed as an RPC for the app to call.
create or replace function record_follow_up_and_reschedule(
  p_lead_id uuid,
  p_follow_up_id uuid,
  p_next_date date default null
) returns void
language plpgsql
security definer
as $$
declare
  v_status lead_status;
  v_assigned uuid;
  v_next date;
begin
  select status, assigned_to into v_status, v_assigned from leads where id = p_lead_id;

  update follow_ups set status = 'completed', completed_at = now()
  where id = p_follow_up_id and lead_id = p_lead_id;

  insert into activities (lead_id, type, actor_id, details)
  values (p_lead_id, 'follow_up_completed', v_assigned, jsonb_build_object('follow_up_id', p_follow_up_id));

  if v_status in ('responded', 'meeting_scheduled', 'converted', 'not_interested', 'closed_lost') then
    return;
  end if;

  v_next := coalesce(p_next_date, (current_date + interval '2 days')::date);

  update leads set next_follow_up_date = v_next where id = p_lead_id;

  insert into follow_ups (lead_id, due_date, created_reason)
  values (p_lead_id, v_next, 'unanswered_cycle');

  insert into activities (lead_id, type, actor_id, details)
  values (p_lead_id, 'follow_up_scheduled', v_assigned, jsonb_build_object('due_date', v_next));

  perform create_notification(
    v_assigned, 'follow_up_due', p_lead_id,
    'Follow-up due', 'Next follow-up set for ' || v_next::text || '.'
  );
end;
$$;

-- Record a response: inserts into responses, updates lead, stops cycle, schedules next action
create or replace function record_response(
  p_lead_id uuid,
  p_responded_at timestamptz,
  p_response_text text,
  p_channel response_channel,
  p_outcome response_outcome,
  p_is_interested boolean,
  p_next_action text,
  p_next_action_date date,
  p_recorded_by uuid
) returns uuid
language plpgsql
security definer
as $$
declare
  v_id uuid;
  v_assigned uuid;
begin
  insert into responses (
    lead_id, responded_at, response_text, channel, outcome,
    is_interested, next_action, next_action_date, recorded_by
  ) values (
    p_lead_id, p_responded_at, p_response_text, p_channel, p_outcome,
    p_is_interested, p_next_action, p_next_action_date, p_recorded_by
  ) returning id into v_id;

  select assigned_to into v_assigned from leads where id = p_lead_id;

  update leads
  set status = 'responded',
      next_follow_up_date = p_next_action_date
  where id = p_lead_id;

  update follow_ups set status = 'cancelled' where lead_id = p_lead_id and status = 'pending';

  insert into activities (lead_id, type, actor_id, details)
  values (p_lead_id, 'response_recorded', p_recorded_by, jsonb_build_object('outcome', p_outcome, 'response_id', v_id));

  perform create_notification(
    v_assigned, 'response_received', p_lead_id,
    'Response received', 'A response was recorded with outcome: ' || p_outcome::text || '.'
  );

  return v_id;
end;
$$;

-- Daily sweep (invoked by a scheduled Edge Function / cron) to:
--  1) surface overdue follow-ups as notifications
--  2) notify assignees of follow-ups due today
create or replace function run_daily_follow_up_sweep()
returns void
language plpgsql
security definer
as $$
declare
  r record;
begin
  for r in
    select f.id as follow_up_id, f.lead_id, f.due_date, l.assigned_to, l.company_name
    from follow_ups f
    join leads l on l.id = f.lead_id
    where f.status = 'pending' and f.due_date = current_date
  loop
    perform create_notification(
      r.assigned_to, 'follow_up_due', r.lead_id,
      'Follow-up due today: ' || r.company_name,
      'A follow-up for ' || r.company_name || ' is due today.'
    );
  end loop;

  for r in
    select f.id as follow_up_id, f.lead_id, f.due_date, l.assigned_to, l.company_name
    from follow_ups f
    join leads l on l.id = f.lead_id
    where f.status = 'pending' and f.due_date < current_date
  loop
    perform create_notification(
      r.assigned_to, 'follow_up_overdue', r.lead_id,
      'Overdue follow-up: ' || r.company_name,
      'The follow-up for ' || r.company_name || ' was due on ' || r.due_date::text || ' and is now overdue.'
    );
  end loop;

  for r in
    select m.id as meeting_id, m.lead_id, m.meeting_date, l.assigned_to, l.company_name
    from meetings m
    join leads l on l.id = m.lead_id
    where m.status = 'scheduled' and m.meeting_date = current_date + interval '1 day'
  loop
    perform create_notification(
      r.assigned_to, 'meeting_upcoming', r.lead_id,
      'Upcoming meeting: ' || r.company_name,
      'Meeting with ' || r.company_name || ' is scheduled for tomorrow (' || r.meeting_date::text || ').'
    );
  end loop;
end;
$$;

-- Meeting scheduling helper: sets lead status + inserts meeting + activity
create or replace function schedule_meeting(
  p_lead_id uuid,
  p_meeting_date date,
  p_meeting_time time,
  p_platform_or_location text,
  p_participants text,
  p_objective text,
  p_notes text,
  p_created_by uuid
) returns uuid
language plpgsql
security definer
as $$
declare
  v_id uuid;
  v_assigned uuid;
begin
  insert into meetings (lead_id, meeting_date, meeting_time, platform_or_location, participants, objective, notes, created_by)
  values (p_lead_id, p_meeting_date, p_meeting_time, p_platform_or_location, p_participants, p_objective, p_notes, p_created_by)
  returning id into v_id;

  select assigned_to into v_assigned from leads where id = p_lead_id;

  update leads set status = 'meeting_scheduled' where id = p_lead_id;

  update follow_ups set status = 'cancelled' where lead_id = p_lead_id and status = 'pending';

  insert into activities (lead_id, type, actor_id, details)
  values (p_lead_id, 'meeting_scheduled', p_created_by, jsonb_build_object('meeting_id', v_id, 'meeting_date', p_meeting_date));

  perform create_notification(
    v_assigned, 'meeting_upcoming', p_lead_id,
    'Meeting scheduled', 'Meeting scheduled for ' || p_meeting_date::text || '.'
  );

  return v_id;
end;
$$;
