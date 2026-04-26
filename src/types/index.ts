export const USER_ROLES = ['admin', 'teacher', 'student'] as const
export type UserRole = (typeof USER_ROLES)[number]

export type ProfileRow = {
  id: string
  full_name: string | null
  role: UserRole
  /** Set for students; assign via SQL or admin tooling. */
  class_id: string | null
}

export type User = {
  id: string
  email: string
  name: string
}

export type ClassRow = {
  id: string
  name: string
  created_at: string
}

export type SubjectRow = {
  id: string
  name: string
  created_at: string
}

/** Row from public.lessons (Supabase). */
export type TeacherLessonRow = {
  id: string
  teacher_id: string
  class_id: string
  subject_id: string
  title: string
  description: string | null
  video_url: string | null
  material_url: string | null
  created_at: string
  updated_at: string
}

export type QuizQuestionRow = {
  id: string
  lesson_id: string
  prompt: string
  option_1: string
  option_2: string
  option_3: string
  option_4: string
  correct_option: number
  created_at: string
}

/** Question row exposed to students (no correct answer). */
export type QuizQuestionStudentView = Omit<QuizQuestionRow, 'correct_option'>

export type QuizResultRow = {
  id: string
  student_id: string
  lesson_id: string
  score: number
  total_questions: number
  answers: Record<string, number>
  created_at: string
}

export type QuizSubmitRpcResult = {
  score: number
  total_questions: number
  result_id: string
}

/** Result row with lesson title for dashboards (Supabase embed). */
export type ResultDashboardRow = {
  id: string
  student_id: string
  lesson_id: string
  score: number
  total_questions: number
  created_at: string
  lesson: { title: string } | null
}
