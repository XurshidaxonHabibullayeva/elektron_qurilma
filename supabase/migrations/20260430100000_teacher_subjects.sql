-- O‘qituvchini fanga biriktirish (admin); o‘qituvchi o‘z qatorlarini ko‘radi.

create table if not exists public.teacher_subjects (
  teacher_id uuid not null references auth.users (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (teacher_id, subject_id)
);

comment on table public.teacher_subjects is 'Admin-assigned subjects per teacher; empty means all catalog subjects allowed in UI.';

create index if not exists teacher_subjects_teacher_id_idx on public.teacher_subjects (teacher_id);
create index if not exists teacher_subjects_subject_id_idx on public.teacher_subjects (subject_id);

alter table public.teacher_subjects enable row level security;

drop policy if exists "teacher_subjects_admin_all" on public.teacher_subjects;

create policy "teacher_subjects_admin_all"
  on public.teacher_subjects
  for all
  to authenticated
  using (public.current_is_admin())
  with check (public.current_is_admin());

drop policy if exists "teacher_subjects_select_own" on public.teacher_subjects;

create policy "teacher_subjects_select_own"
  on public.teacher_subjects
  for select
  to authenticated
  using (teacher_id = (select auth.uid()));

grant select, insert, update, delete on table public.teacher_subjects to authenticated;
grant all on table public.teacher_subjects to service_role;
