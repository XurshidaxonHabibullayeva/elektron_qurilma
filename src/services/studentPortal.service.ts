import { supabase } from '@/services/supabase'
import type { ClassRow, SubjectRow, TeacherLessonRow } from '@/types'

export async function fetchClassById(classId: string): Promise<ClassRow | null> {
  const { data, error } = await supabase
    .from('classes')
    .select('id, name, created_at')
    .eq('id', classId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }
  return data as ClassRow | null
}

/** Subjects that have at least one lesson for this class (RLS applies). */
export async function fetchSubjectsForClass(classId: string): Promise<SubjectRow[]> {
  const { data: lessonRows, error } = await supabase
    .from('lessons')
    .select('subject_id')
    .eq('class_id', classId)

  if (error) {
    throw new Error(error.message)
  }

  const ids = [
    ...new Set((lessonRows ?? []).map((r) => r.subject_id).filter(Boolean)),
  ] as string[]

  if (ids.length === 0) {
    return []
  }

  const { data: subjects, error: subErr } = await supabase
    .from('subjects')
    .select('id, name, created_at')
    .in('id', ids)
    .order('name', { ascending: true })

  if (subErr) {
    throw new Error(subErr.message)
  }
  return (subjects ?? []) as SubjectRow[]
}

export async function fetchLessonsForClassAndSubject(
  classId: string,
  subjectId: string,
): Promise<TeacherLessonRow[]> {
  const { data, error } = await supabase
    .from('lessons')
    .select(
      'id, teacher_id, class_id, subject_id, title, description, video_url, material_url, quarter, created_at, updated_at',
    )
    .eq('class_id', classId)
    .eq('subject_id', subjectId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }
  return (data ?? []) as TeacherLessonRow[]
}

export async function fetchLessonById(lessonId: string): Promise<TeacherLessonRow | null> {
  const { data, error } = await supabase
    .from('lessons')
    .select(
      'id, teacher_id, class_id, subject_id, title, description, video_url, material_url, quarter, created_at, updated_at',
    )
    .eq('id', lessonId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }
  return data as TeacherLessonRow | null
}
