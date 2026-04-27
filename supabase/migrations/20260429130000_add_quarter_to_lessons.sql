-- Add quarter column to lessons table
alter table public.lessons
add column if not exists quarter smallint check (quarter >= 1 and quarter <= 4);

comment on column public.lessons.quarter is 'School quarter (1-4).';
