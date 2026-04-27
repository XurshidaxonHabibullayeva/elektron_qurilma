import { supabase } from '@/services/supabase'
import { fetchTeacherSubjectSummariesForTeachers } from '@/services/teacherSubject.service'
import type { UserRole } from '@/types'
import { translateAppError } from '@/utils/supabaseAuthErrors'
import { isMissingPostgrestRpc } from '@/utils/supabasePostgrest'

export type RegisteredUserRow = {
  id: string
  full_name: string | null
  role: UserRole
  class_id: string | null
  email: string
  registered_at: string
  /** O‘quvchi uchun sinf nomi (profiles.class_id). */
  student_class_name: string | null
  /** O‘qituvchi uchun: dars qo‘yilgan sinflar ro‘yxati (vergul bilan). */
  teacher_classes_summary: string | null
  /** O‘qituvchi uchun: admin biriktirgan fanlar (`teacher_subjects`). */
  teacher_assigned_subjects_summary: string | null
}

export type RegisteredUsersLoadResult = {
  rows: RegisteredUserRow[]
  /** true bo‘lsa, faqat ro‘yxat ko‘rinadi; rol o‘zgartirish uchun migratsiya kerak. */
  usedProfileFallback: boolean
}

type EmbeddedName = { name: string } | { name: string }[] | null

function embeddedClassName(classes: EmbeddedName): string | null {
  if (!classes) {
    return null
  }
  if (Array.isArray(classes)) {
    const n = classes[0]?.name?.trim()
    return n || null
  }
  const n = classes.name?.trim()
  return n || null
}

type ProfileRowWithClass = {
  id: string
  full_name: string | null
  role: string
  class_id: string | null
  updated_at: string
  classes: EmbeddedName
}

type LessonClassRow = {
  teacher_id: string
  classes: EmbeddedName
}

/** RPC yo‘q bo‘lsa: profiles + sinf nomi; o‘qituvchi sinflari lessons orqali (admin SELECT siyosati kerak). */
async function fetchRegisteredUsersFallback(): Promise<RegisteredUserRow[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, class_id, updated_at, classes ( name )')
    .order('updated_at', { ascending: false })

  if (error) {
    throw new Error(translateAppError(error.message))
  }
  const rows = (data ?? []) as unknown as ProfileRowWithClass[]

  const teacherIds = rows
    .filter((r) => normalizeRpcRole(r.role) === 'teacher')
    .map((r) => r.id)

  const teacherClassNames = new Map<string, Set<string>>()
  if (teacherIds.length > 0) {
    const { data: lessonRows, error: lesErr } = await supabase
      .from('lessons')
      .select('teacher_id, classes ( name )')
      .in('teacher_id', teacherIds)

    if (!lesErr && lessonRows) {
      for (const row of lessonRows as unknown as LessonClassRow[]) {
        const n = embeddedClassName(row.classes)
        if (!n) {
          continue
        }
        if (!teacherClassNames.has(row.teacher_id)) {
          teacherClassNames.set(row.teacher_id, new Set())
        }
        teacherClassNames.get(row.teacher_id)!.add(n)
      }
    }
  }

  return rows.map((r) => {
    const role = normalizeRpcRole(r.role)
    const classSet = teacherClassNames.get(r.id)
    const teacherSummary =
      role === 'teacher' && classSet && classSet.size > 0
        ? [...classSet].sort((a, b) => a.localeCompare(b, 'uz')).join(', ')
        : null

    const sn = embeddedClassName(r.classes)
    return {
      id: r.id,
      full_name: r.full_name,
      role,
      class_id: r.class_id,
      email: '',
      registered_at: r.updated_at,
      student_class_name: role === 'student' ? sn : null,
      teacher_classes_summary: role === 'teacher' ? teacherSummary : null,
      teacher_assigned_subjects_summary: null,
    }
  })
}

async function mergeTeacherAssignedSubjects(
  rows: RegisteredUserRow[],
): Promise<RegisteredUserRow[]> {
  const teacherIds = rows.filter((r) => r.role === 'teacher').map((r) => r.id)
  if (teacherIds.length === 0) {
    return rows.map((r) => ({ ...r, teacher_assigned_subjects_summary: null }))
  }
  try {
    const map = await fetchTeacherSubjectSummariesForTeachers(teacherIds)
    return rows.map((r) => ({
      ...r,
      teacher_assigned_subjects_summary:
        r.role === 'teacher' ? (map.get(r.id) ?? null) : null,
    }))
  } catch {
    return rows.map((r) => ({ ...r, teacher_assigned_subjects_summary: null }))
  }
}

export async function fetchRegisteredUsersForAdmin(): Promise<RegisteredUsersLoadResult> {
  const { data, error } = await supabase.rpc('admin_list_registered_users')
  if (!error && data != null) {
    const raw = data as Array<{
      id: string
      full_name: string | null
      role: string
      class_id: string | null
      email: string
      registered_at: string
      student_class_name?: string | null
      teacher_classes_summary?: string | null
    }>
    const rows = raw.map((r) => ({
      id: r.id,
      full_name: r.full_name,
      role: normalizeRpcRole(r.role),
      class_id: r.class_id,
      email: r.email,
      registered_at: r.registered_at,
      student_class_name: r.student_class_name ?? null,
      teacher_classes_summary: r.teacher_classes_summary ?? null,
      teacher_assigned_subjects_summary: null,
    }))
    const merged = await mergeTeacherAssignedSubjects(rows)
    return { rows: merged, usedProfileFallback: false }
  }

  if (error && isMissingPostgrestRpc(error.message)) {
    const rows = await fetchRegisteredUsersFallback()
    const merged = await mergeTeacherAssignedSubjects(rows)
    return { rows: merged, usedProfileFallback: true }
  }

  throw new Error(translateAppError(error?.message ?? 'Ma’lumot yuklanmadi'))
}

function normalizeRpcRole(role: string): UserRole {
  const v = role?.trim().toLowerCase()
  if (v === 'admin' || v === 'teacher' || v === 'student') {
    return v
  }
  return 'student'
}

export async function adminSetProfileRole(
  userId: string,
  role: 'student' | 'teacher',
): Promise<void> {
  const { error } = await supabase.rpc('admin_set_profile_role', {
    p_user_id: userId,
    p_role: role,
  })
  if (error) {
    throw new Error(translateAppError(error.message))
  }
}
