alter table public.sales_requests
  add column if not exists floor_count integer,
  add column if not exists room_count integer;

alter table public.sales_requests
  drop constraint if exists sales_requests_floor_count_check,
  drop constraint if exists sales_requests_room_count_check;

alter table public.sales_requests
  add constraint sales_requests_floor_count_check
    check (floor_count is null or floor_count > 0),
  add constraint sales_requests_room_count_check
    check (room_count is null or room_count > 0);
