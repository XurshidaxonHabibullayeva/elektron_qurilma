import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { PageHeader } from '@/components/PageHeader'
import { StatCard } from '@/components/StatCard'
import { fetchResultsDashboard } from '@/services/quiz.service'
import type { ResultDashboardRow } from '@/types'
import { cn } from '@/utils/cn'

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

function shortStudentId(id: string): string {
  if (id.length <= 10) {
    return id
  }
  return `${id.slice(0, 6)}…${id.slice(-4)}`
}

export default function TeacherResultsPage() {
  const [rows, setRows] = useState<ResultDashboardRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      const data = await fetchResultsDashboard()
      setRows(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Natijalar yuklanmadi')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = window.setTimeout(() => {
      void load()
    }, 0)
    return () => window.clearTimeout(t)
  }, [load])

  const avgRatio =
    rows.length === 0
      ? null
      : rows.reduce(
          (acc, r) => acc + (r.total_questions ? r.score / r.total_questions : 0),
          0,
        ) / rows.length

  return (
    <div className="space-y-8">
      <PageHeader
        title="Test natijalari"
        description="O‘quvchilaringiz sizning darslaringiz bo‘yicha topshirgan testlari. «O‘quvchi» ustuni qisqartirilgan foydalanuvchi identifikatori (auth uid bilan bir xil)."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Jami urinishlar"
          value={loading ? '…' : rows.length}
          hint="Siz ko‘ra oladigan qatorlar"
        />
        <StatCard
          label="O‘rtacha ball (%)"
          value={
            loading || rows.length === 0
              ? loading
                ? '…'
                : '—'
              : `${Math.round(avgRatio! * 100)}%`
          }
          hint="Ball / savollar nisbati bo‘yicha o‘rtacha"
        />
        <StatCard
          label="Turli darslar"
          value={
            loading
              ? '…'
              : new Set(rows.map((r) => r.lesson_id).filter(Boolean)).size
          }
          hint="Kamida bitta natija bo‘lgan darslar soni"
        />
      </div>

      {error ? (
        <Card className="border-red-200 bg-red-50/60 p-4 text-sm text-red-900 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-100">
          {error}
        </Card>
      ) : null}

      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-700/80">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Barcha urinishlar</h2>
          <Button
            type="button"
            variant="ghost"
            className="text-teal-800 dark:text-teal-300"
            onClick={() => {
              void load()
            }}
          >
            Yangilash
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700/80 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3">O‘quvchi</th>
                <th className="px-5 py-3">Sinf</th>
                <th className="px-5 py-3">Fan</th>
                <th className="px-5 py-3">Dars (Mavzu)</th>
                <th className="px-5 py-3">Ball</th>
                <th className="px-5 py-3">Sana</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/80">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-500 dark:text-slate-400">
                    Yuklanmoqda…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-500 dark:text-slate-400">
                    Hozircha natija yo‘q. O‘quvchilar test topshirgach, bu yerda qatorlar paydo bo‘ladi.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {r.student?.full_name || 'Ism kiritilmagan'}
                        </span>
                        <span
                          className="font-mono text-[10px] text-slate-400 dark:text-slate-500"
                          title={r.student_id}
                        >
                          ID: {shortStudentId(r.student_id)}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-700 dark:text-slate-300">
                      {r.lesson?.class?.name || '—'}
                    </td>
                    <td className="px-5 py-3 text-slate-700 dark:text-slate-300">
                      <span className="inline-flex items-center rounded-md bg-teal-50 px-2 py-1 text-xs font-medium text-teal-700 ring-1 ring-inset ring-teal-600/10 dark:bg-teal-400/10 dark:text-teal-400 dark:ring-teal-400/20">
                        {r.lesson?.subject?.name || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-100">
                      {r.lesson?.title ?? '—'}
                    </td>
                    <td className="px-5 py-3">
                      <span className={cn(
                        "font-bold",
                        (r.score / r.total_questions) >= 0.8 ? "text-green-600 dark:text-green-400" : 
                        (r.score / r.total_questions) >= 0.5 ? "text-amber-600 dark:text-amber-400" : 
                        "text-red-600 dark:text-red-400"
                      )}>
                        {r.score} / {r.total_questions}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-400">
                      {formatWhen(r.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
