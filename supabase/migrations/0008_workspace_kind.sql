-- Persist the workspace experience selected during onboarding.
alter table public.workspaces
  add column if not exists workspace_kind text not null default 'planner'
  check (workspace_kind in ('planner', 'couple'));

comment on column public.workspaces.workspace_kind is
  'Initial experience selected by the workspace creator; authorization remains membership/RLS based.';
