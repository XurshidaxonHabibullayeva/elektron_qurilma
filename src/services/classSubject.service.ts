import { supabase } from '@/services/supabase'
import type { ClassRow, SubjectRow } from '@/types'
import { translateAppError } from '@/utils/supabaseAuthErrors'

export async function fetchClasses(): Promise<ClassRow[]> {
  const { data, error } = await supabase
    .from('classes')
    .select('id, name, created_at')
    .order('name', { ascending: true })

  if (error) {
    throw new Error(translateAppError(error.message))
  }
  return (data ?? []) as ClassRow[]
}

export async function createClass(name: string): Promise<ClassRow> {
  const trimmed = name.trim()
  if (!trimmed) {
    throw new Error('Sinf nomi kiritilishi shart')
  }
  const { data, error } = await supabase
    .from('classes')
    .insert({ name: trimmed })
    .select('id, name, created_at')
    .single()

  if (error) {
    throw new Error(translateAppError(error.message))
  }
  return data as ClassRow
}

export async function updateClass(id: string, name: string): Promise<ClassRow> {
  const trimmed = name.trim()
  if (!trimmed) {
    throw new Error('Sinf nomi kiritilishi shart')
  }
  const { data, error } = await supabase
    .from('classes')
    .update({ name: trimmed })
    .eq('id', id)
    .select('id, name, created_at')
    .single()

  if (error) {
    throw new Error(translateAppError(error.message))
  }
  return data as ClassRow
}

export async function deleteClass(id: string): Promise<void> {
  const { error } = await supabase.from('classes').delete().eq('id', id)
  if (error) {
    throw new Error(translateAppError(error.message))
  }
}

export async function fetchSubjects(): Promise<SubjectRow[]> {
  const { data, error } = await supabase
    .from('subjects')
    .select('id, name, created_at')
    .order('name', { ascending: true })

  if (error) {
    throw new Error(translateAppError(error.message))
  }
  return (data ?? []) as SubjectRow[]
}

export async function createSubject(name: string): Promise<SubjectRow> {
  const trimmed = name.trim()
  if (!trimmed) {
    throw new Error('Fan nomi kiritilishi shart')
  }
  const { data, error } = await supabase
    .from('subjects')
    .insert({ name: trimmed })
    .select('id, name, created_at')
    .single()

  if (error) {
    throw new Error(translateAppError(error.message))
  }
  return data as SubjectRow
}

export async function updateSubject(id: string, name: string): Promise<SubjectRow> {
  const trimmed = name.trim()
  if (!trimmed) {
    throw new Error('Fan nomi kiritilishi shart')
  }
  const { data, error } = await supabase
    .from('subjects')
    .update({ name: trimmed })
    .eq('id', id)
    .select('id, name, created_at')
    .single()

  if (error) {
    throw new Error(translateAppError(error.message))
  }
  return data as SubjectRow
}

export async function deleteSubject(id: string): Promise<void> {
  const { error } = await supabase.from('subjects').delete().eq('id', id)
  if (error) {
    throw new Error(translateAppError(error.message))
  }
}
