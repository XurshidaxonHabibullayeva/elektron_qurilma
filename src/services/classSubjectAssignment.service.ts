import { supabase } from '@/services/supabase'

/**
 * Fetches IDs of subjects assigned to a class.
 */
export async function fetchClassSubjectIds(classId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('class_subjects')
    .select('subject_id')
    .eq('class_id', classId)

  if (error) {
    throw new Error(error.message)
  }
  return (data ?? []).map((r) => r.subject_id)
}

/**
 * Replaces a class's subject assignments with a new list.
 */
export async function adminSetClassSubjects(classId: string, subjectIds: string[]): Promise<void> {
  // 1. Delete existing
  const { error: delErr } = await supabase
    .from('class_subjects')
    .delete()
    .eq('class_id', classId)

  if (delErr) {
    throw new Error(delErr.message)
  }

  if (subjectIds.length === 0) return

  // 2. Insert new
  const rows = subjectIds.map((sid) => ({
    class_id: classId,
    subject_id: sid,
  }))

  const { error: insErr } = await supabase.from('class_subjects').insert(rows)
  if (insErr) {
    throw new Error(insErr.message)
  }
}
