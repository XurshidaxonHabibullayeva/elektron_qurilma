import type { ProfileRow, UserRole } from '@/types'
import { USER_ROLES } from '@/types'
import { supabase } from '@/services/supabase'

function normalizeRole(role: string): UserRole {
  return USER_ROLES.includes(role as UserRole) ? (role as UserRole) : 'student'
}

export async function loadOrCreateProfile(userId: string): Promise<ProfileRow> {
  const { data: row, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, class_id')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
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
    throw new Error(insErr.message)
  }

  return {
    id: created.id,
    full_name: created.full_name,
    role: normalizeRole(created.role),
    class_id: created.class_id ?? null,
  }
}
