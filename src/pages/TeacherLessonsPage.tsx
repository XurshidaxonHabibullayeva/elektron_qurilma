import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { PageHeader } from '@/components/PageHeader'
import { StatCard } from '@/components/StatCard'
import { useAuth } from '@/hooks/useAuth'
import { fetchClasses, fetchSubjects } from '@/services/classSubject.service'
import { deleteLesson, fetchMyLessons } from '@/services/teacherLesson.service'
import type { ClassRow, SubjectRow, TeacherLessonRow } from '@/types'

function formatWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat('uz-UZ', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

export default function TeacherLessonsPage() {
  const { user } = useAuth()
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [subjects, setSubjects] = useState<SubjectRow[]>([])
  const [lessons, setLessons] = useState<TeacherLessonRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const classNameById = useMemo(() => {
    const m = new Map<string, string>()
    for (const c of classes) {
      m.set(c.id, c.name)
    }
    return m
  }, [classes])

  const subjectNameById = useMemo(() => {
    const m = new Map<string, string>()
    for (const s of subjects) {
      m.set(s.id, s.name)
    }
    return m
  }, [subjects])

  const loadData = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      const [c, s, l] = await Promise.all([fetchClasses(), fetchSubjects(), fetchMyLessons()])
      setClasses(c)
      setSubjects(s)
      setLessons(l)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ma’lumotlar yuklanmadi')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  async function handleDelete(lessonId: string) {
    if (!window.confirm('Haqiqatan ham ushbu darsni o‘chirib tashlamoqchimisiz?')) {
      return
    }
    try {
      await deleteLesson(lessonId)
      setLessons((prev) => prev.filter((l) => l.id !== lessonId))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'O‘chirishda xatolik yuz berdi')
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Mening darslarim"
        description="Siz yaratgan barcha darslar ro‘yxati. Bu yerda darslarni ko‘rishingiz, tahrirlashingiz yoki o‘chirishingiz mumkin."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Jami darslar" value={loading ? '…' : lessons.length} />
        <StatCard label="Faol sinflar" value={loading ? '…' : classes.length} />
        <StatCard label="Fanlar" value={loading ? '…' : subjects.length} />
      </div>

      {error ? (
        <Card className="border-red-200 bg-red-50/60 p-4 text-sm text-red-900 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-100">
          {error}
        </Card>
      ) : null}

      <section aria-labelledby="lessons-heading">
        {loading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Darslar yuklanmoqda…</p>
        ) : lessons.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">Sizda hali darslar yo‘q.</p>
            <Button as={Link} to="/teacher" className="mt-4">
              Yangi dars yaratish
            </Button>
          </Card>
        ) : (
          <ul className="space-y-4">
            {lessons.map((lesson) => (
              <li key={lesson.id}>
                <Card className="border-teal-100/80 p-5 dark:border-teal-900/40">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                        {lesson.title}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {classNameById.get(lesson.class_id) ?? lesson.class_id} ·{' '}
                        {subjectNameById.get(lesson.subject_id) ?? lesson.subject_id}
                        {lesson.quarter ? ` · ${lesson.quarter}-chorak` : ''}
                        {' · '}
                        {formatWhen(lesson.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                    {lesson.video_url && (
                      <a
                        href={lesson.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-teal-800 underline-offset-2 hover:underline dark:text-teal-300"
                      >
                        Video
                      </a>
                    )}
                    {lesson.material_url && (
                      <a
                        href={lesson.material_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-teal-800 underline-offset-2 hover:underline dark:text-teal-300"
                      >
                        Material
                      </a>
                    )}
                    <Link
                      to={`/teacher/lessons/${lesson.id}/quiz`}
                      className="rounded-xl bg-teal-700 px-3 py-1.5 font-medium text-white shadow-md hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500"
                    >
                      Test
                    </Link>
                    <div className="flex items-center gap-2 ml-auto">
                      <Button
                        as={Link}
                        to={`/teacher?edit=${lesson.id}`}
                        variant="secondary"
                        size="sm"
                      >
                        Tahrirlash
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40"
                        onClick={() => handleDelete(lesson.id)}
                      >
                        O‘chirish
                      </Button>
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
