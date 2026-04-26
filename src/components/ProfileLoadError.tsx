import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { useAuth } from '@/hooks/useAuth'

export function ProfileLoadError() {
  const { signOut } = useAuth()

  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
      <Card className="max-w-md space-y-4 p-8 text-center">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
          Profil yuklanmadi
        </h1>
        <div className="space-y-3 text-left text-sm text-slate-600 dark:text-slate-400">
          <p>
            Tarmoqda <code className="font-mono text-xs">profiles</code> so‘rovi{' '}
            <strong className="text-slate-800 dark:text-slate-200">404</strong> /{' '}
            <code className="font-mono text-xs">PGRST205</code> bo‘lsa — jadval bu loyihada
            yaratilmagan yoki PostgREST uni ko‘rmayapti.
          </p>
          <ol className="list-decimal space-y-3 pl-5">
            <li>
              <strong className="text-slate-800 dark:text-slate-200">Tezkor yo‘l:</strong> repoda{' '}
              <code className="rounded bg-slate-100 px-1 font-mono text-xs dark:bg-slate-800">
                supabase/REMOTE_SETUP.sql
              </code>{' '}
              faylini oching, <strong>barcha</strong> mazmunini nusxalang → Supabase →{' '}
              <strong className="text-slate-800 dark:text-slate-200">SQL Editor</strong> → yangi
              so‘rov → <strong>Run</strong>.
            </li>
            <li>
              Yoki{' '}
              <code className="rounded bg-slate-100 px-1 font-mono text-xs dark:bg-slate-800">
                supabase/migrations/
              </code>{' '}
              ichidagi alohida fayllarni sanadan boshlab ketma-ket ishga tushiring:
            </li>
          </ol>
          <p className="pl-5 text-xs text-slate-500 dark:text-slate-500">
            Fayl nomlari <strong className="text-slate-700 dark:text-slate-300">2026</strong>-yil bilan
            boshlanadi: <span className="tracking-wider">202602…</span>, keyin{' '}
            <span className="tracking-wider">202603…</span> (2024 emas).
          </p>
          <ul className="list-disc space-y-1.5 pl-8 font-mono text-[11px] leading-relaxed tracking-wide text-slate-600 dark:text-slate-300">
            <li>20260226000000_profiles.sql</li>
            <li>20260227120000_classes_subjects.sql</li>
            <li>20260228140000_teacher_lessons.sql</li>
            <li>20260229100000_student_class_portal.sql</li>
            <li>20260301120000_quiz_system.sql</li>
            <li>20260426120000_admin_student_class.sql (admin — o‘quvchini sinfga biriktirish)</li>
          </ul>
          <p>
            <code className="font-mono text-xs">.env.local</code> dagi URL kalit shu loyiha bilan
            mosligini tekshiring. Migratsiyadan keyin brauzerni yangilang yoki qayta kiring.
          </p>
        </div>
        <Button
          type="button"
          className="w-full"
          onClick={() => {
            void signOut()
          }}
        >
          Chiqish
        </Button>
      </Card>
    </div>
  )
}
