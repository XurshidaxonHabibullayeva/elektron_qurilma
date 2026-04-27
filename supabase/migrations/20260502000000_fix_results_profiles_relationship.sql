alter table public.results
  drop constraint if exists results_student_id_fkey;

alter table public.results
  add constraint results_student_id_fkey
  foreign key (student_id)
  references public.profiles(id)
  on delete cascade;

-- Also fix lessons table for future consistency
alter table public.lessons
  drop constraint if exists lessons_teacher_id_fkey;

alter table public.lessons
  add constraint lessons_teacher_id_fkey
  foreign key (teacher_id)
  references public.profiles(id)
  on delete cascade;
