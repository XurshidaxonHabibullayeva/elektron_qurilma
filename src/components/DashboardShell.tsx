import { type ReactNode, useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Button } from '@/components/Button'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/utils/cn'

export type ShellNavItem = { to: string; label: string; end?: boolean }

export type ShellAccent = 'violet' | 'teal' | 'sky'

const ACCENT = {
  violet: {
    dot: 'bg-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.45)]',
    active:
      'bg-violet-600 text-white shadow-md dark:bg-violet-500 dark:text-white',
    mobileTitle: 'text-violet-950 dark:text-violet-100',
  },
  teal: {
    dot: 'bg-teal-500 shadow-[0_0_12px_rgba(20,184,166,0.45)]',
    active: 'bg-teal-600 text-white shadow-md dark:bg-teal-500 dark:text-white',
    mobileTitle: 'text-teal-950 dark:text-teal-100',
  },
  sky: {
    dot: 'bg-sky-500 shadow-[0_0_12px_rgba(14,165,233,0.45)]',
    active: 'bg-sky-600 text-white shadow-md dark:bg-sky-500 dark:text-white',
    mobileTitle: 'text-sky-950 dark:text-sky-100',
  },
} as const

type DashboardShellProps = {
  brand: { title: string; to: string }
  nav: ShellNavItem[]
  accent: ShellAccent
  children: ReactNode
}

export function DashboardShell({ brand, nav, accent, children }: DashboardShellProps) {
  const { profile, user, signOut } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const a = ACCENT[accent]

  const label =
    profile?.full_name?.trim() ||
    (typeof user?.user_metadata?.full_name === 'string'
      ? user.user_metadata.full_name
      : null) ||
    user?.email

  useEffect(() => {
    const id = window.setTimeout(() => {
      setSidebarOpen(false)
    }, 0)
    return () => window.clearTimeout(id)
  }, [location.pathname])

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
      isActive
        ? a.active
        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5',
    )

  const sidebarInner = (
    <div className="flex h-full min-h-0 flex-col border-r border-slate-200/80 bg-white/95 px-4 py-6 shadow-md backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95 lg:shadow-none">
      <NavLink
        to={brand.to}
        className="mb-8 flex items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-slate-100 dark:hover:bg-white/5"
        onClick={() => setSidebarOpen(false)}
      >
        <span className={cn('size-2.5 shrink-0 rounded-full', a.dot)} aria-hidden />
        <span className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
          {brand.title}
        </span>
      </NavLink>

      <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto" aria-label="Asosiy menyu">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={navLinkClass}
            onClick={() => setSidebarOpen(false)}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-6 space-y-3 border-t border-slate-200/80 pt-6 dark:border-slate-800">
        {label ? (
          <p className="truncate px-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            {label}
          </p>
        ) : null}
        <div className="flex items-center gap-2 px-1">
          <ThemeToggle className="size-10 shrink-0" />
          <Button
            type="button"
            variant="secondary"
            className="min-w-0 flex-1 px-3 py-2 text-xs sm:text-sm"
            onClick={() => {
              void signOut()
            }}
          >
            Chiqish
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-950">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90 lg:hidden">
        <button
          type="button"
          className="inline-flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          aria-expanded={sidebarOpen}
          aria-controls="app-sidebar"
          onClick={() => setSidebarOpen((o) => !o)}
        >
          <span className="sr-only">{sidebarOpen ? 'Menyuni yopish' : 'Menyuni ochish'}</span>
          {sidebarOpen ? (
            <svg
              className="size-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg
              className="size-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
        <NavLink
          to={brand.to}
          className={cn('truncate text-base font-semibold tracking-tight', a.mobileTitle)}
        >
          {brand.title}
        </NavLink>
        <ThemeToggle />
      </header>

      {/* Backdrop */}
      {sidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          aria-label="Menyuni yopish"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <div className="flex min-h-[calc(100dvh-3.5rem)] lg:min-h-dvh">
        {/* Sidebar: drawer on mobile, column on desktop */}
        <aside
          id="app-sidebar"
          className={cn(
            'fixed left-0 z-50 w-72 max-w-[85vw] transition-transform duration-200 ease-out',
            'top-14 h-[calc(100dvh-3.5rem)] lg:static lg:top-auto lg:z-0 lg:h-auto lg:min-h-dvh lg:w-72 lg:max-w-none lg:translate-x-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          )}
        >
          {sidebarInner}
        </aside>

        <div className="relative flex min-w-0 flex-1 flex-col">
          {/* Subtle SaaS-style background */}
          <div
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(15,23,42,0.02))] dark:bg-[linear-gradient(to_bottom,transparent,rgba(248,250,252,0.03))]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.12]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2394a3b8' fill-opacity='0.12'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
            aria-hidden
          />

          <main className="relative z-0 flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  )
}
