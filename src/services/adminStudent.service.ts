import { supabase } from '@/services/supabase'
import { translateAppError } from '@/utils/supabaseAuthErrors'

export type StudentProfileRow = {
  id: string
  full_name: string | null
  class_id: string | null
}

export async function fetchStudentsForAdmin(): Promise<StudentProfileRow[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, class_id')
    .eq('role', 'student')
    .order('full_name', { ascending: true, nullsFirst: false })

  if (error) {
    throw new Error(translateAppError(error.message))
  }
  return (data ?? []) as StudentProfileRow[]
}

export async function adminAssignStudentClass(
  studentId: string,
  classId: string | null,
): Promise<void> {
  const { error } = await supabase.rpc('admin_assign_student_class', {
    p_student_id: studentId,
    p_class_id: classId,
  })
  if (error) {
    throw new Error(translateAppError(error.message))
  }
}
