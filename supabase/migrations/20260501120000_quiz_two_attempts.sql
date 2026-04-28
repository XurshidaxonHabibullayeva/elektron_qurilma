-- Allow students up to two quiz attempts per lesson and preserve both results.

alter table public.results
  add column if not exists attempt_number smallint not null default 1;

alter table public.results
  add constraint results_attempt_number_check
  check (attempt_number between 1 and 2);

-- Preserve one result per lesson/student as attempt 1 for existing rows.
update public.results
set attempt_number = 1
where attempt_number is null;

drop index if exists public.results_student_lesson_uidx;
create unique index if not exists results_student_lesson_attempt_uidx
  on public.results (student_id, lesson_id, attempt_number);

comment on column public.results.attempt_number is '1-based quiz attempt number per student and lesson; max 2 attempts.';

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
  v_attempt_count int;
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
  select count(*)::int into v_attempt_count
  from public.results
  where student_id = v_uid
    and lesson_id = p_lesson_id;

  if v_attempt_count >= 2 then
    raise exception 'Faqat 2 marta test topshirish mumkin';
  end if;

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

  insert into public.results (
    student_id,
    lesson_id,
    score,
    total_questions,
    answers,
    attempt_number
  ) values (
    v_uid,
    p_lesson_id,
    v_score,
    v_total,
    coalesce(p_answers, '{}'::jsonb),
    v_attempt_count + 1
  ) returning id into v_result_id;

  return jsonb_build_object(
    'score', v_score,
    'total_questions', v_total,
    'result_id', v_result_id,
    'attempt_number', v_attempt_count + 1
  );
end;
$$;

grant execute on function public.submit_lesson_quiz(uuid, jsonb) to authenticated;
