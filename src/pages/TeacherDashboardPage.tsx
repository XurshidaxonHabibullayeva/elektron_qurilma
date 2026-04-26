import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { PageHeader } from '@/components/PageHeader'
import { StatCard } from '@/components/StatCard'
import { TextField } from '@/components/TextField'
import { useAuth } from '@/hooks/useAuth'
import { fetchClasses, fetchSubjects } from '@/services/classSubject.service'
import { createLesson, fetchMyLessons } from '@/services/teacherLesson.service'
import type { ClassRow, SubjectRow, TeacherLessonRow } from '@/types'
import { cn } from '@/utils/cn'

function selectClassName(): string {
  return cn(
    'mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100',
    'focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:border-teal-400 dark:focus:ring-teal-400/20',
  )
}

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

export default function TeacherDashboardPage() {
  const { user } = useAuth()
  const teacherId = user?.id ?? ''

  const [classes, setClasses] = useState<ClassRow[]>([])
  const [subjects, setSubjects] = useState<SubjectRow[]>([])
  const [lessons, setLessons] = useState<TeacherLessonRow[]>([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [lessonsLoading, setLessonsLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  const [classId, setClassId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [materialUrl, setMaterialUrl] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

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

  const loadCatalog = useCallback(async () => {
    setListError(null)
    setCatalogLoading(true)
    try {
      const [c, s] = await Promise.all([fetchClasses(), fetchSubjects()])
      setClasses(c)
      setSubjects(s)
    } catch (e) {
      setListError(e instanceof Error ? e.message : 'Sinflar yoki fanlar yuklanmadi')
    } finally {
      setCatalogLoading(false)
    }
  }, [])

  const loadLessons = useCallback(async () => {
    setListError(null)
    setLessonsLoading(true)
    try {
      const rows = await fetchMyLessons()
      setLessons(rows)
    } catch (e) {
      setListError(e instanceof Error ? e.message : 'Darslar yuklanmadi')
    } finally {
      setLessonsLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = window.setTimeout(() => {
      void loadCatalog()
    }, 0)
    return () => window.clearTimeout(t)
  }, [loadCatalog])

  useEffect(() => {
    const t = window.setTimeout(() => {
      void loadLessons()
    }, 0)
    return () => window.clearTimeout(t)
  }, [loadLessons])

  async function handleCreateLesson(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormError(null)
    if (!teacherId) {
      setFormError('Avvalo tizimga kiring.')
      return
    }
    setSaving(true)
    try {
      const row = await createLesson({
        teacherId,
        classId,
        subjectId,
        title,
        description: description.trim() || null,
        videoUrl: videoUrl.trim() || null,
        materialUrl: materialUrl.trim() || null,
      })
      setLessons((prev) => [row, ...prev])
      setClassId('')
      setSubjectId('')
      setTitle('')
      setDescription('')
      setVideoUrl('')
      setMaterialUrl('')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Dars saqlanmadi')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8 sm:space-y-10">
      <PageHeader
        title="O‘qituvchi boshqaruvi"
        description={
          <>
            Sinf va fanni tanlab, video va material havolalari bilan yangi dars yarating.
            Ma’lumotlar Supabase{' '}
            <code className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-800 dark:bg-slate-800 dark:text-slate-200">
              lessons
            </code>{' '}
            jadvalida saqlanadi.
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Mening darslarim"
          value={lessonsLoading ? '…' : lessons.length}
          hint="Akkauntingiz ostidagi darslar"
        />
        <StatCard
          label="Sinflar"
          value={catalogLoading ? '…' : classes.length}
          hint="Administrator katalogidan"
        />
        <StatCard
          label="Fanlar"
          value={catalogLoading ? '…' : subjects.length}
          hint="Darsga biriktirish uchun"
        />
      </div>

      {listError ? (
        <Card className="border-red-200 bg-red-50/60 p-4 text-sm text-red-900 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-100">
          {listError}
        </Card>
      ) : null}

      <Card className="p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Yangi dars</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Sinflar va fanlar ro‘yxatini administrator boshqaradi. Ro‘yxat bo‘sh bo‘lsa, avval
          ulardan so‘rang.
        </p>
        <form className="mt-6 space-y-5" onSubmit={handleCreateLesson}>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="lesson-class"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Sinf
              </label>
              <select
                id="lesson-class"
                className={selectClassName()}
                value={classId}
                onChange={(ev) => setClassId(ev.target.value)}
                required
                disabled={catalogLoading}
              >
                <option value="">Sinfni tanlang</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="lesson-subject"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Fan
              </label>
              <select
                id="lesson-subject"
                className={selectClassName()}
                value={subjectId}
                onChange={(ev) => setSubjectId(ev.target.value)}
                required
                disabled={catalogLoading}
              >
                <option value="">Fanni tanlang</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <TextField
            id="lesson-title"
            label="Dars nomi"
            name="title"
            value={title}
            onChange={(ev) => setTitle(ev.target.value)}
            placeholder="Dars sarlavhasi"
            required
          />
          <div className="space-y-1.5">
            <label
              htmlFor="lesson-description"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Tavsif
            </label>
            <textarea
              id="lesson-description"
              name="description"
              rows={4}
              value={description}
              onChange={(ev) => setDescription(ev.target.value)}
              placeholder="O‘quvchilar nima o‘rganadi?"
              className={cn(
                'block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100',
                'placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:placeholder:text-slate-500 dark:focus:border-teal-400 dark:focus:ring-teal-400/20',
              )}
            />
          </div>
          <TextField
            id="lesson-video"
            label="Video havolasi (URL)"
            name="videoUrl"
            type="url"
            value={videoUrl}
            onChange={(ev) => setVideoUrl(ev.target.value)}
            placeholder="https://…"
          />
          <TextField
            id="lesson-material"
            label="Material havolasi (URL)"
            name="materialUrl"
            type="url"
            value={materialUrl}
            onChange={(ev) => setMaterialUrl(ev.target.value)}
            placeholder="https://… (PDF, taqdimot va hokazo)"
          />
          {formError ? (
            <p className="text-sm text-red-700 dark:text-red-300" role="alert">
              {formError}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="submit" disabled={saving || catalogLoading}>
              {saving ? 'Saqlanmoqda…' : 'Darsni saqlash'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={lessonsLoading}
              onClick={() => {
                void loadLessons()
              }}
            >
              Ro‘yxatni yangilash
            </Button>
          </div>
        </form>
      </Card>

      <section aria-labelledby="my-lessons-heading">
        <h2
          id="my-lessons-heading"
          className="mb-4 text-lg font-semibold text-slate-900 dark:text-white"
        >
          Mening darslarim
        </h2>
        {lessonsLoading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Darslar yuklanmoqda…</p>
        ) : lessons.length === 0 ? (
          <Card className="p-8 text-center text-sm text-slate-600 dark:text-slate-400">
            Hozircha dars yo‘q. Yuqoridagi forma orqali yarating.
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
                        {' · '}
                        {formatWhen(lesson.created_at)}
                      </p>
                      {lesson.description ? (
                        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                          {lesson.description}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                    {lesson.video_url ? (
                      <a
                        href={lesson.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-teal-800 underline-offset-2 hover:underline dark:text-teal-300"
                      >
                        Video
                      </a>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500">Video yo‘q</span>
                    )}
                    {lesson.material_url ? (
                      <a
                        href={lesson.material_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-teal-800 underline-offset-2 hover:underline dark:text-teal-300"
                      >
                        Material
                      </a>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500">Material yo‘q</span>
                    )}
                    <Link
                      to={`/teacher/lessons/${lesson.id}/quiz`}
                      className="rounded-xl bg-teal-700 px-3 py-1.5 font-medium text-white shadow-md hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500"
                    >
                      Testni tahrirlash
                    </Link>
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
