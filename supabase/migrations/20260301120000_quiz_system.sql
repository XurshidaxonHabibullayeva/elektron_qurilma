-- Quiz questions per lesson; results per student per lesson; server-side scoring via RPC.

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

-- Students load questions without exposing correct_option (RPC only).
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

-- Server-side score + upsert into results (students cannot insert rows directly).
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
