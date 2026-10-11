-- Keep RLS helper functions outside the exposed public API schema.
-- The workspace-creation RPC remains in public because the application calls it.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

do $$
begin
  if to_regprocedure('public.is_workspace_member(uuid)') is not null then
    execute 'alter function public.is_workspace_member(uuid) set schema private';
  end if;
  if to_regprocedure('public.has_workspace_role(uuid,public.workspace_role[])') is not null then
    execute 'alter function public.has_workspace_role(uuid, public.workspace_role[]) set schema private';
  end if;
end
$$;

revoke all on function private.is_workspace_member(uuid) from public, anon;
revoke all on function private.has_workspace_role(uuid, public.workspace_role[]) from public, anon;
grant execute on function private.is_workspace_member(uuid) to authenticated;
grant execute on function private.has_workspace_role(uuid, public.workspace_role[]) to authenticated;
