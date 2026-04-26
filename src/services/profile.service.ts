import type { PostgrestError } from '@supabase/supabase-js'
import type { ProfileRow, UserRole } from '@/types'
import { USER_ROLES } from '@/types'
import { supabase } from '@/services/supabase'

function normalizeRole(role: string): UserRole {
  return USER_ROLES.includes(role as UserRole) ? (role as UserRole) : 'student'
}

function isMissingTableError(err: PostgrestError): boolean {
  return (
    err.code === 'PGRST205' ||
    err.message.toLowerCase().includes('could not find the table') ||
    err.message.toLowerCase().includes('schema cache')
  )
}

function profileTableMissingMessage(): string {
  return (
    'public.profiles jadvali bu Supabase loyihasida topilmadi (HTTP 404 / PGRST205). ' +
    'Loyiha ildizidagi supabase/migrations SQL fayllarini Dashboard → SQL Editor’da sanadan boshlab ketma-ket bajaring, ' +
    "yoki CLI: supabase link && supabase db push. Keyin sahifani yangilang."
  )
}

function throwProfileError(err: PostgrestError): never {
  if (isMissingTableError(err)) {
    throw new Error(profileTableMissingMessage())
  }
  throw new Error(err.message)
}

export async function loadOrCreateProfile(userId: string): Promise<ProfileRow> {
  const { data: row, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, class_id')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    throwProfileError(error)
  }

  if (row) {
    return {
      id: row.id,
      full_name: row.full_name,
      role: normalizeRole(row.role),
      class_id: row.class_id ?? null,
    }
  }

  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr) {
    throw new Error(userErr.message)
  }
  const u = userData.user
  const fullName =
    typeof u?.user_metadata?.full_name === 'string'
      ? u.user_metadata.full_name.trim() || null
      : null

  const { data: created, error: insErr } = await supabase
    .from('profiles')
    .insert({ id: userId, full_name: fullName, role: 'student' })
    .select('id, full_name, role, class_id')
    .single()

  if (insErr) {
    if (insErr.code === '23505') {
      return loadOrCreateProfile(userId)
    }
    throwProfileError(insErr)
  }

  return {
    id: created.id,
    full_name: created.full_name,
    role: normalizeRole(created.role),
    class_id: created.class_id ?? null,
  }
}
