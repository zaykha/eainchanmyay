alter table public.vendors
  add column if not exists facebook_url text,
  add column if not exists telegram_url text,
  add column if not exists viber_phone text,
  add column if not exists tiktok_url text,
  add column if not exists website_url text;
