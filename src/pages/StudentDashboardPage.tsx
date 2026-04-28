import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/Card'
import { PageHeader } from '@/components/PageHeader'
import { StatCard } from '@/components/StatCard'
import { useAuth } from '@/hooks/useAuth'
import {
  fetchClassById,
  fetchLessonsForClassAndSubject,
  fetchSubjectsForClass,
  fetchAssignedSubjectsForClass,
} from '@/services/studentPortal.service'

import type { ClassRow, SubjectRow, TeacherLessonRow } from '@/types'
import { cn } from '@/utils/cn'

function escapeSqlStringLiteral(value: string): string {
  return value.replaceAll("'", "''")
}

export default function StudentDashboardPage() {
  const { profile, user } = useAuth()
  const classId = profile?.class_id ?? null
  const emailForSql = escapeSqlStringLiteral(
    (user?.email ?? 'admin@elektron.local').trim() || 'admin@elektron.local',
  )
  const promoteToAdminSql =
    `update public.profiles\n` +
    `set role = 'admin'\n` +
    `where id = (\n` +
    `  select id from auth.users\n` +
    `  where lower(email) = lower('${emailForSql}')\n` +
    `  limit 1\n` +
    `);`

  const [classRow, setClassRow] = useState<ClassRow | null>(null)
  const [subjects, setSubjects] = useState<SubjectRow[]>([])
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('')
  const [lessons, setLessons] = useState<TeacherLessonRow[]>([])
  const [selectedQuarter, setSelectedQuarter] = useState<string>('')
  const [loadingMeta, setLoadingMeta] = useState(true)
  const [loadingLessons, setLoadingLessons] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadClassAndSubjects = useCallback(async () => {
    if (!classId) {
      setClassRow(null)
      setSubjects([])
      setSelectedSubjectId('')
      setLessons([])
      setLoadingMeta(false)
      return
    }
    setError(null)
    setLoadingMeta(true)
    try {
      const [cls, allSubs, assignedSubs] = await Promise.all([
        fetchClassById(classId),
        fetchSubjectsForClass(classId), // derived from lessons
        fetchAssignedSubjectsForClass(classId), // explicit
      ])

      setClassRow(cls)
      
      // If there are explicit assignments for the class, use them.
      // Otherwise fallback to showing subjects that have lessons.
      const displaySubs = assignedSubs.length > 0 ? assignedSubs : allSubs
      setSubjects(displaySubs)

      setSelectedSubjectId((prev) => {
        if (prev && displaySubs.some((s) => s.id === prev)) {
          return prev
        }
        return displaySubs[0]?.id ?? ''
      })

    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sinf ma’lumotlari yuklanmadi')
    } finally {
      setLoadingMeta(false)
    }
  }, [classId, user])

  useEffect(() => {
    const t = window.setTimeout(() => {
      void loadClassAndSubjects()
    }, 0)
    return () => window.clearTimeout(t)
  }, [loadClassAndSubjects])

  useEffect(() => {
    let cancelled = false
    const t = window.setTimeout(() => {
      if (!classId || !selectedSubjectId) {
        if (!cancelled) {
          setLessons([])
          setLoadingLessons(false)
        }
        return
      }
      setLoadingLessons(true)
      setError(null)
      void fetchLessonsForClassAndSubject(classId, selectedSubjectId)
        .then((rows) => {
          if (!cancelled) {
            setLessons(rows)
          }
        })
        .catch((e: unknown) => {
          if (!cancelled) {
            setError(e instanceof Error ? e.message : 'Darslar yuklanmadi')
          }
        })
        .finally(() => {
          if (!cancelled) {
            setLoadingLessons(false)
          }
        })
    }, 0)
    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [classId, selectedSubjectId])

  const filteredLessons = useMemo(() => {
    if (!selectedQuarter) return lessons
    return lessons.filter((l) => String(l.quarter) === selectedQuarter)
  }, [lessons, selectedQuarter])

  if (!classId) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="O‘quvchi boshqaruvi"
          description={
            <>
              Hisobingiz hali sinfga biriktirilmagan. Administratordan{' '}
              <code className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                profiles.class_id
              </code>{' '}
              maydonini Supabase’da to‘ldirishni so‘rang.
            </>
          }
        />
        <Card className="border-amber-200 bg-amber-50/50 p-6 text-sm text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
          <p className="mb-4 rounded-lg border border-amber-300/60 bg-amber-100/40 p-3 text-amber-950 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-50">
            <strong>Administrator bo‘lishingiz kerakmi?</strong> Yon panelda «O‘quvchi» turgan bo‘lsa,
            bazada <code className="rounded bg-white/70 px-1 font-mono text-xs dark:bg-slate-900/70">profiles.role</code>{' '}
            hali <code className="rounded bg-white/70 px-1 font-mono text-xs dark:bg-slate-900/70">student</code> — yangi
            foydalanuvchi uchun trigger avtomatik shunday yozadi. Supabase → <strong>SQL Editor</strong> da quyidagi so‘rovni
            bir marta ishga tushiring, keyin brauzerni <strong>yangilang (F5)</strong> yoki qayta kiring; keyin{' '}
            <code className="rounded bg-white/70 px-1 font-mono text-xs dark:bg-slate-900/70">/admin</code> ochiladi.
          </p>
          <code className="mb-4 block whitespace-pre-wrap rounded-xl bg-white/80 p-3 font-mono text-xs text-slate-800 shadow-inner dark:bg-slate-900/80 dark:text-slate-200">
            {promoteToAdminSql}
          </code>
          <p className="mb-3">
            <strong>O‘quvchi uchun sinf:</strong> administrator sifatida kirgach «Sinflar va fanlar» sahifasida pastda{' '}
            <strong>«O‘quvchilarni sinfga biriktirish»</strong> jadvalidan sinf tanlang va <strong>Saqlash</strong> ni
            bosing.
          </p>
          <p className="mb-2 text-xs text-amber-900/90 dark:text-amber-200/90">
            SQL Editor uchun namuna (o‘quvchi emaili va sinf UUID) — faqat haqiqiy o‘quvchi akkauntlari uchun:
          </p>
          <code className="mt-1 block whitespace-pre-wrap rounded-xl bg-white/80 p-3 font-mono text-xs text-slate-800 shadow-inner dark:bg-slate-900/80 dark:text-slate-200">
            {`update public.profiles\nset class_id = '<SINF_UUID>'\nwhere id = (\n  select id from auth.users\n  where lower(email) = lower('oquvchi@email.com')\n  limit 1\n);`}
          </code>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="O‘quvchi boshqaruvi"
        description="Fan tugmasini tanlang, darslar ro‘yxatidan kerakli mavzuni oching va uyda material bilan tanishing."
      />

      {classRow ? (
        <div className="-mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:-mt-4">
          <StatCard label="Sinfingiz" value={classRow.name} />
          <StatCard
            label="Fanlar"
            value={loadingMeta ? '…' : subjects.length}
            hint="Ushbu sinf bo‘yicha"
          />
          <StatCard
            label="Darslar (tanlangan fan)"
            value={
              !selectedSubjectId || loadingLessons ? (loadingLessons ? '…' : '—') : lessons.length
            }
            hint={
              subjects.find((s) => s.id === selectedSubjectId)?.name ?? 'Fanni tanlang'
            }
          />
        </div>
      ) : null}

      {error ? (
        <Card className="border-red-200 bg-red-50/60 p-4 text-sm text-red-900 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-100">
          {error}
        </Card>
      ) : null}

      <section aria-labelledby="subjects-heading">
        <h2
          id="subjects-heading"
          className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
        >
          Sinfingiz fanlari
        </h2>
        {loadingMeta ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Fanlar yuklanmoqda…</p>
        ) : subjects.length === 0 ? (
          <Card className="p-6 text-sm text-slate-600 dark:text-slate-400">
            Hozircha fan yo‘q — sinfingiz uchun darslar chop etilmagan. O‘qituvchilar o‘z
            panelidan dars joylashishi mumkin.
          </Card>
        ) : (
          <div className="flex flex-wrap gap-2">
            {subjects.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedSubjectId(s.id)}
                className={cn(
                  'rounded-full border px-4 py-2 text-sm font-medium transition-colors shadow-sm',
                  selectedSubjectId === s.id
                    ? 'border-sky-600 bg-sky-600 text-white shadow-md dark:border-sky-500 dark:bg-sky-600'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-500',
                )}
              >
                {s.name}
              </button>
            ))}
          </div>
        )}
      </section>

      {selectedSubjectId && subjects.length > 0 && (
        <section aria-labelledby="quarters-heading">
          <h2
            id="quarters-heading"
            className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
          >
            Choraklar bo‘yicha saralash
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedQuarter('')}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors shadow-sm',
                selectedQuarter === ''
                  ? 'border-slate-800 bg-slate-800 text-white dark:border-slate-200 dark:bg-slate-200 dark:text-slate-900'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200',
              )}
            >
              Hammasi
            </button>
            {['1', '2', '3', '4'].map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setSelectedQuarter(q)}
                className={cn(
                  'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors shadow-sm',
                  selectedQuarter === q
                    ? 'border-sky-600 bg-sky-600 text-white dark:border-sky-500'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200',
                )}
              >
                {q}-chorak
              </button>
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="lessons-heading">
        <h2
          id="lessons-heading"
          className="mb-4 text-lg font-semibold text-slate-900 dark:text-white"
        >
          Darslar
          {selectedSubjectId && subjects.length
            ? ` · ${subjects.find((x) => x.id === selectedSubjectId)?.name ?? ''}`
            : null}
        </h2>
        {!selectedSubjectId ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Yuqoridan fanni tanlang.</p>
        ) : loadingLessons ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Darslar yuklanmoqda…</p>
        ) : filteredLessons.length === 0 ? (
          <Card className="p-6 text-sm text-slate-600 dark:text-slate-400">
            {lessons.length === 0
              ? 'Ushbu fan bo‘yicha hozircha mavzular yo‘q.'
              : 'Tanlangan chorak bo‘yicha dars topilmadi.'}
          </Card>
        ) : (
          <ul className="space-y-4">
            {filteredLessons.map((lesson) => (
              <li key={lesson.id}>
                <Card className="p-5 transition hover:border-slate-300 hover:shadow-md dark:hover:border-slate-600">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                          {lesson.title}
                        </h3>
                        {lesson.quarter && (
                          <span className="inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-800 dark:bg-sky-900/30 dark:text-sky-300">
                            {lesson.quarter}-chorak
                          </span>
                        )}
                      </div>

                      {lesson.description ? (
                        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                          {lesson.description}
                        </p>
                      ) : (
                        <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">Tavsif yo‘q</p>
                      )}
                      {lesson.video_url ? (
                        <a
                          href={lesson.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex text-sm font-medium text-sky-800 underline-offset-2 hover:underline dark:text-sky-300"
                          onClick={(ev) => ev.stopPropagation()}
                        >
                          Videoni ochish (yangi oyna)
                        </a>
                      ) : (
                        <p className="mt-3 text-sm text-slate-400 dark:text-slate-500">Video havolasi yo‘q</p>
                      )}
                    </div>
                    <Link
                      to={`/student/lessons/${lesson.id}`}
                      className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-2 text-center text-sm font-medium text-slate-900 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
                    >
                      Darsni ochish
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
