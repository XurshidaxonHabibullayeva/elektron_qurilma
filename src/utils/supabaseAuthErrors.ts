/**
 * Supabase Auth (GoTrue) inglizcha xabarlarini foydalanuvchiga tushunarli o‘zbekchaga yaqinlashtiradi.
 */
export function translateAuthError(message: string): string {
  const raw = message.trim()
  const m = raw.toLowerCase()

  if (!raw) {
    return 'Kirish muvaffaqiyatsiz. Qayta urinib ko‘ring.'
  }

  if (
    m.includes('invalid_credentials') ||
    m.includes('invalid login credentials') ||
    m.includes('invalid email or password') ||
    m.includes('invalid_grant')
  ) {
    return 'Email yoki parol noto‘g‘ri, yoki bunday foydalanuvchi yo‘q. Supabase’da foydalanuvchi yaratilganini tekshiring.'
  }

  if (m.includes('email not confirmed') || m.includes('email_not_confirmed')) {
    return 'Email hali tasdiqlanmagan. Pochtadagi tasdiqlash havolasini bosing yoki Supabase → Authentication → foydalanuvchini qo‘lda tasdiqlang.'
  }

  if (m.includes('too many requests') || m.includes('rate limit')) {
    return 'Juda ko‘p urinish. Bir necha daqiqa kutib, qayta urinib ko‘ring.'
  }

  if (m.includes('user already registered')) {
    return 'Bu email bilan foydalanuvchi allaqachon ro‘yxatdan o‘tgan. Kirish sahifasidan kiring.'
  }

  if (m.includes('password') && m.includes('least')) {
    return 'Parol talablarga mos emas (masalan, kamida 6 yoki 8 belgi).'
  }

  return raw
}

/** Authdan tashqari: profil, RLS, sessiya xabarlari. */
export function translateAppError(message: string): string {
  const raw = message.trim()
  const m = raw.toLowerCase()

  if (
    m.includes('permission denied') ||
    m.includes('row-level security') ||
    m.includes('violates row-level security')
  ) {
    return 'Profil yoki ma’lumotlarga kirish cheklangan. Supabase RLS va policies ni tekshiring.'
  }

  if (m.includes('jwt expired') || m.includes('invalid jwt')) {
    return 'Sessiya muddati tugagan. Qayta kiring.'
  }

  // PostgREST: yo‘q RPC — xabar ichida funksiya nomi bo‘lishi mumkin; migratsiya yo‘l-yo‘riqini moslang.
  if (
    m.includes('could not find the function') ||
    m.includes('could not find the procedure') ||
    (m.includes('function') && m.includes('does not exist')) ||
    m.includes('undefined_function') ||
    m.includes('42883')
  ) {
    if (m.includes('admin_assign_student_class')) {
      return (
        'Sinf biriktirish uchun `admin_assign_student_class` funksiyasi topilmadi. ' +
        'Supabase → SQL Editor’da ishga tushiring: `supabase/migrations/20260426120000_admin_student_class.sql` ' +
        '(yoki `REMOTE_SETUP.sql` dagi shu funksiya va `profiles_select_admin` siyosati bloki).'
      )
    }
    if (m.includes('admin_list_registered_users') || m.includes('admin_set_profile_role')) {
      return (
        'Foydalanuvchilar ro‘yxati / rol uchun SQL funksiyasi topilmadi. SQL Editor’da: ' +
        '`supabase/migrations/20260428100000_admin_list_and_set_role.sql` ' +
        '(yoki `REMOTE_SETUP.sql` dagi shu funksiyalar bloki).'
      )
    }
    return (
      'Supabase’da kerakli SQL funksiyasi topilmadi. SQL Editor’da ketma-ket tekshiring: ' +
      '`20260426120000_admin_student_class.sql` (sinf biriktirish), ' +
      '`20260428100000_admin_list_and_set_role.sql` (ro‘yxat va rol). ' +
      'Yoki butun `REMOTE_SETUP.sql` ni loyiha talablariga mos qismini ishga tushiring.'
    )
  }

  if (
    m.includes('pgrst205') ||
    m.includes('could not find the table') ||
    (m.includes('relation') && m.includes('does not exist'))
  ) {
    return 'public.profiles (yoki boshqa jadval) Supabase’da yo‘q yoki API uni ko‘rmayapti. SQL Editor’da migratsiyalarni ketma-ket ishga tushiring (pastdagi yo‘riqnoma).'
  }

  if (
    m.includes('foreign key') ||
    m.includes('violates foreign key constraint') ||
    m.includes('23503') ||
    m.includes('still referenced')
  ) {
    return (
      'Bu yozuv boshqa jadvallar bilan bog‘langan (masalan, darslar yoki o‘quvchi sinfi). ' +
      'Avval bog‘liq darslarni o‘chiring yoki o‘quvchilarni boshqa sinfga o‘tkazing, keyin qayta urinib ko‘ring.'
    )
  }

  return translateAuthError(message)
}
