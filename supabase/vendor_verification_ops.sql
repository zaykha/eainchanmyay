alter table public.properties
  add column if not exists verification_status text,
  add column if not exists verified_at timestamptz,
  add column if not exists verification_notes text;

update public.properties
set verification_status = case
  when verification_status is null or btrim(verification_status) = '' then 'not_requested'
  when lower(btrim(verification_status)) in ('not_requested', 'pending', 'approved', 'rejected') then lower(btrim(verification_status))
  else 'not_requested'
end;

alter table public.properties
  alter column verification_status set default 'not_requested';

alter table public.properties
  drop constraint if exists properties_verification_status_check;

alter table public.properties
  add constraint properties_verification_status_check
  check (verification_status in ('not_requested', 'pending', 'approved', 'rejected'));

create table if not exists public.vendor_verification_requests (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  requested_by_user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending',
  notes text,
  review_notes text,
  included_in_plan boolean not null default false,
  reviewed_by_user_id uuid references public.profiles(id) on delete set null,
  requested_at timestamptz not null default timezone('utc', now()),
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.vendor_verification_requests
  drop constraint if exists vendor_verification_requests_status_check;

alter table public.vendor_verification_requests
  add constraint vendor_verification_requests_status_check
  check (status in ('pending', 'approved', 'rejected', 'changes_requested'));

create table if not exists public.vendor_verification_documents (
  id uuid primary key default gen_random_uuid(),
  verification_request_id uuid not null references public.vendor_verification_requests(id) on delete cascade,
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  document_type text not null,
  document_name text not null,
  document_url text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.vendor_verification_request_properties (
  verification_request_id uuid not null references public.vendor_verification_requests(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (verification_request_id, property_id)
);

create index if not exists vendor_verification_requests_vendor_idx
  on public.vendor_verification_requests(vendor_id, requested_at desc);

create index if not exists vendor_verification_requests_status_idx
  on public.vendor_verification_requests(status, requested_at desc);

create index if not exists vendor_verification_documents_request_idx
  on public.vendor_verification_documents(verification_request_id, created_at asc);

create index if not exists vendor_verification_request_properties_request_idx
  on public.vendor_verification_request_properties(verification_request_id, created_at asc);

create index if not exists properties_verification_status_idx
  on public.properties(verification_status, verified_at desc nulls last);

select id, vendor_id, status, requested_at
from public.vendor_verification_requests
order by requested_at desc
limit 20;
