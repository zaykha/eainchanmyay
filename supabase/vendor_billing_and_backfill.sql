-- Vendor billing, verification, and role/plan backfill
-- Run this in the Supabase SQL editor.
--
-- What this does:
-- 1. Normalizes vendor plans to: free, pro, growth, verified
-- 2. Renames vendor seat role usage from staff -> agent
-- 3. Adds billing and verification columns to vendors
-- 4. Creates vendor_payments for upcoming Dinger integration

begin;

create extension if not exists pgcrypto;

-- Vendors: plan + billing + verification fields
alter table public.vendors
  add column if not exists billing_status text,
  add column if not exists billing_provider text,
  add column if not exists subscription_started_at timestamptz,
  add column if not exists subscription_ends_at timestamptz,
  add column if not exists next_billing_at timestamptz,
  add column if not exists verification_status text,
  add column if not exists verification_requested_at timestamptz,
  add column if not exists verified_at timestamptz,
  add column if not exists verification_notes text;

-- Drop older role/plan/billing/verification checks if they exist so the new normalized values can be applied.
do $$
declare
  constraint_name text;
begin
  if to_regclass('public.vendor_members') is not null then
    for constraint_name in
      select c.conname
      from pg_constraint c
      where c.conrelid = 'public.vendor_members'::regclass
        and pg_get_constraintdef(c.oid) ilike '%role%'
    loop
      execute format('alter table public.vendor_members drop constraint %I', constraint_name);
    end loop;
  end if;

  if to_regclass('public.vendors') is not null then
    for constraint_name in
      select c.conname
      from pg_constraint c
      where c.conrelid = 'public.vendors'::regclass
        and (
          pg_get_constraintdef(c.oid) ilike '%plan%' or
          pg_get_constraintdef(c.oid) ilike '%billing_status%' or
          pg_get_constraintdef(c.oid) ilike '%verification_status%' or
          pg_get_constraintdef(c.oid) ilike '%billing_provider%'
        )
    loop
      execute format('alter table public.vendors drop constraint %I', constraint_name);
    end loop;
  end if;
end $$;

-- Normalize vendor plans.
update public.vendors
set plan = case
  when plan is null or btrim(plan) = '' then 'free'
  when lower(btrim(plan)) in ('free', 'starter', 'starter_free') then 'free'
  when lower(btrim(plan)) in ('pro', 'basic', 'agency_basic') then 'pro'
  when lower(btrim(plan)) in ('growth', 'agency_growth') then 'growth'
  when lower(btrim(plan)) in ('verified', 'premium', 'enterprise', 'scale') then 'verified'
  else 'free'
end;

alter table public.vendors
  alter column plan set default 'free';

-- Do not force NOT NULL if you want a softer rollout; but after backfill it is usually better to require.
alter table public.vendors
  alter column plan set not null;

update public.vendors
set billing_status = case
  when billing_status is null or btrim(billing_status) = '' then 'inactive'
  when lower(btrim(billing_status)) in ('inactive', 'pending', 'active', 'past_due', 'canceled') then lower(btrim(billing_status))
  else 'inactive'
end;

update public.vendors
set billing_provider = case
  when billing_provider is null or btrim(billing_provider) = '' then null
  when lower(btrim(billing_provider)) in ('dinger') then 'dinger'
  else lower(btrim(billing_provider))
end;

update public.vendors
set verification_status = case
  when verification_status is null or btrim(verification_status) = '' then 'not_requested'
  when lower(btrim(verification_status)) in ('not_requested', 'pending', 'approved', 'rejected') then lower(btrim(verification_status))
  else 'not_requested'
end;

alter table public.vendors
  alter column billing_status set default 'inactive',
  alter column verification_status set default 'not_requested';

-- Normalize vendor member roles from staff -> agent.
update public.vendor_members
set role = 'agent'
where lower(role) = 'staff';

-- Recreate normalized checks.
alter table public.vendor_members
  add constraint vendor_members_role_check
  check (role in ('owner', 'admin', 'agent'));

alter table public.vendors
  add constraint vendors_plan_check
  check (plan in ('free', 'pro', 'growth', 'verified'));

alter table public.vendors
  add constraint vendors_billing_status_check
  check (billing_status in ('inactive', 'pending', 'active', 'past_due', 'canceled'));

alter table public.vendors
  add constraint vendors_billing_provider_check
  check (billing_provider is null or billing_provider in ('dinger'));

alter table public.vendors
  add constraint vendors_verification_status_check
  check (verification_status in ('not_requested', 'pending', 'approved', 'rejected'));

-- Payment history for future Dinger integration.
create table if not exists public.vendor_payments (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  plan text not null,
  amount numeric(14,2) not null,
  currency text not null default 'MMK',
  provider text not null default 'dinger',
  provider_payment_id text,
  provider_order_id text,
  status text not null default 'pending',
  paid_at timestamptz,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vendor_payments_plan_check
    check (plan in ('free', 'pro', 'growth', 'verified')),
  constraint vendor_payments_status_check
    check (status in ('pending', 'paid', 'failed', 'canceled', 'refunded')),
  constraint vendor_payments_provider_check
    check (provider in ('dinger'))
);

create index if not exists vendor_payments_vendor_id_idx on public.vendor_payments(vendor_id);
create index if not exists vendor_payments_status_idx on public.vendor_payments(status);
create index if not exists vendors_plan_idx on public.vendors(plan);
create index if not exists vendors_billing_status_idx on public.vendors(billing_status);
create index if not exists vendors_verification_status_idx on public.vendors(verification_status);

commit;

-- Post-run manual checks:
-- select id, name, plan, billing_status, verification_status from public.vendors order by created_at desc nulls last;
-- select role, count(*) from public.vendor_members group by role order by role;
-- select * from public.vendor_payments order by created_at desc limit 20;
