-- Track the moment a lead's status is first set (transitions out of "New").
-- A lead keeps showing in the New Leads tab for the rest of that same
-- calendar day even after its status changes, and only moves into All
-- Leads once the next day starts — so a BDO's in-progress work for "today's
-- batch" stays together in New Leads until the day rolls over.
alter table public.leads add column if not exists first_status_at timestamptz;

create or replace function public.set_first_status_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status is null and new.status is not null and new.first_status_at is null then
    new.first_status_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists leads_set_first_status_at on public.leads;
create trigger leads_set_first_status_at
  before update on public.leads
  for each row
  execute function public.set_first_status_at();
