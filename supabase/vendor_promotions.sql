create table if not exists public.vendor_promotions (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  listing_id uuid null references public.properties(id) on delete set null,
  promotion_type text not null check (promotion_type in ('hero_ad', 'search_ranking', 'listing_boost')),
  target_type text not null check (target_type in ('agency_profile', 'listing')),
  status text not null default 'draft' check (status in ('draft', 'pending_payment', 'pending_activation', 'active', 'paused', 'expired', 'cancelled')),
  title text null,
  description text null,
  banner_image_url text null,
  target_url text null,
  price_per_24h numeric(12, 2) null check (price_per_24h is null or price_per_24h >= 0),
  price_paid numeric(12, 2) null check (price_paid is null or price_paid >= 0),
  duration_hours integer not null check (duration_hours > 0),
  starts_at timestamptz null,
  ends_at timestamptz null,
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vendor_promotions_target_check check (
    (target_type = 'agency_profile' and listing_id is null and promotion_type = 'hero_ad')
    or
    (target_type = 'listing' and listing_id is not null)
  ),
  constraint vendor_promotions_type_target_check check (
    (promotion_type = 'hero_ad' and target_type in ('agency_profile', 'listing'))
    or
    (promotion_type in ('search_ranking', 'listing_boost') and target_type = 'listing')
  )
);

create index if not exists vendor_promotions_vendor_status_idx
  on public.vendor_promotions (vendor_id, status, starts_at, ends_at);

create index if not exists vendor_promotions_listing_idx
  on public.vendor_promotions (listing_id);
