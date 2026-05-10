create table if not exists public.vendor_member_invites (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  email text not null,
  role text not null,
  status text not null default 'pending',
  invite_token text not null unique,
  invited_by_user_id uuid references public.profiles(id) on delete set null,
  accepted_by_user_id uuid references public.profiles(id) on delete set null,
  target_profile_id uuid references public.profiles(id) on delete set null,
  has_existing_account boolean not null default false,
  expires_at timestamptz not null default (timezone('utc', now()) + interval '7 days'),
  last_sent_at timestamptz not null default timezone('utc', now()),
  accepted_at timestamptz null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint vendor_member_invites_role_check check (role in ('owner', 'admin', 'agent')),
  constraint vendor_member_invites_status_check check (status in ('pending', 'accepted', 'expired', 'revoked'))
);

create index if not exists vendor_member_invites_vendor_idx
  on public.vendor_member_invites(vendor_id, status, created_at desc);

create index if not exists vendor_member_invites_email_idx
  on public.vendor_member_invites(lower(email));

create unique index if not exists vendor_member_invites_pending_unique
  on public.vendor_member_invites(vendor_id, lower(email))
  where status = 'pending';
