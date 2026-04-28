-- Foydalanuvchilarga o'z profillarini yangilash ruxsatini berish
create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Administratorga barcha profillarni boshqarish ruxsatini berish (agar hali yo'q bo'lsa)
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where tablename = 'profiles' and policyname = 'admin_all_profiles'
  ) then
    create policy "admin_all_profiles"
      on public.profiles
      for all
      to authenticated
      using (
        exists (
          select 1 from public.profiles
          where id = auth.uid() and role = 'admin'
        )
      );
  end if;
end $$;

-- UPDATE ruxsatini berish
grant update on table public.profiles to authenticated;
