import { supabase } from '@/services/supabase'
import type {
  QuizQuestionRow,
  QuizQuestionStudentView,
  QuizResultRow,
  QuizSubmitRpcResult,
  ResultDashboardRow,
} from '@/types'

export async function fetchQuizQuestionsForTeacher(
  lessonId: string,
): Promise<QuizQuestionRow[]> {
  const { data, error } = await supabase
    .from('quiz_questions')
    .select(
      'id, lesson_id, prompt, option_1, option_2, option_3, option_4, correct_option, created_at',
    )
    .eq('lesson_id', lessonId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }
  return (data ?? []) as QuizQuestionRow[]
}

export type CreateQuizQuestionInput = {
  lessonId: string
  prompt: string
  option1: string
  option2: string
  option3: string
  option4: string
  correctOption: 1 | 2 | 3 | 4
}

export async function createQuizQuestion(
  input: CreateQuizQuestionInput,
): Promise<QuizQuestionRow> {
  const prompt = input.prompt.trim()
  if (!prompt) {
    throw new Error('Savol matni kiritilishi shart')
  }
  const o1 = input.option1.trim()
  const o2 = input.option2.trim()
  const o3 = input.option3.trim()
  const o4 = input.option4.trim()
  if (!o1 || !o2 || !o3 || !o4) {
    throw new Error("To'rtta variant ham to'ldirilishi shart")
  }

  const { data, error } = await supabase
    .from('quiz_questions')
    .insert({
      lesson_id: input.lessonId,
      prompt,
      option_1: o1,
      option_2: o2,
      option_3: o3,
      option_4: o4,
      correct_option: input.correctOption,
    })
    .select(
      'id, lesson_id, prompt, option_1, option_2, option_3, option_4, correct_option, created_at',
    )
    .single()

  if (error) {
    throw new Error(error.message)
  }
  return data as QuizQuestionRow
}

export async function deleteQuizQuestion(questionId: string): Promise<void> {
  const { error } = await supabase.from('quiz_questions').delete().eq('id', questionId)
  if (error) {
    throw new Error(error.message)
  }
}

export async function fetchStudentQuizQuestions(
  lessonId: string,
): Promise<QuizQuestionStudentView[]> {
  const { data, error } = await supabase.rpc('get_student_quiz_questions', {
    p_lesson_id: lessonId,
  })

  if (error) {
    throw new Error(error.message)
  }
  return (data ?? []) as QuizQuestionStudentView[]
}

export async function submitLessonQuiz(
  lessonId: string,
  answers: Record<string, number>,
): Promise<QuizSubmitRpcResult> {
  const { data, error } = await supabase.rpc('submit_lesson_quiz', {
    p_lesson_id: lessonId,
    p_answers: answers,
  })

  if (error) {
    throw new Error(error.message)
  }

  const raw = data as unknown
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('submit_lesson_quiz javobi kutilmagan formatda')
  }
  const row = raw as {
    score: number
    total_questions: number
    result_id: string
  }

  return {
    score: row.score,
    total_questions: row.total_questions,
    result_id: String(row.result_id),
  }
}

/** Own results (student) or results for own lessons (teacher); RLS enforces scope. */
export async function fetchResultsDashboard(): Promise<ResultDashboardRow[]> {
  const { data, error } = await supabase
    .from('results')
    .select(
      `
      id,
      student_id,
      lesson_id,
      score,
      total_questions,
      created_at,
      lesson:lessons!lesson_id (
        title,
        class:classes ( name ),
        subject:subjects ( name )
      ),
      student:profiles!student_id (
        full_name
      )
    `,
    )
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map((row) => {
    const r = row as unknown as {
      id: unknown
      student_id: unknown
      lesson_id: unknown
      score: unknown
      total_questions: unknown
      created_at: unknown
      lesson?: {
        title: unknown
        class?: { name: unknown } | null
        subject?: { name: unknown } | null
      } | null
      student?: { full_name: unknown } | null
    }
    return {
      id: String(r.id),
      student_id: String(r.student_id),
      lesson_id: String(r.lesson_id),
      score: Number(r.score),
      total_questions: Number(r.total_questions),
      created_at: String(r.created_at),
      lesson: r.lesson
        ? {
            title: String(r.lesson.title),
            class: r.lesson.class ? { name: String(r.lesson.class.name) } : null,
            subject: r.lesson.subject ? { name: String(r.lesson.subject.name) } : null,
          }
        : null,
      student: r.student ? { full_name: r.student.full_name ? String(r.student.full_name) : null } : null,
    }
  })
}

export async function fetchMyResultForLesson(
  lessonId: string,
): Promise<QuizResultRow | null> {
  const { data, error } = await supabase
    .from('results')
    .select('id, student_id, lesson_id, score, total_questions, answers, created_at')
    .eq('lesson_id', lessonId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }
  if (!data) {
    return null
  }
  return {
    ...data,
    answers: (data.answers ?? {}) as Record<string, number>,
  } as QuizResultRow
}
