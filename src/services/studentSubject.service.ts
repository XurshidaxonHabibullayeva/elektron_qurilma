import { supabase } from '@/services/supabase'

/**
 * Fetches IDs of subjects assigned to a student.
 */
export async function fetchStudentSubjectIds(studentId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('student_subjects')
    .select('subject_id')
    .eq('student_id', studentId)

  if (error) {
    throw new Error(error.message)
  }
  return (data ?? []).map((r) => r.subject_id)
}

/**
 * Replaces a student's subject assignments with a new list.
 */
export async function adminSetStudentSubjects(studentId: string, subjectIds: string[]): Promise<void> {
  // 1. Delete existing
  const { error: delErr } = await supabase
    .from('student_subjects')
    .delete()
    .eq('student_id', studentId)

  if (delErr) {
    throw new Error(delErr.message)
  }

  if (subjectIds.length === 0) return

  // 2. Insert new
  const rows = subjectIds.map((sid) => ({
    student_id: studentId,
    subject_id: sid,
  }))

  const { error: insErr } = await supabase.from('student_subjects').insert(rows)
  if (insErr) {
    throw new Error(insErr.message)
  }
}
