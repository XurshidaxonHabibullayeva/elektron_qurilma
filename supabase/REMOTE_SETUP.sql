-- =============================================================================
-- REMOTE_SETUP.sql — Supabase Cloud (Dashboard → SQL Editor) da BIR MARTA ishga tushiring
-- =============================================================================
-- Muammo: PGRST205 / "Could not find the table 'public.profiles'" bo‘lsa, shu skript
-- barcha kerakli jadvallar, RLS, trigger va funksiyalarni yaratadi.
--
-- 1) Supabase Dashboard → SQL → New query
-- 2) Ushbu faylning BARCHA mazmunini nusxalang → Run (yoki Ctrl+Enter)
-- 3) "Success" dan keyin ilovada Chiqish → qayta kiring
--
-- Eslatma: agar ayrim qismlar allaqachon bo‘lsa, xato chiqishi mumkin — xabarni
-- o‘qing; ko‘pincha bo‘sh loyhada bir marta ishlatiladi.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 20260226000000_profiles.sql
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid not null references auth.users (id) on delete cascade,
  full_name text,
  role text not null default 'student',
  updated_at timestamptz not null default timezone('utc', now()),
  constraint profiles_role_check check (role in ('admin', 'teacher', 'student')),
  primary key (id)
);

comment on table public.profiles is 'App profile; role drives routing. Change role in SQL or service role.';

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;

create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', '')), ''),
    'student'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

grant select, insert on table public.profiles to authenticated;
grant all on table public.profiles to service_role;


-- ---------------------------------------------------------------------------
-- 20260227120000_classes_subjects.sql
-- ---------------------------------------------------------------------------

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default timezone('utc', now())
);

comment on table public.classes is 'School class label, e.g. 5-sinf';
comment on table public.subjects is 'Subject name, e.g. Math';

create index if not exists classes_created_at_idx on public.classes (created_at desc);
create index if not exists subjects_created_at_idx on public.subjects (created_at desc);

create or replace function public.current_is_admin()
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
      and p.role = 'admin'
  );
$$;

grant execute on function public.current_is_admin() to authenticated;

alter table public.classes enable row level security;
alter table public.subjects enable row level security;

drop policy if exists "classes_admin_all" on public.classes;
drop policy if exists "subjects_admin_all" on public.subjects;

create policy "classes_admin_all"
  on public.classes
  for all
  to authenticated
  using (public.current_is_admin())
  with check (public.current_is_admin());

create policy "subjects_admin_all"
  on public.subjects
  for all
  to authenticated
  using (public.current_is_admin())
  with check (public.current_is_admin());

grant select, insert, update, delete on table public.classes to authenticated;
grant select, insert, update, delete on table public.subjects to authenticated;
grant all on table public.classes to service_role;
grant all on table public.subjects to service_role;


-- ---------------------------------------------------------------------------
-- 20260228140000_teacher_lessons.sql
-- ---------------------------------------------------------------------------

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


-- ---------------------------------------------------------------------------
-- 20260229100000_student_class_portal.sql
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists class_id uuid references public.classes (id) on delete set null;

comment on column public.profiles.class_id is 'Student homeroom/class; set by admin (SQL or future UI).';

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


-- ---------------------------------------------------------------------------
-- 20260301120000_quiz_system.sql
-- ---------------------------------------------------------------------------

create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  prompt text not null,
  option_1 text not null,
  option_2 text not null,
  option_3 text not null,
  option_4 text not null,
  correct_option smallint not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint quiz_questions_correct_option_check check (correct_option between 1 and 4)
);

create index if not exists quiz_questions_lesson_id_idx on public.quiz_questions (lesson_id);

comment on table public.quiz_questions is 'Four-option MCQ per lesson; correct_option is 1–4.';

create table if not exists public.results (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  score int not null,
  total_questions int not null,
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint results_score_nonneg check (score >= 0),
  constraint results_total_nonneg check (total_questions >= 0),
  constraint results_score_lte_total check (score <= total_questions)
);

create unique index if not exists results_student_lesson_uidx
  on public.results (student_id, lesson_id);

comment on table public.results is 'Quiz attempt; one row per student per lesson (latest overwrites on resubmit).';

alter table public.quiz_questions enable row level security;
alter table public.results enable row level security;

drop policy if exists "quiz_questions_teacher_all" on public.quiz_questions;
create policy "quiz_questions_teacher_all"
  on public.quiz_questions
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.lessons l
      where l.id = quiz_questions.lesson_id
        and l.teacher_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.lessons l
      where l.id = quiz_questions.lesson_id
        and l.teacher_id = (select auth.uid())
    )
  );

drop policy if exists "results_select_student_own" on public.results;
create policy "results_select_student_own"
  on public.results
  for select
  to authenticated
  using (student_id = (select auth.uid()));

drop policy if exists "results_select_teacher_lesson" on public.results;
create policy "results_select_teacher_lesson"
  on public.results
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.lessons l
      where l.id = results.lesson_id
        and l.teacher_id = (select auth.uid())
    )
  );

grant select, insert, update, delete on table public.quiz_questions to authenticated;
grant select on table public.results to authenticated;
grant all on table public.quiz_questions to service_role;
grant all on table public.results to service_role;

create or replace function public.get_student_quiz_questions(p_lesson_id uuid)
returns table (
  id uuid,
  lesson_id uuid,
  prompt text,
  option_1 text,
  option_2 text,
  option_3 text,
  option_4 text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.lessons les
    inner join public.profiles p
      on p.id = (select auth.uid())
      and p.role = 'student'
      and p.class_id is not null
      and les.class_id = p.class_id
    where les.id = p_lesson_id
  ) then
    raise exception 'not allowed';
  end if;

  return query
  select
    q.id,
    q.lesson_id,
    q.prompt,
    q.option_1,
    q.option_2,
    q.option_3,
    q.option_4
  from public.quiz_questions q
  where q.lesson_id = p_lesson_id
  order by q.created_at asc;
end;
$$;

grant execute on function public.get_student_quiz_questions(uuid) to authenticated;

create or replace function public.submit_lesson_quiz(p_lesson_id uuid, p_answers jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_score int := 0;
  v_total int;
  r record;
  v_guess int;
  v_result_id uuid;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  if not exists (
    select 1
    from public.lessons les
    inner join public.profiles p
      on p.id = v_uid
      and p.role = 'student'
      and p.class_id is not null
      and les.class_id = p.class_id
    where les.id = p_lesson_id
  ) then
    raise exception 'not allowed';
  end if;

  select count(*)::int into v_total from public.quiz_questions where lesson_id = p_lesson_id;

  for r in
    select * from public.quiz_questions where lesson_id = p_lesson_id order by created_at asc
  loop
    begin
      v_guess := (p_answers ->> (r.id::text))::int;
    exception
      when others then
        v_guess := null;
    end;
    if v_guess is not null and v_guess = r.correct_option then
      v_score := v_score + 1;
    end if;
  end loop;

  insert into public.results (student_id, lesson_id, score, total_questions, answers)
  values (v_uid, p_lesson_id, v_score, v_total, coalesce(p_answers, '{}'::jsonb))
  on conflict (student_id, lesson_id)
  do update set
    score = excluded.score,
    total_questions = excluded.total_questions,
    answers = excluded.answers,
    created_at = timezone('utc', now());

  select res.id into v_result_id
  from public.results res
  where res.student_id = v_uid and res.lesson_id = p_lesson_id;

  return jsonb_build_object(
    'score', v_score,
    'total_questions', v_total,
    'result_id', v_result_id
  );
end;
$$;

grant execute on function public.submit_lesson_quiz(uuid, jsonb) to authenticated;


-- ---------------------------------------------------------------------------
-- 20260426120000_admin_student_class.sql
-- ---------------------------------------------------------------------------

drop policy if exists "profiles_select_admin" on public.profiles;

create policy "profiles_select_admin"
  on public.profiles
  for select
  to authenticated
  using (public.current_is_admin());

create or replace function public.admin_assign_student_class(
  p_student_id uuid,
  p_class_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Avtorizatsiya talab qilinadi';
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
  ) then
    raise exception 'Faqat administrator bajarishi mumkin';
  end if;

  if not exists (
    select 1 from public.profiles where id = p_student_id and role = 'student'
  ) then
    raise exception 'Foydalanuvchi o‘quvchi sifatida topilmadi';
  end if;

  if p_class_id is not null and not exists (
    select 1 from public.classes c where c.id = p_class_id
  ) then
    raise exception 'Sinf (class) topilmadi';
  end if;

  update public.profiles
  set class_id = p_class_id
  where id = p_student_id
    and role = 'student';
end;
$$;

grant execute on function public.admin_assign_student_class(uuid, uuid) to authenticated;

-- =============================================================================
-- Tugadi. Mavjud Auth foydalanuvchilari uchun profiles qatorlari:
-- trigger faqat yangi insertda ishlaydi — eski userlar uchun quyidagini bir marta ishlating:
-- =============================================================================
--
-- insert into public.profiles (id, full_name, role)
-- select u.id, null, 'student'
-- from auth.users u
-- where not exists (select 1 from public.profiles p where p.id = u.id)
-- on conflict (id) do nothing;
--
-- Admin qilish (emailni o‘zgartiring):
-- update public.profiles set role = 'admin'
-- where id = (select id from auth.users where lower(email) = lower('SIZNING@email.com') limit 1);
