-- Avvalo jadvalar bo‘lmasa: supabase/REMOTE_SETUP.sql ni Dashboard SQL Editor’da ishga tushiring.
-- Admin «o‘quvchini sinfga biriktirish» ishlamasa: 20260426120000_admin_student_class.sql ni qo‘shing.
--
-- =============================================================================
-- DOIMIY DEMO ADMIN (bir marta sozlash)
-- =============================================================================
--
-- Tavsiya etilgan kirish ma’lumotlari (o‘zingiz xohlasangiz o‘zgartiring):
--
--   Elektron pochta:  admin@elektron.local
--   Parol:            ElektronAdmin2026!
--
-- QADAMLAR:
-- 1) Supabase Dashboard → Authentication → Users → «Add user» (yoki «Invite»).
--    Yuqoridagi email va parol bilan foydalanuvchi yarating (email tasdiqlangan bo‘lsin).
-- 2) Pastdagi UPDATE ni SQL Editor’da bir marta ishga tushiring.
--
-- Shundan keyin ilovada shu email/parol bilan kirganingizda profilingizda role = 'admin'
-- bo‘ladi va /admin paneliga yo‘naltirilasiz.
--
-- XAVFSIZLIK: bu kombinatsiyani faqat sinov/mahalliy loyiha uchun ishlating.
-- Internetga ochiq serverda kuchli noyob parol va 2FA ishlatiladi.
-- =============================================================================

update public.profiles
set role = 'admin'
where id = (
  select id
  from auth.users
  where lower(email) = lower('admin@elektron.local')
  limit 1
);

-- Agar «0 rows» bo‘lsa: avval Auth’da shu email bilan foydalanuvchi yaratilganini tekshiring.
--
-- KIRISHDA 400 XATOSI BO‘LSA (brauzer Network → token javobi):
-- • Authentication → Users: foydalanuvchi bor-yo‘qligi, «Confirmed» ustuni.
-- • Email tasdiqlash yoqilgan bo‘lsa, pochta orqali tasdiqlang yoki foydalanuvchini qo‘lda
--   «Confirm user» qiling; yoki Authentication → Providers → Email → «Confirm email» ni
--   sinov uchun o‘chirib qo‘ying.
-- • .env.local dagi VITE_SUPABASE_URL va VITE_SUPABASE_ANON_KEY shu loyiha (API) bilan mosligi.
