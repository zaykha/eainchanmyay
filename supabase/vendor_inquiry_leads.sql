create extension if not exists pgcrypto;

create table if not exists public.vendor_inquiry_leads (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  inquiry_id uuid not null references public.inquiries(id) on delete cascade,
  assigned_member_user_id uuid null references public.profiles(id) on delete set null,
  status text not null default 'new',
  source text not null default 'marketplace_routed',
  routing_score integer null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (vendor_id, inquiry_id)
);

do $$
begin
  if exists (
    select 1 from pg_constraint where conname = 'vendor_inquiry_leads_status_check'
  ) then
    alter table public.vendor_inquiry_leads
      drop constraint vendor_inquiry_leads_status_check;
  end if;
end $$;

alter table public.vendor_inquiry_leads
  add constraint vendor_inquiry_leads_status_check
  check (status in ('new', 'contacted', 'qualified', 'closed', 'lost'));

do $$
begin
  if exists (
    select 1 from pg_constraint where conname = 'vendor_inquiry_leads_source_check'
  ) then
    alter table public.vendor_inquiry_leads
      drop constraint vendor_inquiry_leads_source_check;
  end if;
end $$;

alter table public.vendor_inquiry_leads
  add constraint vendor_inquiry_leads_source_check
  check (source in ('marketplace_routed', 'agency_direct', 'manual'));

create index if not exists vendor_inquiry_leads_vendor_idx
  on public.vendor_inquiry_leads(vendor_id, created_at desc);

create index if not exists vendor_inquiry_leads_inquiry_idx
  on public.vendor_inquiry_leads(inquiry_id);

create index if not exists vendor_inquiry_leads_assignee_idx
  on public.vendor_inquiry_leads(assigned_member_user_id);

-- Verification
-- select * from public.vendor_inquiry_leads order by created_at desc limit 20;
