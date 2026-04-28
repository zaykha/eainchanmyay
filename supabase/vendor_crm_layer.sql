create extension if not exists pgcrypto;

alter table public.vendor_inquiry_leads
  add column if not exists pipeline_stage text,
  add column if not exists last_contacted_at timestamptz,
  add column if not exists sla_due_at timestamptz;

update public.vendor_inquiry_leads
set pipeline_stage = case
  when pipeline_stage is null or btrim(pipeline_stage) = '' then 'new_lead'
  when lower(btrim(pipeline_stage)) in ('new_lead', 'contacted', 'qualified', 'negotiating', 'won', 'lost') then lower(btrim(pipeline_stage))
  else 'new_lead'
end,
sla_due_at = coalesce(sla_due_at, created_at + interval '24 hours');

do $$
begin
  if exists (
    select 1 from pg_constraint where conname = 'vendor_inquiry_leads_pipeline_stage_check'
  ) then
    alter table public.vendor_inquiry_leads
      drop constraint vendor_inquiry_leads_pipeline_stage_check;
  end if;
end $$;

alter table public.vendor_inquiry_leads
  alter column pipeline_stage set default 'new_lead';

alter table public.vendor_inquiry_leads
  add constraint vendor_inquiry_leads_pipeline_stage_check
  check (pipeline_stage in ('new_lead', 'contacted', 'qualified', 'negotiating', 'won', 'lost'));

create table if not exists public.vendor_lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.vendor_inquiry_leads(id) on delete cascade,
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  author_user_id uuid null references public.profiles(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists vendor_lead_notes_lead_idx
  on public.vendor_lead_notes(lead_id, created_at desc);

create table if not exists public.vendor_lead_reminders (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.vendor_inquiry_leads(id) on delete cascade,
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  assigned_user_id uuid null references public.profiles(id) on delete set null,
  remind_at timestamptz not null,
  status text not null default 'pending',
  note text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if exists (
    select 1 from pg_constraint where conname = 'vendor_lead_reminders_status_check'
  ) then
    alter table public.vendor_lead_reminders
      drop constraint vendor_lead_reminders_status_check;
  end if;
end $$;

alter table public.vendor_lead_reminders
  add constraint vendor_lead_reminders_status_check
  check (status in ('pending', 'done', 'canceled'));

create index if not exists vendor_lead_reminders_lead_idx
  on public.vendor_lead_reminders(lead_id, remind_at asc);

create table if not exists public.vendor_message_templates (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  title text not null,
  body text not null,
  created_by_user_id uuid null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vendor_message_templates_vendor_idx
  on public.vendor_message_templates(vendor_id, created_at desc);

-- Verification
-- select id, pipeline_stage, sla_due_at from public.vendor_inquiry_leads order by created_at desc limit 20;
