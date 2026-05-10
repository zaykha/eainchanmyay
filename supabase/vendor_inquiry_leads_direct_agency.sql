alter table public.vendor_inquiry_leads
  alter column inquiry_id drop not null,
  add column if not exists requester_user_id uuid null references public.profiles(id) on delete set null,
  add column if not exists contact_number text;

create index if not exists vendor_inquiry_leads_requester_idx
  on public.vendor_inquiry_leads(requester_user_id);

update public.vendor_inquiry_leads as lead
set
  requester_user_id = coalesce(lead.requester_user_id, inquiry.user_id),
  contact_number = coalesce(lead.contact_number, profile.phone)
from public.inquiries as inquiry
left join public.profiles as profile
  on profile.id = inquiry.user_id
where inquiry.id = lead.inquiry_id;
