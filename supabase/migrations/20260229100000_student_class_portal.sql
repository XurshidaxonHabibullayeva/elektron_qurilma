-- Student belongs to a class; can read lessons in that class and related catalog rows.

alter table public.profiles
  add column if not exists class_id uuid references public.classes (id) on delete set null;

comment on column public.profiles.class_id is 'Student homeroom/class; set by admin (SQL or future UI).';

-- Student may read their assigned class row.
drop policy if exists "classes_select_student_own_class" on public.classes;
create policy "classes_select_student_own_class"
  on public.classes
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'student'
        and p.class_id is not null
        and p.class_id = classes.id
    )
  );

-- Student may read subjects that appear in at least one lesson for their class.
drop policy if exists "subjects_select_student_class_lessons" on public.subjects;
create policy "subjects_select_student_class_lessons"
  on public.subjects
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.lessons l
      inner join public.profiles p
        on p.id = (select auth.uid())
        and p.role = 'student'
        and p.class_id is not null
        and l.class_id = p.class_id
      where l.subject_id = subjects.id
    )
  );

-- Student may read lessons in their class (any teacher).
drop policy if exists "lessons_select_student_in_class" on public.lessons;
create policy "lessons_select_student_in_class"
  on public.lessons
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'student'
        and p.class_id is not null
        and p.class_id = lessons.class_id
    )
  );
