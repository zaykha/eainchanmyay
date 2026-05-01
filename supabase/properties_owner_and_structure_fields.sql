alter table public.properties
  add column if not exists floor_count integer,
  add column if not exists room_count integer,
  add column if not exists owner_name text,
  add column if not exists owner_phone text,
  add column if not exists owner_phone_secondary text;

alter table public.properties
  drop constraint if exists properties_floor_count_check,
  drop constraint if exists properties_room_count_check;

alter table public.properties
  add constraint properties_floor_count_check
    check (floor_count is null or floor_count > 0),
  add constraint properties_room_count_check
    check (room_count is null or room_count > 0);
