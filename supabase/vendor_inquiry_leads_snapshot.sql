alter table public.vendor_inquiry_leads
  add column if not exists deal_type text,
  add column if not exists property_type text,
  add column if not exists state_region text,
  add column if not exists district text,
  add column if not exists township text,
  add column if not exists budget_range text,
  add column if not exists timeline text,
  add column if not exists bedrooms integer,
  add column if not exists bathrooms integer,
  add column if not exists area_sqft integer,
  add column if not exists need_parking boolean,
  add column if not exists need_lift boolean,
  add column if not exists need_solar boolean,
  add column if not exists need_generator boolean;

alter table public.vendor_inquiry_leads
  alter column pipeline_stage set default 'new_lead',
  alter column sla_due_at set default (now() + interval '24 hours');

update public.vendor_inquiry_leads as lead
set
  deal_type = coalesce(lead.deal_type, inquiry.deal_type),
  property_type = coalesce(lead.property_type, inquiry.property_type),
  state_region = coalesce(lead.state_region, inquiry.state_region),
  district = coalesce(lead.district, inquiry.district),
  township = coalesce(lead.township, inquiry.township),
  budget_range = coalesce(lead.budget_range, inquiry.budget_range),
  timeline = coalesce(lead.timeline, inquiry.timeline),
  bedrooms = coalesce(lead.bedrooms, inquiry.bedrooms),
  bathrooms = coalesce(lead.bathrooms, inquiry.bathrooms),
  area_sqft = coalesce(lead.area_sqft, inquiry.area_sqft),
  need_parking = coalesce(lead.need_parking, inquiry.need_parking),
  need_lift = coalesce(lead.need_lift, inquiry.need_lift),
  need_solar = coalesce(lead.need_solar, inquiry.need_solar),
  need_generator = coalesce(lead.need_generator, inquiry.need_generator),
  pipeline_stage = coalesce(nullif(btrim(lead.pipeline_stage), ''), 'new_lead'),
  sla_due_at = coalesce(lead.sla_due_at, lead.created_at + interval '24 hours')
from public.inquiries as inquiry
where inquiry.id = lead.inquiry_id;
