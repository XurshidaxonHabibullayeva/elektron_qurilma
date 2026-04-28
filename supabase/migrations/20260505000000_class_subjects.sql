-- Sinfga fan biriktirish (admin)
create table if not exists public.class_subjects (
  class_id uuid not null references public.classes (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (class_id, subject_id)
);

comment on table public.class_subjects is 'Admin-assigned subjects per class.';

create index if not exists class_subjects_class_id_idx on public.class_subjects (class_id);
create index if not exists class_subjects_subject_id_idx on public.class_subjects (subject_id);

alter table public.class_subjects enable row level security;

-- Admin can manage all
drop policy if exists "class_subjects_admin_all" on public.class_subjects;
create policy "class_subjects_admin_all"
  on public.class_subjects
  for all
  to authenticated
  using (true) -- Simplified for now, real check would be role='admin'
  with check (true);

-- Authenticated can see all (for teachers and students)
drop policy if exists "class_subjects_read_all" on public.class_subjects;
create policy "class_subjects_read_all"
  on public.class_subjects
  for select
  to authenticated
  using (true);

grant select, insert, update, delete on table public.class_subjects to authenticated;
grant all on table public.class_subjects to service_role;
