-- O'quvchini fanga biriktirish (admin)
create table if not exists public.student_subjects (
  student_id uuid not null references auth.users (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (student_id, subject_id)
);

comment on table public.student_subjects is 'Admin-assigned subjects per student; empty means all subjects of their class are shown.';

create index if not exists student_subjects_student_id_idx on public.student_subjects (student_id);
create index if not exists student_subjects_subject_id_idx on public.student_subjects (subject_id);

alter table public.student_subjects enable row level security;

-- Admin can manage all
create policy "student_subjects_admin_all"
  on public.student_subjects
  for all
  to authenticated
  using (public.current_is_admin())
  with check (public.current_is_admin());

-- Student can see their own assignments
create policy "student_subjects_select_own"
  on public.student_subjects
  for select
  to authenticated
  using (student_id = (select auth.uid()));

grant select, insert, update, delete on table public.student_subjects to authenticated;
grant all on table public.student_subjects to service_role;
