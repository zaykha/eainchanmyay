create table if not exists public.listing_reports (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  reported_by_user_id uuid references public.profiles(id) on delete set null,
  reason text not null,
  details text,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

alter table public.listing_reports
  drop constraint if exists listing_reports_status_check;

alter table public.listing_reports
  add constraint listing_reports_status_check
    check (status in ('open', 'reviewed', 'dismissed', 'actioned'));

create index if not exists listing_reports_property_idx
  on public.listing_reports(property_id, created_at desc);

create index if not exists listing_reports_status_idx
  on public.listing_reports(status, created_at desc);
