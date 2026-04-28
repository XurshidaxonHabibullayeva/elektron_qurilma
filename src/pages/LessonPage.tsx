import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { LessonQuizSection } from '@/components/LessonQuizSection'
import { fetchLessonById } from '@/services/studentPortal.service'
import type { TeacherLessonRow } from '@/types'
import { getYouTubeEmbedUrl } from '@/utils/youtube'
import { DocumentViewer } from '@/components/DocumentViewer'

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

export default function LessonPage() {
  const navigate = useNavigate()
  const { lessonId } = useParams<{ lessonId: string }>()
  const [lesson, setLesson] = useState<TeacherLessonRow | null | undefined>(undefined)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!lessonId) {
      const t = window.setTimeout(() => setLesson(null), 0)
      return () => window.clearTimeout(t)
    }
    let cancelled = false
    const t = window.setTimeout(() => {
      setLoadError(null)
      setLesson(undefined)
      void fetchLessonById(lessonId)
        .then((row) => {
          if (!cancelled) {
            setLesson(row)
          }
        })
        .catch((e: unknown) => {
          if (!cancelled) {
            setLoadError(e instanceof Error ? e.message : 'Dars yuklanmadi')
            setLesson(null)
          }
        })
    }, 0)
    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [lessonId])

  if (lesson === undefined && !loadError) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div
          className="size-9 animate-spin rounded-full border-2 border-slate-200 border-t-slate-800 dark:border-slate-700 dark:border-t-sky-400"
          role="status"
          aria-label="Dars yuklanmoqda"
        />
      </div>
    )
  }

  if (loadError) {
    return (
      <Card className="mx-auto max-w-lg p-10 text-center">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Dars topilmadi</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{loadError}</p>
        <Button
          type="button"
          variant="secondary"
          className="mt-6"
          onClick={() => {
            navigate('/student')
          }}
        >
          Bosh sahifaga qaytish
        </Button>
      </Card>
    )
  }

  if (lesson === null || lesson === undefined) {
    return (
      <Card className="mx-auto max-w-lg p-10 text-center">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Dars topilmadi</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Dars mavjud emas yoki sinfga kirish huquqingiz yo‘q (administrator sinf biriktirishini
          tekshiring).
        </p>
        <Button
          type="button"
          variant="secondary"
          className="mt-6"
          onClick={() => {
            navigate('/student')
          }}
        >
          Bosh sahifaga qaytish
        </Button>
      </Card>
    )
  }

  const L: TeacherLessonRow = lesson

  return (
    <article className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-2">
        <Link
          to="/student"
          className="inline-flex text-sm font-medium text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline dark:text-slate-400 dark:hover:text-white"
        >
          ← Bosh sahifa
        </Link>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            {L.title}
          </h1>
          <p className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
            {L.quarter ? `${L.quarter}-chorak · ` : ''}
            {formatWhen(L.created_at)}
          </p>

        </div>
      </div>

      {L.description ? (
        <Card className="p-6 sm:p-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Tavsif
          </h2>
          <p className="mt-3 whitespace-pre-wrap text-base leading-relaxed text-slate-700 dark:text-slate-300">
            {L.description}
          </p>
        </Card>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400">Ushbu dars uchun tavsif kiritilmagan.</p>
      )}

      <Card className="space-y-4 p-6 sm:p-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Video
        </h2>
        {L.video_url ? (
          (() => {
            const embedUrl = getYouTubeEmbedUrl(L.video_url)
            if (embedUrl) {
              return (
                <div className="aspect-video overflow-hidden rounded-xl bg-slate-100 shadow-inner dark:bg-slate-900">
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
            return (
              <a
                href={L.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex text-base font-medium text-sky-800 underline-offset-2 hover:underline dark:text-sky-300"
              >
                Video havolasini ochish
              </a>
            )
          })()
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">Video havolasi kiritilmagan.</p>
        )}
      </Card>

      {L.material_url ? (
        <Card className="space-y-4 p-6 sm:p-8 border-teal-100/80 dark:border-teal-900/40 bg-teal-50/30 dark:bg-teal-950/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Qo‘shimcha material
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Darsga biriktirilgan fayl. Uni shu yerda o‘qishingiz yoki yuklab olishingiz mumkin.
              </p>
            </div>
            <a
              href={L.material_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500/50 dark:bg-teal-700 dark:hover:bg-teal-600"
            >
              <FileText className="size-5" />
              Yuklab olish
            </a>
          </div>
          
          <DocumentViewer url={L.material_url} />
        </Card>
      ) : null}

      <LessonQuizSection lessonId={L.id} />
    </article>
  )
}
