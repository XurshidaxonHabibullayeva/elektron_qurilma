-- Run in Supabase SQL Editor or via CLI: supabase db push
-- Creates profiles linked to auth.users with role; auto-creates row on signup.

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
