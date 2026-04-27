import { supabase } from '@/services/supabase'
import { translateAppError } from '@/utils/supabaseAuthErrors'

type EmbeddedName = { name: string } | { name: string }[] | null

function embeddedName(v: EmbeddedName): string | null {
  if (!v) {
    return null
  }
  if (Array.isArray(v)) {
    const n = v[0]?.name?.trim()
    return n || null
  }
  const n = v.name?.trim()
  return n || null
}

export async function fetchTeacherSubjectIds(teacherId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('teacher_subjects')
    .select('subject_id')
    .eq('teacher_id', teacherId)

  if (error) {
    throw new Error(translateAppError(error.message))
  }
  return ((data ?? []) as Array<{ subject_id: string }>).map((r) => r.subject_id)
}

/** Admin: o‘qituvchining fanlarini to‘liq almashtiradi (bo‘sh = cheklov yo‘q). */
export async function adminSetTeacherSubjects(
  teacherId: string,
  subjectIds: string[],
): Promise<void> {
  const unique = [...new Set(subjectIds.filter(Boolean))]
  const { error: delErr } = await supabase
    .from('teacher_subjects')
    .delete()
    .eq('teacher_id', teacherId)
  if (delErr) {
    throw new Error(translateAppError(delErr.message))
  }
  if (unique.length === 0) {
    return
  }
  const rows = unique.map((subject_id) => ({ teacher_id: teacherId, subject_id }))
  const { error: insErr } = await supabase.from('teacher_subjects').insert(rows)
  if (insErr) {
    throw new Error(translateAppError(insErr.message))
  }
}

/** teacher_id -> «Fan1, Fan2» (admin ro‘yxati uchun). */
export async function fetchTeacherSubjectSummariesForTeachers(
  teacherIds: string[],
): Promise<Map<string, string>> {
  const out = new Map<string, string>()
  if (teacherIds.length === 0) {
    return out
  }
  const { data, error } = await supabase
    .from('teacher_subjects')
    .select('teacher_id, subjects ( name )')
    .in('teacher_id', teacherIds)

  if (error) {
    throw new Error(translateAppError(error.message))
  }

  const acc = new Map<string, Set<string>>()
  for (const row of (data ?? []) as unknown as Array<{
    teacher_id: string
    subjects: EmbeddedName
  }>) {
    const name = embeddedName(row.subjects)
    if (!name) {
      continue
    }
    if (!acc.has(row.teacher_id)) {
      acc.set(row.teacher_id, new Set())
    }
    acc.get(row.teacher_id)!.add(name)
  }
  for (const [tid, set] of acc) {
    out.set(tid, [...set].sort((a, b) => a.localeCompare(b, 'uz')).join(', '))
  }
  return out
}
