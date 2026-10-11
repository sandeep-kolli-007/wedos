-- Guest list and RSVP tracking per wedding.
create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  first_name text not null,
  last_name text,
  email text,
  phone text,
  side text not null default 'other' check (side in ('bride','groom','shared','other')),
  rsvp_status text not null default 'pending' check (rsvp_status in ('pending','invited','attending','declined')),
  party_size integer not null default 1 check (party_size between 1 and 20),
  dietary_notes text,
  notes text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists guests_wedding_idx on public.guests (workspace_id, wedding_id, last_name, first_name);
alter table public.guests enable row level security;
drop policy if exists "guests: workspace access" on public.guests;
create policy "guests: workspace access" on public.guests
  for all to authenticated
  using (private.is_workspace_member(workspace_id))
  with check (private.is_workspace_member(workspace_id));
grant select, insert, update, delete on public.guests to authenticated;
