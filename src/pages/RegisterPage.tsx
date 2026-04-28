import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus, ArrowRight } from 'lucide-react'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { TextField } from '@/components/TextField'
import { useAuth } from '@/hooks/useAuth'
import { useToggle } from '@/hooks/useToggle'
import { loadOrCreateProfile } from '@/services/profile.service'
import { supabase } from '@/services/supabase'
import { roleHomePath } from '@/utils/rolePaths'
import { translateAppError } from '@/utils/supabaseAuthErrors'
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
    const name = String(form.get('name') ?? '').trim()
    const email = String(form.get('email') ?? '').trim()
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
            <UserPlus className="size-7 text-white" strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Ro‘yxatdan o‘tish
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Yangi akkaunt yaratish uchun ma’lumotlarni kiriting
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
          <Button type="submit" className="w-full relative overflow-hidden group/btn shadow-md" disabled={loading}>
            <span className="relative z-10 flex items-center justify-center gap-2">
              {loading ? 'Yaratilmoqda…' : (
                <>
                  Davom etish
                  <ArrowRight className="size-4 transition-transform group-hover/btn:translate-x-1" />
                </>
              )}
            </span>
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
    </div>
  )
}
