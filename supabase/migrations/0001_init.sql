-- Tracker360 initial schema
-- Enums

create type user_role as enum ('admin', 'bdo');

create type lead_status as enum (
  'new',
  'researching',
  'ready_to_contact',
  'outreach_sent',
  'follow_up_due',
  'responded',
  'meeting_scheduled',
  'interested',
  'negotiation',
  'converted',
  'not_interested',
  'closed_lost'
);

create type lead_priority as enum ('high', 'medium', 'low');

create type lead_source as enum (
  'event_exhibition',
  'self_sourced_linkedin',
  'self_sourced_website',
  'management_assigned',
  'partner_referral',
  'existing_contact',
  'inbound_enquiry',
  'other'
);

create type response_channel as enum ('email', 'linkedin', 'phone', 'meeting', 'other');

create type response_outcome as enum (
  'interested',
  'requested_more_info',
  'requested_demo',
  'meeting_proposed',
  'meeting_confirmed',
  'follow_up_later',
  'not_interested',
  'referred_to_another_contact',
  'other'
);

create type activity_type as enum (
  'lead_created',
  'lead_assigned',
  'research_completed',
  'outreach_sent',
  'follow_up_scheduled',
  'follow_up_completed',
  'response_recorded',
  'meeting_scheduled',
  'meeting_completed',
  'status_changed',
  'note_added',
  'lead_updated',
  'import'
);

create type notification_type as enum (
  'lead_assigned',
  'lead_imported',
  'follow_up_due',
  'follow_up_overdue',
  'meeting_upcoming',
  'response_received',
  'lead_reassigned',
  'status_changed',
  'activity_on_shared_lead'
);

-- Profiles (mirrors auth.users, one row per team member)

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role user_role not null default 'bdo',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Leads: central company/lead record

create table leads (
  id uuid primary key default gen_random_uuid(),
  lead_code text not null unique, -- human readable e.g. LEAD-0001

  -- company info
  company_name text not null,
  company_website text,
  industry text,
  country text,
  location text,
  company_description text,
  products_and_solutions text,
  potential_opportunity text,

  -- contact info (primary contact; additional contacts in lead_contacts)
  contact_name text,
  contact_title text,
  contact_email text,
  contact_phone text,
  contact_linkedin_url text,

  -- lead info
  source lead_source not null default 'other',
  source_details text,
  assigned_to uuid references profiles (id),
  priority lead_priority not null default 'medium',
  status lead_status not null default 'new',
  last_contacted_at timestamptz,
  next_follow_up_date date,
  notes text,

  created_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index leads_status_idx on leads (status);
create index leads_assigned_to_idx on leads (assigned_to);
create index leads_next_follow_up_idx on leads (next_follow_up_date);
create index leads_company_name_idx on leads (lower(company_name));
create index leads_contact_email_idx on leads (lower(contact_email));

-- Additional contacts per lead (a company can have multiple contacts)

create table lead_contacts (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads (id) on delete cascade,
  name text not null,
  title text,
  email text,
  phone text,
  linkedin_url text,
  created_at timestamptz not null default now()
);

-- Activity timeline: append-only history per lead

create table activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads (id) on delete cascade,
  type activity_type not null,
  actor_id uuid references profiles (id),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index activities_lead_id_idx on activities (lead_id, created_at desc);

-- Responses: captured when a lead's status changes to responded

create table responses (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads (id) on delete cascade,
  responded_at timestamptz not null,
  response_text text,
  channel response_channel not null default 'other',
  outcome response_outcome not null default 'other',
  is_interested boolean,
  next_action text,
  next_action_date date,
  recorded_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

create index responses_lead_id_idx on responses (lead_id);

-- Meetings

create table meetings (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads (id) on delete cascade,
  meeting_date date not null,
  meeting_time time,
  platform_or_location text,
  participants text,
  objective text,
  notes text,
  status text not null default 'scheduled', -- scheduled | completed | cancelled
  created_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

create index meetings_lead_id_idx on meetings (lead_id);
create index meetings_meeting_date_idx on meetings (meeting_date);

-- Follow-ups: explicit queue of scheduled follow-up tasks (separate from leads.next_follow_up_date for history)

create table follow_ups (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads (id) on delete cascade,
  due_date date not null,
  status text not null default 'pending', -- pending | completed | cancelled
  created_reason text, -- e.g. 'outreach_sent', 'manual', 'unanswered_cycle'
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index follow_ups_due_date_idx on follow_ups (due_date);
create index follow_ups_lead_id_idx on follow_ups (lead_id);

-- Notifications

create table notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references profiles (id) on delete cascade,
  type notification_type not null,
  lead_id uuid references leads (id) on delete cascade,
  title text not null,
  body text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_recipient_idx on notifications (recipient_id, is_read, created_at desc);

-- Import history

create table import_batches (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  imported_by uuid references profiles (id),
  total_rows integer not null default 0,
  imported_rows integer not null default 0,
  skipped_rows integer not null default 0,
  error_rows integer not null default 0,
  column_mapping jsonb not null default '{}'::jsonb,
  errors jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table leads add column import_batch_id uuid references import_batches (id);

-- Lead code sequence + trigger

create sequence lead_code_seq;

create or replace function set_lead_code()
returns trigger
language plpgsql
as $$
begin
  if new.lead_code is null then
    new.lead_code := 'LEAD-' || lpad(nextval('lead_code_seq')::text, 5, '0');
  end if;
  return new;
end;
$$;

create trigger leads_set_code
before insert on leads
for each row execute function set_lead_code();

-- updated_at maintenance

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger leads_set_updated_at
before update on leads
for each row execute function set_updated_at();
