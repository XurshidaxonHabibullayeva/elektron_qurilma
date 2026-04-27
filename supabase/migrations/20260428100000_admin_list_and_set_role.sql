-- Admin: barcha profillar + email (auth.users) ro‘yxati va student/teacher rolini RPC orqali yangilash.

create or replace function public.admin_list_registered_users()
returns table (
  id uuid,
  full_name text,
  role text,
  class_id uuid,
  email text,
  registered_at timestamptz
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
    u.created_at
  from public.profiles p
  inner join auth.users u on u.id = p.id
  order by u.created_at desc;
end;
$$;

grant execute on function public.admin_list_registered_users() to authenticated;

create or replace function public.admin_set_profile_role(
  p_user_id uuid,
  p_role text
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

  if p_user_id = (select auth.uid()) then
    raise exception 'O‘z rolingizni bu yerda o‘zgartirolmaysiz';
  end if;

  if p_role is null or lower(trim(p_role)) not in ('student', 'teacher') then
    raise exception 'Ruxsat etilgan rollar: student, teacher';
  end if;

  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'Profil topilmadi';
  end if;

  if exists (
    select 1 from public.profiles where id = p_user_id and role = 'admin'
  ) then
    raise exception 'Administrator rolini bu paneldan o‘zgartirib bo‘lmaydi';
  end if;

  update public.profiles
  set
    role = lower(trim(p_role)),
    class_id = case when lower(trim(p_role)) = 'teacher' then null else class_id end
  where id = p_user_id;
end;
$$;

grant execute on function public.admin_set_profile_role(uuid, text) to authenticated;
