import { supabase } from '@/services/supabase'
import type { TeacherLessonRow } from '@/types'

export type CreateLessonInput = {
  teacherId: string
  classId: string
  subjectId: string
  title: string
  description: string | null
  videoUrl: string | null
  materialUrl: string | null
}

export async function fetchOwnedLesson(
  lessonId: string,
  teacherId: string,
): Promise<TeacherLessonRow | null> {
  const { data, error } = await supabase
    .from('lessons')
    .select(
      'id, teacher_id, class_id, subject_id, title, description, video_url, material_url, created_at, updated_at',
    )
    .eq('id', lessonId)
    .eq('teacher_id', teacherId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }
  return data as TeacherLessonRow | null
}

export async function fetchMyLessons(): Promise<TeacherLessonRow[]> {
  const { data, error } = await supabase
    .from('lessons')
    .select(
      'id, teacher_id, class_id, subject_id, title, description, video_url, material_url, created_at, updated_at',
    )
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }
  return (data ?? []) as TeacherLessonRow[]
}

export async function createLesson(input: CreateLessonInput): Promise<TeacherLessonRow> {
  const title = input.title.trim()
  if (!title) {
    throw new Error('Dars nomi kiritilishi shart')
  }
  if (!input.classId || !input.subjectId) {
    throw new Error('Sinf va fan tanlanishi shart')
  }

  const row = {
    teacher_id: input.teacherId,
    class_id: input.classId,
    subject_id: input.subjectId,
    title,
    description: input.description?.trim() || null,
    video_url: input.videoUrl?.trim() || null,
    material_url: input.materialUrl?.trim() || null,
  }

  const { data, error } = await supabase
    .from('lessons')
    .insert(row)
    .select(
      'id, teacher_id, class_id, subject_id, title, description, video_url, material_url, created_at, updated_at',
    )
    .single()

  if (error) {
    throw new Error(error.message)
  }
  return data as TeacherLessonRow
}
