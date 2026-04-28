insert into storage.buckets (id, name, public)
values ('materials', 'materials', true)
on conflict (id) do nothing;

create policy "Anyone can upload materials"
  on storage.objects for insert
  with check ( bucket_id = 'materials' and auth.role() = 'authenticated' );

create policy "Anyone can update materials"
  on storage.objects for update
  using ( bucket_id = 'materials' and auth.role() = 'authenticated' );

create policy "Anyone can read materials"
  on storage.objects for select
  using ( bucket_id = 'materials' );

create policy "Anyone can delete materials"
  on storage.objects for delete
  using ( bucket_id = 'materials' and auth.role() = 'authenticated' );
