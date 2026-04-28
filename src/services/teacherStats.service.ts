import { supabase } from "@/services/supabase";

export interface TeacherResultRow {
  id: string;
  score: number;
  total_questions: number;
  attempt_number: number;
  created_at: string;
  student_name: string;
  lesson_title: string;
  class_name: string;
  subject_name: string;
}

export async function fetchTeacherResults(
  teacherId: string,
): Promise<TeacherResultRow[]> {
  const { data, error } = await supabase
    .from("results")
    .select(
      `
      id,
      score,
      total_questions,
      attempt_number,
      created_at,
      profiles:student_id (full_name),
      lessons:lesson_id (
        title,
        classes:class_id (name),
        subjects:subject_id (name)
      )
    `,
    )
    .eq("lessons.teacher_id", teacherId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((r: any) => ({
    id: r.id,
    score: r.score,
    total_questions: r.total_questions,
    attempt_number: r.attempt_number,
    created_at: r.created_at,
    student_name: r.profiles?.full_name || "Noma‘lum o‘quvchi",
    lesson_title: r.lessons?.title || "O‘chirilgan dars",
    class_name: r.lessons?.classes?.name || "—",
    subject_name: r.lessons?.subjects?.name || "—",
  }));
}

export async function incrementLessonView(lessonId: string) {
  const { error } = await supabase.rpc("increment_lesson_views", {
    l_id: lessonId,
  });
  if (error) {
    console.error("View increment error:", error);
  }
}

export async function incrementLessonDownloads(lessonId: string) {
  const { error } = await supabase.rpc("increment_lesson_downloads", {
    l_id: lessonId,
  });
  if (error) {
    console.error("Download increment error:", error);
  }
}
