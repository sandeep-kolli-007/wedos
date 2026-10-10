-- Securely create the first workspace and owner membership as one transaction.
create or replace function public.create_workspace_for_current_user(workspace_name text, workspace_slug text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  new_workspace_id uuid;
  clean_name text := btrim(workspace_name);
  clean_slug text := lower(btrim(workspace_slug));
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if clean_name is null or length(clean_name) < 2 or length(clean_name) > 80 then
    raise exception 'Workspace name must be between 2 and 80 characters' using errcode = '22023';
  end if;
  if clean_slug is null or clean_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or length(clean_slug) > 48 then
    raise exception 'Workspace slug is invalid' using errcode = '22023';
  end if;
  if exists (select 1 from public.workspace_members where user_id = actor_id) then
    raise exception 'You already belong to a workspace' using errcode = '23505';
  end if;
  insert into public.workspaces (name, slug, created_by)
  values (clean_name, clean_slug, actor_id)
  returning id into new_workspace_id;
  insert into public.workspace_members (workspace_id, user_id, role)
  values (new_workspace_id, actor_id, 'owner');
  return new_workspace_id;
end;
$$;

revoke all on function public.create_workspace_for_current_user(text, text) from public;
revoke all on function public.create_workspace_for_current_user(text, text) from anon;
grant execute on function public.create_workspace_for_current_user(text, text) to authenticated;

grant select, insert, update, delete on public.workspaces, public.workspace_members,
  public.clients, public.weddings, public.wedding_members, public.events, public.tasks,
  public.vendors, public.vendor_bookings, public.budget_categories, public.payment_milestones,
  public.design_assets, public.documents, public.activity_log to authenticated;
grant select, update on public.profiles to authenticated;
