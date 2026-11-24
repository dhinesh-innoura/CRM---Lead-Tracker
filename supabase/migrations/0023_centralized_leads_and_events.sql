-- Migration 0023: Centralized Master Leads, Event Leads Relationship, and Ownership Tracking

-- 1. Extend lead_status enum with required pipeline statuses
alter type lead_status add value if not exists 'new';
alter type lead_status add value if not exists 'contacted';
alter type lead_status add value if not exists 'interested';
alter type lead_status add value if not exists 'demo_scheduled';
alter type lead_status add value if not exists 'demo_completed';
alter type lead_status add value if not exists 'proposal_sent';
alter type lead_status add value if not exists 'negotiation';

-- 2. Add owner_id, assigned_by, and assigned_at to master leads table
alter table public.leads add column if not exists owner_id uuid references public.profiles (id);
alter table public.leads add column if not exists assigned_by uuid references public.profiles (id);
alter table public.leads add column if not exists assigned_at timestamptz;

create index if not exists leads_owner_id_idx on public.leads (owner_id);
create index if not exists leads_assigned_by_idx on public.leads (assigned_by);
create index if not exists leads_assigned_at_idx on public.leads (assigned_at);

-- Backfill owner_id from created_by for all existing leads
update public.leads
set owner_id = created_by
where owner_id is null and created_by is not null;

-- Backfill assigned_at for leads that are currently assigned
update public.leads
set assigned_at = coalesce(updated_at, created_at)
where assigned_to is not null and assigned_at is null;

-- 3. Enhance events table with location and description
alter table public.events add column if not exists location text;
alter table public.events add column if not exists description text;

-- 4. Create event_leads relationship table (Many-to-Many connecting Master Leads to Events)
create table if not exists public.event_leads (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  lead_id uuid not null references public.leads (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint event_leads_event_lead_unique unique (event_id, lead_id)
);

create index if not exists event_leads_event_id_idx on public.event_leads (event_id);
create index if not exists event_leads_lead_id_idx on public.event_leads (lead_id);

-- Enable RLS for event_leads
alter table public.event_leads enable row level security;
drop policy if exists event_leads_select on public.event_leads;
drop policy if exists event_leads_insert on public.event_leads;
drop policy if exists event_leads_delete on public.event_leads;

create policy event_leads_select on public.event_leads for select using (is_active_member());
create policy event_leads_insert on public.event_leads for insert with check (is_active_member());
create policy event_leads_delete on public.event_leads for delete using (is_active_member());

-- Backfill event_leads from existing leads.event_id column
insert into public.event_leads (event_id, lead_id)
select event_id, id
from public.leads
where event_id is not null
on conflict (event_id, lead_id) do nothing;

-- 5. Trigger to guarantee original owner is preserved and assignment metadata is updated
create or replace function public.handle_lead_assignment_and_owner()
returns trigger
language plpgsql
security definer
as $$
begin
  if (tg_op = 'INSERT') then
    if new.owner_id is null then
      new.owner_id := coalesce(new.created_by, auth.uid());
    end if;
    if new.assigned_to is not null and new.assigned_at is null then
      new.assigned_at := now();
      new.assigned_by := coalesce(new.created_by, auth.uid());
    end if;
  elsif (tg_op = 'UPDATE') then
    -- Guarantee the original lead owner is never overwritten on update
    new.owner_id := coalesce(old.owner_id, new.owner_id);

    -- Track assignment changes
    if (new.assigned_to is distinct from old.assigned_to) then
      if new.assigned_to is not null then
        new.assigned_by := coalesce(auth.uid(), new.assigned_by);
        new.assigned_at := now();
      else
        new.assigned_by := null;
        new.assigned_at := null;
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_lead_assignment_and_owner on public.leads;
create trigger trg_lead_assignment_and_owner
before insert or update on public.leads
for each row
execute function public.handle_lead_assignment_and_owner();

-- 6. Update leads RLS policies to recognize owner_id
drop policy if exists leads_select on public.leads;
drop policy if exists leads_update on public.leads;
drop policy if exists leads_delete on public.leads;

create policy leads_select on public.leads for select
  using (is_active_member());

create policy leads_update on public.leads for update
  using (is_active_member());

create policy leads_delete on public.leads for delete
  using (is_active_member());
