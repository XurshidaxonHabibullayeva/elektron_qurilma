import { type FormEvent, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Fingerprint, ArrowRight } from 'lucide-react'
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
    <div className="group relative w-full">
      <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-sky-400 to-indigo-500 opacity-20 blur-xl transition duration-1000 group-hover:opacity-40 group-hover:duration-200 dark:opacity-30"></div>
      <Card className="relative overflow-hidden border-white/40 bg-white/70 p-8 shadow-2xl backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-900/70 sm:p-10">
        <div className="mb-8 text-center space-y-3">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-500 shadow-lg shadow-indigo-500/30">
            <Fingerprint className="size-7 text-white" strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Xush kelibsiz
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Tizimga kirish uchun ma'lumotlaringizni kiriting
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
        <Button type="submit" className="w-full relative overflow-hidden group/btn shadow-md" disabled={loading}>
          <span className="relative z-10 flex items-center justify-center gap-2">
            {loading ? 'Kirilmoqda…' : (
              <>
                Davom etish
                <ArrowRight className="size-4 transition-transform group-hover/btn:translate-x-1" />
              </>
            )}
          </span>
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
    </div>
  )
}
