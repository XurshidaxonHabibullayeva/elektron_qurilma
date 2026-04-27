import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { TextField } from '@/components/TextField'
import { useAuth } from '@/hooks/useAuth'
import {
  createQuizQuestion,
  deleteQuizQuestion,
  fetchQuizQuestionsForTeacher,
} from '@/services/quiz.service'
import { fetchOwnedLesson } from '@/services/teacherLesson.service'
import type { QuizQuestionRow, TeacherLessonRow } from '@/types'
import { cn } from '@/utils/cn'
import { getYouTubeEmbedUrl } from '@/utils/youtube'

function formatWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat('uz-UZ', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

export default function TeacherQuizPage() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const { user } = useAuth()
  const teacherId = user?.id ?? ''

  const [lesson, setLesson] = useState<TeacherLessonRow | null | undefined>(undefined)
  const [questions, setQuestions] = useState<QuizQuestionRow[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [listLoading, setListLoading] = useState(true)

  const [prompt, setPrompt] = useState('')
  const [o1, setO1] = useState('')
  const [o2, setO2] = useState('')
  const [o3, setO3] = useState('')
  const [o4, setO4] = useState('')
  const [correctOption, setCorrectOption] = useState<1 | 2 | 3 | 4>(1)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadQuestions = useCallback(async (lid: string) => {
    const rows = await fetchQuizQuestionsForTeacher(lid)
    setQuestions(rows)
  }, [])

  useEffect(() => {
    if (!lessonId || !teacherId) {
      const t = window.setTimeout(() => {
        setLesson(null)
        setListLoading(false)
      }, 0)
      return () => window.clearTimeout(t)
    }
    let cancelled = false
    const t = window.setTimeout(() => {
      setLoadError(null)
      setLesson(undefined)
      void (async () => {
        try {
          const row = await fetchOwnedLesson(lessonId, teacherId)
          if (cancelled) {
            return
          }
          setLesson(row)
          if (row) {
            await loadQuestions(lessonId)
          }
        } catch (e) {
          if (!cancelled) {
            setLoadError(e instanceof Error ? e.message : 'Yuklashda xatolik')
            setLesson(null)
          }
        } finally {
          if (!cancelled) {
            setListLoading(false)
          }
        }
      })()
    }, 0)
    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [lessonId, teacherId, loadQuestions])

  async function handleAddQuestion(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!lessonId) {
      return
    }
    setFormError(null)
    setSaving(true)
    try {
      const row = await createQuizQuestion({
        lessonId,
        prompt,
        option1: o1,
        option2: o2,
        option3: o3,
        option4: o4,
        correctOption,
      })
      setQuestions((prev) => [...prev, row])
      setPrompt('')
      setO1('')
      setO2('')
      setO3('')
      setO4('')
      setCorrectOption(1)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Savol saqlanmadi')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    setFormError(null)
    try {
      await deleteQuizQuestion(id)
      setQuestions((prev) => prev.filter((q) => q.id !== id))
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'O‘chirib bo‘lmadi')
    } finally {
      setDeletingId(null)
    }
  }

  if (listLoading && lesson === undefined) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <div
          className="size-9 animate-spin rounded-full border-2 border-slate-200 border-t-teal-800 dark:border-slate-700 dark:border-t-teal-400"
          role="status"
          aria-label="Yuklanmoqda"
        />
      </div>
    )
  }

  if (loadError || lesson === null || lesson === undefined) {
    return (
      <Card className="mx-auto max-w-lg p-8 text-center">
        <p className="text-sm text-slate-700 dark:text-slate-300">
          {loadError ?? 'Dars topilmadi yoki u sizga tegishli emas.'}
        </p>
        <Link
          to="/teacher"
          className="mt-6 inline-flex rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-slate-900 shadow-md ring-1 ring-slate-200/80 hover:bg-slate-50 dark:bg-slate-900 dark:text-white dark:ring-slate-600 dark:hover:bg-slate-800"
        >
          Bosh sahifaga qaytish
        </Link>
      </Card>
    )
  }

  const L = lesson

  return (
    <div className="space-y-8">
      <div>
        <Link
          to="/teacher"
          className="text-sm font-medium text-teal-800 underline-offset-2 hover:underline dark:text-teal-300"
        >
          ← O‘qituvchi boshqaruvi
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Test: {L.title}
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Ko‘p tanlovli savollar (4 ta variant). Saqlashdan oldin to‘g‘ri javobni belgilang.
        </p>
      </div>

      {L.video_url && (
        <Card className="p-0 overflow-hidden max-w-2xl">
          {(() => {
            const embedUrl = getYouTubeEmbedUrl(L.video_url)
            if (embedUrl) {
              return (
                <div className="aspect-video bg-slate-100 dark:bg-slate-900 shadow-inner">
                  <iframe
                    src={embedUrl}
                    title={L.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="size-full border-0"
                  />
                </div>
              )
            }
            return null
          })()}
        </Card>
      )}

      <Card className="p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Yangi savol</h2>
        <form className="mt-5 space-y-4" onSubmit={handleAddQuestion}>
          <TextField
            id="qq-prompt"
            label="Savol"
            name="prompt"
            value={prompt}
            onChange={(ev) => setPrompt(ev.target.value)}
            placeholder="Savol matni…"
            required
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="qq-o1"
              label="Variant 1"
              name="o1"
              value={o1}
              onChange={(ev) => setO1(ev.target.value)}
              required
            />
            <TextField
              id="qq-o2"
              label="Variant 2"
              name="o2"
              value={o2}
              onChange={(ev) => setO2(ev.target.value)}
              required
            />
            <TextField
              id="qq-o3"
              label="Variant 3"
              name="o3"
              value={o3}
              onChange={(ev) => setO3(ev.target.value)}
              required
            />
            <TextField
              id="qq-o4"
              label="Variant 4"
              name="o4"
              value={o4}
              onChange={(ev) => setO4(ev.target.value)}
              required
            />
          </div>
          <div>
            <label
              htmlFor="qq-correct"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              To‘g‘ri javob
            </label>
            <select
              id="qq-correct"
              className={cn(
                'mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100',
                'focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:border-teal-400 dark:focus:ring-teal-400/20',
              )}
              value={correctOption}
              onChange={(ev) =>
                setCorrectOption(Number(ev.target.value) as 1 | 2 | 3 | 4)
              }
            >
              <option value={1}>Variant 1</option>
              <option value={2}>Variant 2</option>
              <option value={3}>Variant 3</option>
              <option value={4}>Variant 4</option>
            </select>
          </div>
          {formError ? (
            <p className="text-sm text-red-700 dark:text-red-300" role="alert">
              {formError}
            </p>
          ) : null}
          <Button type="submit" disabled={saving}>
            {saving ? 'Saqlanmoqda…' : 'Savol qo‘shish'}
          </Button>
        </form>
      </Card>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Savollar</h2>
        {questions.length === 0 ? (
          <Card className="p-8 text-center text-sm text-slate-600 dark:text-slate-400">
            Hozircha savol yo‘q. Savollar qo‘shilgach, o‘quvchilar testni ko‘radi.
          </Card>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-900/70">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700/80 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Savol</th>
                  <th className="px-4 py-3">To‘g‘ri</th>
                  <th className="px-4 py-3">Qo‘shilgan</th>
                  <th className="w-28 px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/80">
                {questions.map((q) => (
                  <tr key={q.id} className="dark:hover:bg-slate-800/30">
                    <td className="max-w-md px-4 py-3 text-slate-900 dark:text-slate-100">
                      <span className="line-clamp-2">{q.prompt}</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-teal-900 dark:text-teal-300">
                      Variant {q.correct_option}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {formatWhen(q.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                        disabled={deletingId === q.id}
                        onClick={() => {
                          void handleDelete(q.id)
                        }}
                      >
                        {deletingId === q.id ? '…' : 'O‘chirish'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
