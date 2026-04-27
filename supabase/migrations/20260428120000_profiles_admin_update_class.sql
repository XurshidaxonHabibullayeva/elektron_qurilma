-- Admin: o‘quvchining sinfini (class_id) RPC yo‘q paytda ham ilova orqali yangilash.
-- Faqat class_id ustuniga UPDATE huquqi; RLS: faqat administrator va faqat student qatorlari.

grant update (class_id) on table public.profiles to authenticated;

drop policy if exists "profiles_update_admin_student_class" on public.profiles;

create policy "profiles_update_admin_student_class"
  on public.profiles
  for update
  to authenticated
  using (
    public.current_is_admin()
    and role = 'student'
  )
  with check (
    public.current_is_admin()
    and role = 'student'
  );
