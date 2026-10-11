-- Restrict workspace data policies to signed-in users and avoid per-row auth lookups.
alter policy "profiles: self or workspace peer" on public.profiles to authenticated
using (
  id = (select auth.uid()) or exists (
    select 1
    from public.workspace_members me
    join public.workspace_members peer on me.workspace_id = peer.workspace_id
    where me.user_id = (select auth.uid()) and peer.user_id = profiles.id
  )
);
alter policy "profiles: self update" on public.profiles to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));

alter policy "workspaces: members read" on public.workspaces to authenticated
using (private.is_workspace_member(id));
alter policy "workspaces: owner/admin update" on public.workspaces to authenticated
using (private.has_workspace_role(id, array['owner','admin']::public.workspace_role[]))
with check (private.has_workspace_role(id, array['owner','admin']::public.workspace_role[]));
alter policy "workspaces: authenticated create" on public.workspaces to authenticated
with check (created_by = (select auth.uid()));

alter policy "workspace members: members read" on public.workspace_members to authenticated
using (private.is_workspace_member(workspace_id));
drop policy if exists "workspace members: admins manage" on public.workspace_members;
create policy "workspace members: admins insert" on public.workspace_members
for insert to authenticated
with check (private.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[]));
create policy "workspace members: admins update" on public.workspace_members
for update to authenticated
using (private.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[]))
with check (private.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[]));
create policy "workspace members: admins delete" on public.workspace_members
for delete to authenticated
using (private.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[]));

alter policy "clients: workspace access" on public.clients to authenticated;
alter policy "weddings: workspace access" on public.weddings to authenticated;
alter policy "wedding members: workspace access" on public.wedding_members to authenticated;
alter policy "events: workspace access" on public.events to authenticated;
alter policy "tasks: workspace access" on public.tasks to authenticated;
alter policy "vendors: workspace access" on public.vendors to authenticated;
alter policy "vendor bookings: workspace access" on public.vendor_bookings to authenticated;
alter policy "budget categories: workspace access" on public.budget_categories to authenticated;
alter policy "payment milestones: workspace access" on public.payment_milestones to authenticated;
alter policy "design assets: workspace access" on public.design_assets to authenticated;
alter policy "documents: workspace access" on public.documents to authenticated;
alter policy "activity log: workspace read" on public.activity_log to authenticated;
alter policy "activity log: workspace insert" on public.activity_log to authenticated;
