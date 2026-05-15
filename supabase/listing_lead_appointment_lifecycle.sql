alter table public.properties
  add column if not exists published_at timestamptz,
  add column if not exists expires_at timestamptz,
  add column if not exists reserved_at timestamptz,
  add column if not exists closed_at timestamptz,
  add column if not exists archived_at timestamptz,
  add column if not exists rejection_reason text;

alter table public.properties
  drop constraint if exists properties_status_check;

update public.properties
set status = case
  when lower(btrim(status)) = 'published' then 'active'
  when lower(btrim(status)) in ('draft','active','paused','reserved','sold','rented','expired','archived','rejected') then lower(btrim(status))
  else 'draft'
end
where status is null
   or btrim(status) = ''
   or lower(btrim(status)) not in ('draft','active','paused','reserved','sold','rented','expired','archived','rejected')
   or lower(btrim(status)) = 'published';

alter table public.properties
  add constraint properties_status_check
  check (status in ('draft','active','paused','reserved','sold','rented','expired','archived','rejected'));

update public.properties
set published_at = coalesce(published_at, created_at)
where status in ('active', 'reserved');

update public.properties
set reserved_at = coalesce(reserved_at, updated_at, created_at)
where status = 'reserved';

update public.properties
set closed_at = coalesce(closed_at, updated_at, created_at)
where status in ('sold', 'rented');

update public.properties
set archived_at = coalesce(archived_at, updated_at, created_at)
where status = 'archived';

alter table public.vendor_inquiry_leads
  add column if not exists property_id uuid references public.properties(id) on delete set null,
  add column if not exists priority text default 'normal',
  add column if not exists first_response_at timestamptz,
  add column if not exists closed_at timestamptz,
  add column if not exists lost_reason text,
  add column if not exists closed_outcome text;

alter table public.vendor_inquiry_leads
  drop constraint if exists vendor_inquiry_leads_status_check,
  drop constraint if exists vendor_inquiry_leads_pipeline_stage_check,
  drop constraint if exists vendor_inquiry_leads_priority_check,
  drop constraint if exists vendor_inquiry_leads_source_check;

update public.vendor_inquiry_leads
set status = case
  when lower(btrim(status)) = 'new' then 'new'
  when lower(btrim(status)) = 'contacted' then 'contacted'
  when lower(btrim(status)) = 'qualified' then 'qualified'
  when lower(btrim(status)) = 'closed' then 'closed_won'
  when lower(btrim(status)) = 'lost' then 'closed_lost'
  when lower(btrim(status)) in ('assigned','appointment_scheduled','viewed','negotiation','closed_won','closed_lost','unresponsive','spam') then lower(btrim(status))
  else 'new'
end;

update public.vendor_inquiry_leads
set pipeline_stage = case
  when lower(btrim(coalesce(pipeline_stage, ''))) in ('new_lead','new') then 'new'
  when lower(btrim(coalesce(pipeline_stage, ''))) = 'contacted' then 'contacted'
  when lower(btrim(coalesce(pipeline_stage, ''))) = 'qualified' then 'qualified'
  when lower(btrim(coalesce(pipeline_stage, ''))) in ('appointment_scheduled','scheduled') then 'appointment_scheduled'
  when lower(btrim(coalesce(pipeline_stage, ''))) = 'viewed' then 'viewed'
  when lower(btrim(coalesce(pipeline_stage, ''))) in ('negotiating','negotiation') then 'negotiation'
  when lower(btrim(coalesce(pipeline_stage, ''))) in ('won','closed_won','closed') then 'closed_won'
  when lower(btrim(coalesce(pipeline_stage, ''))) in ('lost','closed_lost') then 'closed_lost'
  when lower(btrim(coalesce(pipeline_stage, ''))) = 'unresponsive' then 'unresponsive'
  when lower(btrim(coalesce(pipeline_stage, ''))) = 'spam' then 'spam'
  else status
end;

alter table public.vendor_inquiry_leads
  add constraint vendor_inquiry_leads_status_check
  check (status in ('new','assigned','contacted','qualified','appointment_scheduled','viewed','negotiation','closed_won','closed_lost','unresponsive','spam')),
  add constraint vendor_inquiry_leads_pipeline_stage_check
  check (pipeline_stage in ('new','assigned','contacted','qualified','appointment_scheduled','viewed','negotiation','closed_won','closed_lost','unresponsive','spam')),
  add constraint vendor_inquiry_leads_priority_check
  check (priority in ('low','normal','high','urgent')),
  add constraint vendor_inquiry_leads_source_check
  check (source in ('listing_detail_form','phone_click','whatsapp_click','messenger_click','appointment_request','hero_ad','search_boost','category_boost','manual_entry','imported','agency_direct','marketplace_routed'));

alter table public.viewing_requests
  drop constraint if exists viewing_requests_lead_status_check;

update public.viewing_requests
set lead_status = case
  when lower(btrim(coalesce(lead_status, ''))) = 'new' then 'new'
  when lower(btrim(coalesce(lead_status, ''))) = 'contacted' then 'contacted'
  when lower(btrim(coalesce(lead_status, ''))) in ('scheduled','appointment_scheduled') then 'appointment_scheduled'
  when lower(btrim(coalesce(lead_status, ''))) = 'viewed' then 'viewed'
  when lower(btrim(coalesce(lead_status, ''))) in ('closed','closed_won') then 'closed_won'
  when lower(btrim(coalesce(lead_status, ''))) in ('lost','closed_lost') then 'closed_lost'
  when lower(btrim(coalesce(lead_status, ''))) in ('assigned','qualified','negotiation','unresponsive','spam') then lower(btrim(lead_status))
  else 'new'
end;

alter table public.viewing_requests
  add constraint viewing_requests_lead_status_check
  check (lead_status in ('new','assigned','contacted','qualified','appointment_scheduled','viewed','negotiation','closed_won','closed_lost','unresponsive','spam'));

alter table public.appointments
  add column if not exists lead_id uuid references public.vendor_inquiry_leads(id) on delete set null,
  add column if not exists scheduled_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists cancelled_reason text;

alter table public.appointments
  drop constraint if exists appointments_status_check;

update public.appointments
set status = case
  when lower(btrim(status)) = 'scheduled' then 'confirmed'
  when lower(btrim(status)) = 'canceled' then 'cancelled'
  when lower(btrim(status)) in ('requested','confirmed','completed','cancelled','no_show') then lower(btrim(status))
  else 'requested'
end;

update public.appointments
set scheduled_at = coalesce(scheduled_at, start_at)
where scheduled_at is null;

update public.appointments
set completed_at = coalesce(completed_at, updated_at, start_at)
where status = 'completed' and completed_at is null;

alter table public.appointments
  add constraint appointments_status_check
  check (status in ('requested','confirmed','completed','cancelled','no_show'));
