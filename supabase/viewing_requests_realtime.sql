alter table public.viewing_requests
  add column if not exists last_activity_at timestamptz not null default now();

update public.viewing_requests
set last_activity_at = coalesce(last_activity_at, updated_at, created_at);

create table if not exists public.vendor_viewing_request_reads (
  request_id uuid not null references public.viewing_requests(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (request_id, user_id)
);

create index if not exists vendor_viewing_request_reads_user_idx
  on public.vendor_viewing_request_reads(user_id, last_read_at desc);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'viewing_requests'
  ) then
    alter publication supabase_realtime add table public.viewing_requests;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'vendor_viewing_request_reads'
  ) then
    alter publication supabase_realtime add table public.vendor_viewing_request_reads;
  end if;
end
$$;
