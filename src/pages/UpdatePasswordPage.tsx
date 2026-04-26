import { type FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { TextField } from '@/components/TextField'
import { useToggle } from '@/hooks/useToggle'
import { supabase } from '@/services/supabase'
import { LOGIN_FLASH_KEY } from '@/utils/loginFlash'
import { translateAuthError } from '@/utils/supabaseAuthErrors'
import { cn } from '@/utils/cn'

export default function UpdatePasswordPage() {
  const navigate = useNavigate()
  const [showPassword, togglePassword] = useToggle(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  /** undefined = hali tekshirilmoqda */
  const [recoverySession, setRecoverySession] = useState<Session | null | undefined>(
    undefined,
  )

  useEffect(() => {
    let cancelled = false

    void supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) {
        setRecoverySession(data.session ?? null)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!cancelled) {
        setRecoverySession(next)
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const form = new FormData(e.currentTarget)
    const password = String(form.get('password') ?? '')
    const confirm = String(form.get('confirm') ?? '')
    if (password.length < 8) {
      setError('Parol kamida 8 belgidan iborat bo‘lsin.')
      return
    }
    if (password !== confirm) {
      setError('Parollar mos kelmayapti.')
      return
    }
    setLoading(true)
    try {
      const { error: upErr } = await supabase.auth.updateUser({ password })
      if (upErr) {
        throw new Error(translateAuthError(upErr.message))
      }
      await supabase.auth.signOut()
      try {
        sessionStorage.setItem(
          LOGIN_FLASH_KEY,
          'Parol yangilandi. Yangi parol bilan kiring.',
        )
      } catch {
        /* private mode */
      }
      navigate('/login', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  const noSession = recoverySession === null

  return (
    <Card className="p-8 sm:p-10">
      <div className="mb-8 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Yangi parol
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Tiklash havolasi orqali kirgansiz. Yangi parolni kiriting, so‘ngra tizimga qayta kiring.
        </p>
      </div>
      {recoverySession === undefined ? (
        <p className="text-sm text-slate-600 dark:text-slate-400">Tekshirilmoqda…</p>
      ) : noSession ? (
        <div className="space-y-4">
          <p
            className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100"
            role="alert"
          >
            Sessiya topilmadi. Pochtadagi havolani brauzerda qayta oching (butun havola) yoki
            «Parolni tiklash»dan yangi xat so‘rang. Supabase’da Redirect URL ga loyiha manzili +
            /auth/update-password qo‘shilganini tekshiring.
          </p>
          <Link
            to="/forgot-password"
            className="inline-block text-sm font-medium text-slate-900 underline-offset-4 hover:underline dark:text-white"
          >
            Parolni tiklash
          </Link>
        </div>
      ) : (
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <TextField
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              label="Yangi parol"
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
          <TextField
            id="confirm"
            name="confirm"
            type={showPassword ? 'text' : 'password'}
            label="Parolni tasdiqlang"
            autoComplete="new-password"
            placeholder="Parolni qayta kiriting"
            minLength={8}
            required
          />
          {error ? (
            <p
              className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-200"
              role="alert"
            >
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Saqlanmoqda…' : 'Parolni saqlash'}
          </Button>
        </form>
      )}
      <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
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
