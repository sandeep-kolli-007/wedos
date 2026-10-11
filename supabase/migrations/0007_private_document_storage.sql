-- Private document storage for planner workspaces.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'wedos-documents',
  'wedos-documents',
  false,
  20971520,
  array['application/pdf','image/jpeg','image/png','image/webp','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 20971520,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "WedOS documents: workspace members can read" on storage.objects;
create policy "WedOS documents: workspace members can read"
on storage.objects for select to authenticated
using (
  bucket_id = 'wedos-documents'
  and exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id::text = (storage.foldername(name))[1]
      and wm.user_id = auth.uid()
  )
);

drop policy if exists "WedOS documents: workspace members can upload" on storage.objects;
create policy "WedOS documents: workspace members can upload"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'wedos-documents'
  and exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id::text = (storage.foldername(name))[1]
      and wm.user_id = auth.uid()
  )
);

drop policy if exists "WedOS documents: workspace members can update" on storage.objects;
create policy "WedOS documents: workspace members can update"
on storage.objects for update to authenticated
using (
  bucket_id = 'wedos-documents'
  and exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id::text = (storage.foldername(name))[1]
      and wm.user_id = auth.uid()
  )
)
with check (
  bucket_id = 'wedos-documents'
  and exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id::text = (storage.foldername(name))[1]
      and wm.user_id = auth.uid()
  )
);

drop policy if exists "WedOS documents: workspace members can delete" on storage.objects;
create policy "WedOS documents: workspace members can delete"
on storage.objects for delete to authenticated
using (
  bucket_id = 'wedos-documents'
  and exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id::text = (storage.foldername(name))[1]
      and wm.user_id = auth.uid()
  )
);
