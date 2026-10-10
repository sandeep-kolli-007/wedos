-- Harden helper function execution and workspace-level write privileges.
-- RLS helper functions use auth.uid() and are only callable by signed-in users.
revoke all on function public.is_workspace_member(uuid) from public;
revoke all on function public.is_workspace_member(uuid) from anon;
grant execute on function public.is_workspace_member(uuid) to authenticated;

revoke all on function public.has_workspace_role(uuid, public.workspace_role[]) from public;
revoke all on function public.has_workspace_role(uuid, public.workspace_role[]) from anon;
grant execute on function public.has_workspace_role(uuid, public.workspace_role[]) to authenticated;

-- The auth trigger owns this function; it must not be exposed as a callable API function.
revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon;
revoke all on function public.handle_new_user() from authenticated;

drop policy if exists "workspaces: owner/admin update" on public.workspaces;
create policy "workspaces: owner/admin update" on public.workspaces
  for update to authenticated
  using (public.has_workspace_role(id, array['owner','admin']::public.workspace_role[]))
  with check (public.has_workspace_role(id, array['owner','admin']::public.workspace_role[]));

-- Workspace creation must go through the atomic owner-membership RPC.
revoke insert on public.workspaces from authenticated;
