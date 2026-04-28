import { useState, type FormEvent } from 'react'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { PageHeader } from '@/components/PageHeader'
import { TextField } from '@/components/TextField'
import { useAuth } from '@/hooks/useAuth'
import { updateProfile } from '@/services/profile.service'
import { supabase } from '@/services/supabase'

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth()
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // 1. Profil jadvalini yangilash
      await updateProfile(user.id, fullName)
      
      // 2. Auth metadata-ni yangilash (sinxronizatsiya uchun)
      await supabase.auth.updateUser({
        data: { full_name: fullName.trim() }
      })

      await refreshProfile()
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Profilni yangilashda xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader
        title="Mening profilim"
        description="Shaxsiy ma'lumotlaringizni boshqaring va o'zgartiring."
      />

      <Card className="p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <TextField
              label="Email"
              value={user?.email ?? ''}
              disabled
              hint="Email manzilini o'zgartirib bo'lmaydi"
            />
            
            <TextField
              label="Foydalanuvchi roli"
              value={profile?.role === 'admin' ? 'Administrator' : profile?.role === 'teacher' ? "O'qituvchi" : "O'quvchi"}
              disabled
              hint="Rolni faqat administrator o'zgartirishi mumkin"
            />

            <TextField
              label="Ism-sharifingiz"
              placeholder="Masalan: Alisher Navoiy"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          )}

          {success && (
            <p className="text-sm text-teal-600 dark:text-teal-400" role="alert">
              Profil muvaffaqiyatli yangilandi!
            </p>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={loading || fullName.trim() === profile?.full_name}>
              {loading ? 'Saqlanmoqda...' : 'Saqlash'}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-6 sm:p-8 border-amber-100 bg-amber-50/20 dark:border-amber-900/30">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-400">
          Xavfsizlik
        </h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Parolingizni o'zgartirish uchun tizimdan chiqing va "Parolni unutdingizmi?" xizmatidan foydalaning (tez kunda profil ichida ham qo'shiladi).
        </p>
      </Card>
    </div>
  )
}
