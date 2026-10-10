-- WedOS core schema — PostgreSQL / Supabase
-- Multi-tenant by planner workspace. Apply through Supabase migrations after configuring the project.

create extension if not exists pgcrypto;

create type public.workspace_role as enum ('owner', 'admin', 'planner', 'designer', 'finance', 'viewer');
create type public.wedding_status as enum ('lead', 'planning', 'confirmed', 'completed', 'archived');
create type public.task_status as enum ('todo', 'in_progress', 'blocked', 'done');
create type public.payment_status as enum ('planned', 'due', 'paid', 'overdue', 'cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  avatar_url text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  currency char(3) not null default 'INR',
  timezone text not null default 'Asia/Kolkata',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.workspace_role not null default 'planner',
  invited_by uuid references public.profiles(id),
  joined_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  display_name text not null,
  email text,
  phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.weddings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  title text not null,
  couple_names text,
  status public.wedding_status not null default 'planning',
  start_date date,
  end_date date,
  venue_name text,
  venue_city text,
  guest_count integer check (guest_count is null or guest_count >= 0),
  budget numeric(14,2) not null default 0 check (budget >= 0),
  currency char(3) not null default 'INR',
  cover_image_url text,
  notes text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or start_date is null or end_date >= start_date)
);

create table public.wedding_members (
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  access_level public.workspace_role not null default 'planner',
  primary key (wedding_id, user_id)
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  title text not null,
  event_type text not null default 'other',
  starts_at timestamptz,
  ends_at timestamptz,
  venue_name text,
  venue_address text,
  owner_id uuid references public.profiles(id) on delete set null,
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at >= starts_at)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  wedding_id uuid references public.weddings(id) on delete cascade,
  event_id uuid references public.events(id) on delete set null,
  title text not null,
  description text,
  status public.task_status not null default 'todo',
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  due_at timestamptz,
  assignee_id uuid references public.profiles(id) on delete set null,
  created_by uuid not null references public.profiles(id),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  business_name text not null,
  category text not null,
  contact_name text,
  email text,
  phone text,
  website text,
  city text,
  notes text,
  rating numeric(2,1) check (rating is null or rating between 0 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vendor_bookings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  vendor_id uuid not null references public.vendors(id) on delete restrict,
  event_id uuid references public.events(id) on delete set null,
  service_description text not null,
  quoted_amount numeric(14,2) not null default 0 check (quoted_amount >= 0),
  final_amount numeric(14,2) check (final_amount is null or final_amount >= 0),
  status text not null default 'proposed' check (status in ('proposed','quoted','confirmed','completed','cancelled')),
  contract_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.budget_categories (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  name text not null,
  planned_amount numeric(14,2) not null default 0 check (planned_amount >= 0),
  created_at timestamptz not null default now()
);

create table public.payment_milestones (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  vendor_booking_id uuid references public.vendor_bookings(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  title text not null,
  amount numeric(14,2) not null check (amount >= 0),
  due_date date,
  paid_at timestamptz,
  status public.payment_status not null default 'planned',
  reference text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.design_assets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  title text not null,
  asset_type text not null default 'moodboard',
  status text not null default 'draft' check (status in ('draft','in_review','approved','published','archived')),
  storage_path text,
  preview_url text,
  version integer not null default 1 check (version > 0),
  created_by uuid not null references public.profiles(id),
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  wedding_id uuid references public.weddings(id) on delete cascade,
  title text not null,
  document_type text not null default 'other',
  storage_path text not null,
  uploaded_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.activity_log (
  id bigint generated always as identity primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  wedding_id uuid references public.weddings(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index weddings_workspace_dates_idx on public.weddings(workspace_id, start_date);
create index events_wedding_starts_idx on public.events(wedding_id, starts_at);
create index tasks_workspace_due_idx on public.tasks(workspace_id, status, due_at);
create index tasks_assignee_idx on public.tasks(assignee_id, status);
create index vendor_bookings_wedding_idx on public.vendor_bookings(wedding_id, status);
create index payments_wedding_due_idx on public.payment_milestones(wedding_id, due_date, status);
create index activity_workspace_created_idx on public.activity_log(workspace_id, created_at desc);

create or replace function public.is_workspace_member(target_workspace uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.workspace_members wm where wm.workspace_id = target_workspace and wm.user_id = auth.uid()) $$;

create or replace function public.has_workspace_role(target_workspace uuid, allowed public.workspace_role[])
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.workspace_members wm where wm.workspace_id = target_workspace and wm.user_id = auth.uid() and wm.role = any(allowed)) $$;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.clients enable row level security;
alter table public.weddings enable row level security;
alter table public.wedding_members enable row level security;
alter table public.events enable row level security;
alter table public.tasks enable row level security;
alter table public.vendors enable row level security;
alter table public.vendor_bookings enable row level security;
alter table public.budget_categories enable row level security;
alter table public.payment_milestones enable row level security;
alter table public.design_assets enable row level security;
alter table public.documents enable row level security;
alter table public.activity_log enable row level security;

create policy "profiles: self or workspace peer" on public.profiles for select using (
  id = auth.uid() or exists (
    select 1 from public.workspace_members me join public.workspace_members peer on me.workspace_id = peer.workspace_id
    where me.user_id = auth.uid() and peer.user_id = profiles.id
  )
);
create policy "profiles: self update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "workspaces: members read" on public.workspaces for select using (public.is_workspace_member(id));
create policy "workspaces: owner/admin update" on public.workspaces for update using (public.has_workspace_role(id, array['owner','admin']::public.workspace_role[]));
create policy "workspaces: authenticated create" on public.workspaces for insert to authenticated with check (created_by = auth.uid());
create policy "workspace members: members read" on public.workspace_members for select using (public.is_workspace_member(workspace_id));
create policy "workspace members: admins manage" on public.workspace_members for all using (public.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[])) with check (public.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[]));

create policy "clients: workspace access" on public.clients for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "weddings: workspace access" on public.weddings for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "wedding members: workspace access" on public.wedding_members for all using (
  exists (select 1 from public.weddings w where w.id = wedding_id and public.is_workspace_member(w.workspace_id))
) with check (
  exists (select 1 from public.weddings w where w.id = wedding_id and public.is_workspace_member(w.workspace_id))
);
create policy "events: workspace access" on public.events for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "tasks: workspace access" on public.tasks for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "vendors: workspace access" on public.vendors for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "vendor bookings: workspace access" on public.vendor_bookings for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "budget categories: workspace access" on public.budget_categories for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "payment milestones: workspace access" on public.payment_milestones for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "design assets: workspace access" on public.design_assets for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "documents: workspace access" on public.documents for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "activity log: workspace read" on public.activity_log for select using (public.is_workspace_member(workspace_id));
create policy "activity log: workspace insert" on public.activity_log for insert with check (public.is_workspace_member(workspace_id));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();
