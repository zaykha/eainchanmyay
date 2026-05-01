alter table public.sales_requests
  add column if not exists review_status text;

update public.sales_requests
set review_status = case
  when review_status is null or btrim(review_status) = '' then 'pending'
  when lower(btrim(review_status)) in ('pending', 'approved', 'rejected', 'changes_requested') then lower(btrim(review_status))
  else 'pending'
end;

alter table public.sales_requests
  alter column review_status set default 'pending',
  alter column review_status set not null;

alter table public.sales_requests
  drop constraint if exists sales_requests_review_status_check;

alter table public.sales_requests
  add constraint sales_requests_review_status_check
  check (review_status in ('pending', 'approved', 'rejected', 'changes_requested'));
