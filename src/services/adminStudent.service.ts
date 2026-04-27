import { supabase } from '@/services/supabase'
import { translateAppError } from '@/utils/supabaseAuthErrors'
import { isMissingPostgrestRpc } from '@/utils/supabasePostgrest'

async function assignStudentClassViaUpdate(
  studentId: string,
  classId: string | null,
): Promise<void> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ class_id: classId })
    .eq('id', studentId)
    .eq('role', 'student')
    .select('id')
  if (error) {
    throw new Error(translateAppError(error.message))
  }
  if (!data?.length) {
    throw new Error(
      'O‘quvchi profili yangilanmadi (qator topilmadi yoki RLS cheklovi). ' +
        'Supabase’da `20260428120000_profiles_admin_update_class.sql` migratsiyasini ishga tushiring.',
    )
  }
}

export async function adminAssignStudentClass(
  studentId: string,
  classId: string | null,
): Promise<void> {
  const { error } = await supabase.rpc('admin_assign_student_class', {
    p_student_id: studentId,
    p_class_id: classId,
  })
  if (!error) {
    return
  }
  if (isMissingPostgrestRpc(error.message)) {
    await assignStudentClassViaUpdate(studentId, classId)
    return
  }
  throw new Error(translateAppError(error.message))
}
