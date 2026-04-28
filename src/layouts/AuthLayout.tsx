import { Link, Outlet } from 'react-router-dom'
import { ThemeToggle } from '@/components/ThemeToggle'
import { FlipEduLogo } from '@/components/FlipEduLogo'

export function AuthLayout() {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-slate-50 dark:bg-slate-950">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_circle_at_20%_-10%,theme(colors.sky.100),transparent_55%),radial-gradient(700px_circle_at_100%_20%,theme(colors.indigo.100),transparent_50%)] dark:bg-[radial-gradient(900px_circle_at_20%_-10%,theme(colors.violet.950/0.5),transparent_55%),radial-gradient(700px_circle_at_100%_20%,theme(colors.sky.950/0.4),transparent_50%)]"
        aria-hidden
      />
      <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>
      <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-16 sm:px-6">
        <div className="mb-10 space-y-3 text-center">
          <Link
            to="/"
            className="flex flex-col items-center gap-4 group"
          >
            <FlipEduLogo className="size-24 transition-transform duration-500 group-hover:scale-110" />
            <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              FlipEdu
            </span>
          </Link>
          <Link
            to="/guide"
            className="inline-flex text-xs font-medium text-violet-700 underline-offset-4 hover:underline dark:text-violet-300"
          >
            Foydalanish bo'yicha yo'riqnoma
          </Link>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
