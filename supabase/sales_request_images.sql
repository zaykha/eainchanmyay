create table if not exists public.sales_request_images (
  id uuid primary key default gen_random_uuid(),
  sales_request_id uuid not null references public.sales_requests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  r2_key text not null,
  public_url text null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists sales_request_images_request_idx
  on public.sales_request_images (sales_request_id, sort_order);

create index if not exists sales_request_images_user_idx
  on public.sales_request_images (user_id, created_at desc);
