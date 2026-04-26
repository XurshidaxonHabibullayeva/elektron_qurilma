-- Classes & subjects for curriculum admin. Only profiles.role = 'admin' may CRUD.

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default timezone('utc', now())
);

comment on table public.classes is 'School class label, e.g. 5-sinf';
comment on table public.subjects is 'Subject name, e.g. Math';

create index if not exists classes_created_at_idx on public.classes (created_at desc);
create index if not exists subjects_created_at_idx on public.subjects (created_at desc);

-- Helper: readable by security definer to avoid RLS recursion on profiles.
create or replace function public.current_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
  );
$$;

grant execute on function public.current_is_admin() to authenticated;

alter table public.classes enable row level security;
alter table public.subjects enable row level security;

create policy "classes_admin_all"
  on public.classes
  for all
  to authenticated
  using (public.current_is_admin())
  with check (public.current_is_admin());

create policy "subjects_admin_all"
  on public.subjects
  for all
  to authenticated
  using (public.current_is_admin())
  with check (public.current_is_admin());

grant select, insert, update, delete on table public.classes to authenticated;
grant select, insert, update, delete on table public.subjects to authenticated;
grant all on table public.classes to service_role;
grant all on table public.subjects to service_role;
