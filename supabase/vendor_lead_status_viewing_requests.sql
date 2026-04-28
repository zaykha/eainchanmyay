alter table public.viewing_requests
  add column if not exists lead_status text;

update public.viewing_requests
set lead_status = case
  when lead_status is null or btrim(lead_status) = '' then 'new'
  when lower(btrim(lead_status)) in ('new', 'contacted', 'scheduled', 'closed', 'lost') then lower(btrim(lead_status))
  else 'new'
end;

alter table public.viewing_requests
  alter column lead_status set default 'new';

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'viewing_requests_lead_status_check'
  ) then
    alter table public.viewing_requests
      drop constraint viewing_requests_lead_status_check;
  end if;
end $$;

alter table public.viewing_requests
  add constraint viewing_requests_lead_status_check
  check (lead_status in ('new', 'contacted', 'scheduled', 'closed', 'lost'));

create index if not exists viewing_requests_lead_status_idx
  on public.viewing_requests(lead_status);

-- Verification
-- select id, property_id, lead_status, created_at from public.viewing_requests order by created_at desc limit 20;
