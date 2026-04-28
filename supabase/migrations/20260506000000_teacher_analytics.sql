-- O'qituvchi statistikasi uchun qo'shimcha maydonlar
alter table public.lessons 
  add column if not exists views_count int default 0,
  add column if not exists downloads_count int default 0;

-- Sinfga biriktirilgan fanlar uchun rejalashtirilgan darslar soni
alter table public.class_subjects
  add column if not exists planned_lessons int default 10; -- Standart 10 ta dars deb hisoblaymiz

-- Natijalarni o'qituvchilar ko'ra olishi uchun siyosat (agar dars ularga tegishli bo'lsa)
drop policy if exists "results_read_teacher" on public.results;
create policy "results_read_teacher"
  on public.results
  for select
  to authenticated
  using (
    exists (
      select 1 from public.lessons
      where public.lessons.id = public.results.lesson_id
      and public.lessons.teacher_id = auth.uid()
    )
  );

-- Ko'rishlar va yuklab olishlarni xavfsiz oshirish uchun funksiyalar
create or replace function public.increment_lesson_views(l_id uuid)
returns void as $$
begin
  update public.lessons
  set views_count = coalesce(views_count, 0) + 1
  where id = l_id;
end;
$$ language plpgsql security definer;

create or replace function public.increment_lesson_downloads(l_id uuid)
returns void as $$
begin
  update public.lessons
  set downloads_count = coalesce(downloads_count, 0) + 1
  where id = l_id;
end;
$$ language plpgsql security definer;

