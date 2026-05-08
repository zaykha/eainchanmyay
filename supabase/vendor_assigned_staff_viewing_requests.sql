alter table public.viewing_requests
  add column if not exists assigned_staff_id uuid references auth.users(id) on delete set null;

create index if not exists viewing_requests_assigned_staff_id_idx
  on public.viewing_requests(assigned_staff_id);
