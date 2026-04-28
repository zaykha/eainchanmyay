alter table public.vendors
  add column if not exists slug text,
  add column if not exists tagline text,
  add column if not exists description text,
  add column if not exists contact_phone text,
  add column if not exists contact_email text,
  add column if not exists logo_url text,
  add column if not exists cover_image_url text,
  add column if not exists strengths text[] not null default '{}',
  add column if not exists public_storefront_enabled boolean not null default true;

with prepared as (
  select
    id,
    coalesce(
      nullif(
        trim(both '-' from lower(regexp_replace(coalesce(name, 'agency'), '[^a-zA-Z0-9]+', '-', 'g'))),
        ''
      ),
      'agency'
    ) as base_slug
  from public.vendors
),
deduped as (
  select
    id,
    base_slug,
    row_number() over (partition by base_slug order by id) as slug_rank
  from prepared
)
update public.vendors as vendors
set slug = case
  when deduped.slug_rank = 1 then deduped.base_slug
  else deduped.base_slug || '-' || deduped.slug_rank
end
from deduped
where vendors.id = deduped.id
  and (vendors.slug is null or btrim(vendors.slug) = '');

drop index if exists vendors_slug_unique_idx;
create unique index if not exists vendors_slug_unique_idx
  on public.vendors (lower(slug))
  where slug is not null;

alter table public.vendors
  drop constraint if exists vendors_slug_format_check;

alter table public.vendors
  add constraint vendors_slug_format_check
  check (slug is null or slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');

create index if not exists vendors_public_storefront_idx
  on public.vendors (public_storefront_enabled, lower(slug));

-- Verification queries
select id, name, slug, public_storefront_enabled
from public.vendors
order by created_at desc nulls last
limit 20;
