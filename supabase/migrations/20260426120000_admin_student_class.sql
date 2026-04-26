-- Admin: barcha profillarni ko‘rish va o‘quvchilarning class_id sini RPC orqali yangilash.

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
