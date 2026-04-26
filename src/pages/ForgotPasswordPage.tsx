import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { TextField } from '@/components/TextField'
import { useAuth } from '@/hooks/useAuth'

export default function ForgotPasswordPage() {
  const { resetPasswordForEmail } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    const form = new FormData(e.currentTarget)
    const email = String(form.get('email') ?? '').trim()
    setLoading(true)
    try {
      await resetPasswordForEmail(email)
      setInfo(
        'Agar bu manzil bilan akkaunt bo‘lsa, parolni tiklash havolasi yuborildi. Pochtani tekshiring (spam ham).',
      )
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
          Parolni tiklash
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Elektron pochtangizni kiriting — havola orqali yangi parol belgilaysiz. Supabase Dashboard →
          Authentication → URL Configuration da saytingiz manzili va yo‘naltirish ro‘yxatiga{' '}
          <code className="rounded bg-slate-100 px-1 font-mono text-xs dark:bg-slate-800">
            /auth/update-password
          </code>{' '}
          qo‘shilgan bo‘lishi kerak.
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
          {loading ? 'Yuborilmoqda…' : 'Havolani yuborish'}
        </Button>
      </form>
      <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
        <Link
          to="/login"
          className="font-medium text-slate-900 underline-offset-4 hover:underline dark:text-white"
        >
          Kirish sahifasiga qaytish
        </Link>
      </p>
    </Card>
  )
}
