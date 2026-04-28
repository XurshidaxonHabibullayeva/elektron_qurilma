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
  quarter: number | null
}


export type UpdateLessonInput = Partial<Omit<CreateLessonInput, 'teacherId'>> & { id: string }


export async function fetchOwnedLesson(
  lessonId: string,
  teacherId: string,
): Promise<TeacherLessonRow | null> {
  const { data, error } = await supabase
    .from('lessons')
    .select(
      'id, teacher_id, class_id, subject_id, title, description, video_url, material_url, quarter, created_at, updated_at',
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
      'id, teacher_id, class_id, subject_id, title, description, video_url, material_url, quarter, created_at, updated_at',
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
    quarter: input.quarter,
  }


  const { data, error } = await supabase
    .from('lessons')
    .insert(row)
    .select(
      'id, teacher_id, class_id, subject_id, title, description, video_url, material_url, quarter, created_at, updated_at',
    )

    .single()

  if (error) {
    throw new Error(error.message)
  }
  return data as TeacherLessonRow
}

export async function updateLesson(input: UpdateLessonInput): Promise<TeacherLessonRow> {
  const { id, ...rest } = input
  const updateData: Record<string, string | number | null> = {}

  if (rest.title !== undefined) updateData.title = rest.title.trim()
  if (rest.classId !== undefined) updateData.class_id = rest.classId
  if (rest.subjectId !== undefined) updateData.subject_id = rest.subjectId
  if (rest.description !== undefined) updateData.description = rest.description?.trim() || null
  if (rest.videoUrl !== undefined) updateData.video_url = rest.videoUrl?.trim() || null
  if (rest.materialUrl !== undefined) updateData.material_url = rest.materialUrl?.trim() || null
  if (rest.quarter !== undefined) updateData.quarter = rest.quarter


  if (Object.keys(updateData).length === 0) {
    throw new Error('Hech qanday o‘zgarish kiritilmadi')
  }

  const { data, error } = await supabase
    .from('lessons')
    .update(updateData)
    .eq('id', id)
    .select(
      'id, teacher_id, class_id, subject_id, title, description, video_url, material_url, quarter, created_at, updated_at',
    )

    .single()

  if (error) {
    throw new Error(error.message)
  }
  return data as TeacherLessonRow
}

export async function deleteLesson(lessonId: string): Promise<void> {
  const { error } = await supabase.from('lessons').delete().eq('id', lessonId)
  if (error) {
    throw new Error(error.message)
  }
}

export async function uploadMaterial(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
  const filePath = `materials/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('materials')
    .upload(filePath, file)

  if (uploadError) {
    throw new Error(uploadError.message)
  }

  const { data } = supabase.storage.from('materials').getPublicUrl(filePath)
  return data.publicUrl
}

