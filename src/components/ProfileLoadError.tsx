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
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Supabase’da <code className="font-mono">profiles</code> uchun SQL migratsiyasi
          qo‘llanganini va tizimga kirganingizni tekshiring.
        </p>
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
