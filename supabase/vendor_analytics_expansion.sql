create table if not exists public.property_view_events (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  viewer_user_id uuid references public.profiles(id) on delete set null,
  session_id text,
  source text not null default 'listing_detail',
  ip_hash text,
  user_agent text,
  viewed_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists property_view_events_property_idx
  on public.property_view_events(property_id, viewed_at desc);

create index if not exists property_view_events_viewer_idx
  on public.property_view_events(viewer_user_id, viewed_at desc);

create index if not exists property_view_events_session_idx
  on public.property_view_events(session_id, viewed_at desc);

select property_id, count(*) as total_views
from public.property_view_events
group by property_id
order by total_views desc
limit 20;
