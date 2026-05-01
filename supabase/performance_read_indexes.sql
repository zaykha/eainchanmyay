create index if not exists properties_public_feed_idx
  on public.properties(status, is_deleted, created_at desc);

create index if not exists properties_created_by_active_idx
  on public.properties(created_by, is_deleted, created_at desc);

create index if not exists property_images_property_cover_idx
  on public.property_images(property_id, is_cover desc, sort_order asc);

create index if not exists viewing_requests_user_created_idx
  on public.viewing_requests(user_id, created_at desc);

create index if not exists saved_properties_user_created_idx
  on public.saved_properties(user_id, created_at desc);

create index if not exists saved_properties_user_property_idx
  on public.saved_properties(user_id, property_id);

create index if not exists inquiries_user_created_idx
  on public.inquiries(user_id, created_at desc);

create index if not exists sales_requests_user_created_idx
  on public.sales_requests(user_id, created_at desc);

create index if not exists sales_requests_vendor_created_idx
  on public.sales_requests(vendor_id, created_at desc);
