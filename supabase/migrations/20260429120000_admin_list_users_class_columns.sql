-- Admin: ro‘yxatda o‘quvchi sinfi va o‘qituvchining dars beradigan sinflari.

drop policy if exists "lessons_select_admin" on public.lessons;

create policy "lessons_select_admin"
  on public.lessons
  for select
  to authenticated
  using (public.current_is_admin());

drop function if exists public.admin_list_registered_users();

create function public.admin_list_registered_users()
returns table (
  id uuid,
  full_name text,
  role text,
  class_id uuid,
  email text,
  registered_at timestamptz,
  student_class_name text,
  teacher_classes_summary text
)
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

  return query
  select
    p.id,
    p.full_name,
    p.role,
    p.class_id,
    coalesce(u.email, '')::text,
    u.created_at,
    case
      when p.role = 'student' then sc.name
      else null::text
    end as student_class_name,
    case
      when p.role = 'teacher' then (
        select string_agg(distinct c2.name, ', ' order by c2.name)
        from public.lessons l
        inner join public.classes c2 on c2.id = l.class_id
        where l.teacher_id = p.id
      )
      else null::text
    end as teacher_classes_summary
  from public.profiles p
  inner join auth.users u on u.id = p.id
  left join public.classes sc on sc.id = p.class_id and p.role = 'student'
  order by u.created_at desc;
end;
$$;

grant execute on function public.admin_list_registered_users() to authenticated;
