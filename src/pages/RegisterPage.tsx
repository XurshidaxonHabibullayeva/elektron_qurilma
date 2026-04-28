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
import { translateAppError } from '@/utils/supabaseAuthErrors'
import { cn } from '@/utils/cn'

export default function RegisterPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [showPassword, togglePassword] = useToggle(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  
  const [step, setStep] = useState<'register' | 'verify'>('register')
  const [registeredEmail, setRegisteredEmail] = useState('')

  async function handleRegisterSubmit(e: FormEvent<HTMLFormElement>) {
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
        setRegisteredEmail(email)
        setStep('verify')
        setInfo(
          'Elektron pochtangizga tasdiqlash kodi yuborildi. Iltimos, kodni kiriting.',
        )
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Xatolik yuz berdi'
      setError(translateAppError(msg))
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifySubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    const form = new FormData(e.currentTarget)
    const code = String(form.get('code') ?? '').trim()
    
    if (!code) {
      setError('Kodni kiriting')
      return
    }

    setLoading(true)
    try {
      const { data, error: verifyErr } = await supabase.auth.verifyOtp({
        email: registeredEmail,
        token: code,
        type: 'signup',
      })
      
      if (verifyErr) {
        throw new Error(verifyErr.message)
      }
      
      if (data.session) {
        const profile = await loadOrCreateProfile(data.session.user.id)
        navigate(roleHomePath(profile.role), { replace: true })
      } else {
        throw new Error('Sessiya yaratilmadi. Iltimos, qaytadan urinib ko‘ring.')
      }
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
          {step === 'register' ? 'Ro‘yxatdan o‘tish' : 'Pochtani tasdiqlash'}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {step === 'register' ? (
            <>
              Supabase’da foydalanuvchi yaratiladi va <code className="font-mono text-xs">profiles</code> qatoriga yozuv qo‘shiladi.
            </>
          ) : (
            <>
              <span className="font-medium text-slate-900 dark:text-white">{registeredEmail}</span> manziliga yuborilgan 6 xonali kodni kiriting.
            </>
          )}
        </p>
      </div>

      {step === 'register' ? (
        <form className="space-y-5" onSubmit={handleRegisterSubmit}>
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
      ) : (
        <form className="space-y-5" onSubmit={handleVerifySubmit}>
          <TextField
            id="code"
            name="code"
            type="text"
            label="Tasdiqlash kodi"
            autoComplete="one-time-code"
            placeholder="000000"
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
          {info ? (
            <p
              className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-100"
              role="status"
            >
              {info}
            </p>
          ) : null}
          <div className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Tasdiqlanmoqda…' : 'Tasdiqlash'}
            </Button>
            <Button 
              type="button" 
              variant="secondary" 
              className="w-full" 
              onClick={() => {
                setStep('register')
                setError(null)
                setInfo(null)
              }}
              disabled={loading}
            >
              Orqaga
            </Button>
          </div>
        </form>
      )}

      {step === 'register' && (
        <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
          Allaqachon ro‘yxatdan o‘tganmisiz?{' '}
          <Link
            to="/login"
            className="font-medium text-slate-900 underline-offset-4 hover:underline dark:text-white"
          >
            Kirish
          </Link>
        </p>
      )}
    </Card>
  )
}
