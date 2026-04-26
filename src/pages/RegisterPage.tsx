import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { TextField } from '@/components/TextField'
import { useAuth } from '@/hooks/useAuth'
import { useToggle } from '@/hooks/useToggle'
import { loadOrCreateProfile } from '@/services/profile.service'
import { supabase } from '@/services/supabase'
import { roleHomePath } from '@/utils/rolePaths'
import { cn } from '@/utils/cn'

export default function RegisterPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [showPassword, togglePassword] = useToggle(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    const form = new FormData(e.currentTarget)
    const name = String(form.get('name') ?? '')
    const email = String(form.get('email') ?? '')
    const password = String(form.get('password') ?? '')
    setLoading(true)
    try {
      const { sessionCreated } = await signUp(email, password, name)
      if (sessionCreated) {
        const { data: sessionData, error: sessionErr } =
          await supabase.auth.getSession()
        if (sessionErr || !sessionData.session?.user) {
          throw new Error(sessionErr?.message ?? 'Ro‘yxatdan o‘tgach sessiya topilmadi')
        }
        const profile = await loadOrCreateProfile(sessionData.session.user.id)
        navigate(roleHomePath(profile.role), { replace: true })
      } else {
        setInfo(
          'Tasdiqlash havolasi elektron pochtangizga yuborildi. Pochtani tasdiqlagach kirishingiz mumkin.',
        )
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-8 sm:p-10">
      <div className="mb-8 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Ro‘yxatdan o‘tish
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Supabase’da foydalanuvchi yaratiladi va <code className="font-mono text-xs">profiles</code>{' '}
          qatoriga yozuv qo‘shiladi.
        </p>
      </div>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <TextField
          id="name"
          name="name"
          type="text"
          label="To‘liq ism"
          autoComplete="name"
          placeholder="Familiya Ism"
          required
        />
        <TextField
          id="email"
          name="email"
          type="email"
          label="Elektron pochta"
          autoComplete="email"
          placeholder="ism@maktab.uz"
          required
        />
        <div className="space-y-2">
          <TextField
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            label="Parol"
            autoComplete="new-password"
            placeholder="Kamida 8 belgi"
            minLength={8}
            required
          />
          <button
            type="button"
            onClick={togglePassword}
            className={cn(
              'text-xs font-medium text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline dark:text-slate-400 dark:hover:text-white',
            )}
          >
            {showPassword ? 'Parolni yashirish' : 'Parolni ko‘rsatish'}
          </button>
        </div>
        {error ? (
          <p
            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-200"
            role="alert"
          >
            {error}
          </p>
        ) : null}
        {info ? (
          <p
            className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-100"
            role="status"
          >
            {info}
          </p>
        ) : null}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Yaratilmoqda…' : 'Ro‘yxatdan o‘tish'}
        </Button>
      </form>
      <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
        Allaqachon ro‘yxatdan o‘tganmisiz?{' '}
        <Link
          to="/login"
          className="font-medium text-slate-900 underline-offset-4 hover:underline dark:text-white"
        >
          Kirish
        </Link>
      </p>
    </Card>
  )
}
