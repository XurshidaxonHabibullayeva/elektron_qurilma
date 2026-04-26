import { type FormEvent, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { TextField } from '@/components/TextField'
import { useAuth } from '@/hooks/useAuth'
import { loadOrCreateProfile } from '@/services/profile.service'
import { supabase } from '@/services/supabase'
import { pathAllowedForRole, roleHomePath } from '@/utils/rolePaths'
import { clearLoginFlash, peekLoginFlash } from '@/utils/loginFlash'
import { translateAppError } from '@/utils/supabaseAuthErrors'

export default function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from =
    (location.state as { from?: string } | null)?.from?.trim() || ''

  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(() => peekLoginFlash())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (info) {
      clearLoginFlash()
    }
  }, [info])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const form = new FormData(e.currentTarget)
    const email = String(form.get('email') ?? '').trim()
    const password = String(form.get('password') ?? '')
    setInfo(null)
    setLoading(true)
    try {
      await signIn(email, password)
      const { data: sessionData, error: sessionErr } =
        await supabase.auth.getSession()
      if (sessionErr || !sessionData.session?.user) {
        throw new Error(
          translateAppError(sessionErr?.message ?? 'Kirishdan keyin sessiya topilmadi'),
        )
      }
      const profile = await loadOrCreateProfile(sessionData.session.user.id)
      const target =
        from && pathAllowedForRole(from, profile.role)
          ? from
          : roleHomePath(profile.role)
      navigate(target, { replace: true })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Xatolik yuz berdi'
      setError(translateAppError(msg))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-8 sm:p-10">
      <div className="mb-8 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Tizimga kirish
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Supabase autentifikatsiyasida ro‘yxatdan o‘tgan elektron pochta va parolingizni kiriting.
        </p>
      </div>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <TextField
          id="email"
          name="email"
          type="email"
          label="Elektron pochta"
          autoComplete="email"
          placeholder="ism@maktab.uz"
          required
        />
        <TextField
          id="password"
          name="password"
          type="password"
          label="Parol"
          autoComplete="current-password"
          placeholder="••••••••"
          required
        />
        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-xs font-medium text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline dark:text-slate-400 dark:hover:text-white"
          >
            Parolni unutdingizmi?
          </Link>
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
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-100"
            role="status"
          >
            {info}
          </p>
        ) : null}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Kirilmoqda…' : 'Davom etish'}
        </Button>
      </form>
      <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
        Akkauntingiz yo‘qmi?{' '}
        <Link
          to="/register"
          className="font-medium text-slate-900 underline-offset-4 hover:underline dark:text-white"
        >
          Ro‘yxatdan o‘ting
        </Link>
      </p>
    </Card>
  )
}
