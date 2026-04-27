-- Allow teachers and admins to read all profiles for reporting and management.
-- This is needed for Teachers to see student names in quiz results.

drop policy if exists "profiles_select_teacher" on public.profiles;
create policy "profiles_select_teacher"
  on public.profiles
  for select
  to authenticated
  using (public.current_is_teacher() or public.current_is_admin());
