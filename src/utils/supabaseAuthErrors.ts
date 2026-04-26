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

  if (
    m.includes('pgrst205') ||
    m.includes('could not find the table') ||
    m.includes('schema cache')
  ) {
    return 'public.profiles (yoki boshqa jadval) Supabase’da yo‘q yoki API uni ko‘rmayapti. SQL Editor’da migratsiyalarni ketma-ket ishga tushiring (pastdagi yo‘riqnoma).'
  }

  return translateAuthError(message)
}
