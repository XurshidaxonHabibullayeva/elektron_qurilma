-- Lessons authored by teachers; teachers can read class/subject catalogs.

create or replace function public.current_is_teacher()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'teacher'
  );
$$;

grant execute on function public.current_is_teacher() to authenticated;

drop policy if exists "classes_select_teacher" on public.classes;
drop policy if exists "subjects_select_teacher" on public.subjects;

-- Teachers may list classes/subjects when building lessons (read-only).
create policy "classes_select_teacher"
  on public.classes
  for select
  to authenticated
  using (public.current_is_teacher());

create policy "subjects_select_teacher"
  on public.subjects
  for select
  to authenticated
  using (public.current_is_teacher());

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users (id) on delete cascade,
  class_id uuid not null references public.classes (id) on delete restrict,
  subject_id uuid not null references public.subjects (id) on delete restrict,
  title text not null,
  description text,
  video_url text,
  material_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.lessons is 'Teacher-authored lesson metadata and resource links.';

create index if not exists lessons_teacher_created_idx
  on public.lessons (teacher_id, created_at desc);

alter table public.lessons enable row level security;

drop policy if exists "lessons_select_own_teacher" on public.lessons;
drop policy if exists "lessons_insert_teacher" on public.lessons;
drop policy if exists "lessons_update_own_teacher" on public.lessons;
drop policy if exists "lessons_delete_own_teacher" on public.lessons;

create policy "lessons_select_own_teacher"
  on public.lessons
  for select
  to authenticated
  using (
    teacher_id = (select auth.uid())
    and public.current_is_teacher()
  );

create policy "lessons_insert_teacher"
  on public.lessons
  for insert
  to authenticated
  with check (
    teacher_id = (select auth.uid())
    and public.current_is_teacher()
  );

create policy "lessons_update_own_teacher"
  on public.lessons
  for update
  to authenticated
  using (
    teacher_id = (select auth.uid())
    and public.current_is_teacher()
  )
  with check (
    teacher_id = (select auth.uid())
    and public.current_is_teacher()
  );

create policy "lessons_delete_own_teacher"
  on public.lessons
  for delete
  to authenticated
  using (
    teacher_id = (select auth.uid())
    and public.current_is_teacher()
  );

grant select, insert, update, delete on table public.lessons to authenticated;
grant all on table public.lessons to service_role;
