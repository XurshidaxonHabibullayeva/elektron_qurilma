-- 1. Barcha eski siyosatlarni tozalash (Recursion xatoligini yo'qotish uchun)
drop policy if exists "profiles_select_all" on public.profiles;
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "admin_all_profiles" on public.profiles;
drop policy if exists "admin_manage_all" on public.profiles;

-- 2. Jadvalni yaratish (agar yo'q bo'lsa)
create table if not exists public.profiles (
  id uuid not null references auth.users (id) on delete cascade,
  full_name text,
  role text not null default 'student',
  class_id uuid,
  updated_at timestamptz not null default timezone('utc', now()),
  constraint profiles_role_check check (role in ('admin', 'teacher', 'student')),
  primary key (id)
);

alter table public.profiles enable row level security;

-- 3. Toza va sodda siyosatlar (Recursion-siz)
-- Hamma authenticated foydalanuvchilar profillarni o'qiy olsin
create policy "profiles_read_policy" 
  on public.profiles for select 
  to authenticated 
  using (true);

-- Foydalanuvchi faqat o'z profilini yarata olsin
create policy "profiles_insert_policy" 
  on public.profiles for insert 
  to authenticated 
  with check (auth.uid() = id);

-- Foydalanuvchi faqat o'z profilini yangilay olsin (Ism o'zgartirish uchun)
create policy "profiles_update_policy" 
  on public.profiles for update 
  to authenticated 
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 4. Classes and Subjects
create table if not exists public.classes (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  created_at timestamptz default now()
);

create table if not exists public.subjects (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  created_at timestamptz default now()
);

alter table public.classes enable row level security;
alter table public.subjects enable row level security;

drop policy if exists "classes_read_all" on public.classes;
create policy "classes_read_all" on public.classes for select to authenticated using (true);

drop policy if exists "subjects_read_all" on public.subjects;
create policy "subjects_read_all" on public.subjects for select to authenticated using (true);

-- 5. Lessons
create table if not exists public.lessons (
  id uuid default gen_random_uuid() primary key,
  teacher_id uuid references auth.users(id) not null,
  class_id uuid references public.classes(id) not null,
  subject_id uuid references public.subjects(id) not null,
  title text not null,
  description text,
  video_url text,
  material_url text,
  quarter int check (quarter between 1 and 4),
  created_at timestamptz default now()
);

alter table public.lessons enable row level security;

drop policy if exists "lessons_read_all" on public.lessons;
create policy "lessons_read_all" on public.lessons for select to authenticated using (true);

drop policy if exists "lessons_teacher_all" on public.lessons;
create policy "lessons_teacher_all" on public.lessons for all to authenticated using (auth.uid() = teacher_id);

-- 6. Quiz Results
create table if not exists public.results (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references auth.users(id) not null,
  lesson_id uuid references public.lessons(id) on delete cascade not null,
  score int not null,
  total_questions int not null,
  answers jsonb,
  created_at timestamptz default now()
);

alter table public.results enable row level security;

drop policy if exists "results_read_own" on public.results;
create policy "results_read_own" on public.results for select to authenticated using (auth.uid() = student_id);

drop policy if exists "results_insert_own" on public.results;
create policy "results_insert_own" on public.results for insert to authenticated with check (auth.uid() = student_id);

-- 7. Trigger for new user
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', '')), ''),
    'student'
  )
  on conflict (id) do update
  set full_name = excluded.full_name;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- 8. Grants
grant all on all tables in schema public to authenticated;
grant all on all sequences in schema public to authenticated;
grant all on all functions in schema public to authenticated;
