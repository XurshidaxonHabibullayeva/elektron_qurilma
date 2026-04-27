import { type ReactNode, useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { 
  ChevronLeft, 
  ChevronRight, 
  LogOut, 
  Menu, 
  X
} from 'lucide-react'
import { Button } from '@/components/Button'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/utils/cn'

export type ShellNavItem = { 
  to: string; 
  label: string; 
  end?: boolean;
  icon?: ReactNode;
}

export type ShellAccent = 'violet' | 'teal' | 'sky'

const ACCENT = {
  violet: {
    dot: 'bg-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.5)]',
    active: 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white dark:from-violet-500 dark:to-indigo-500',
    mobileTitle: 'text-violet-900 dark:text-violet-100',
  },
  teal: {
    dot: 'bg-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.5)]',
    active: 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white dark:from-teal-500 dark:to-emerald-500',
    mobileTitle: 'text-teal-900 dark:text-teal-100',
  },
  sky: {
    dot: 'bg-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.5)]',
    active: 'bg-gradient-to-r from-sky-600 to-blue-600 text-white dark:from-sky-500 dark:to-blue-500',
    mobileTitle: 'text-sky-900 dark:text-sky-100',
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
  const [isCollapsed, setIsCollapsed] = useState(false)
  const a = ACCENT[accent]

  const fullName = profile?.full_name?.trim() || (typeof user?.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : null)

  useEffect(() => {
    const t = window.setTimeout(() => {
      setSidebarOpen(false)
    }, 0)
    return () => window.clearTimeout(t)
  }, [location.pathname])

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
      isCollapsed ? 'justify-center px-2' : '',
      isActive
        ? cn(a.active, 'translate-x-1 shadow-lg shadow-black/5 dark:shadow-white/5')
        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5 hover:translate-x-1',
    )

  const sidebarInner = (
    <div className="flex h-full flex-col bg-white/80 px-3 py-6 backdrop-blur-xl dark:bg-slate-950/80">
      <div className={cn("mb-8 flex items-center transition-all duration-300", isCollapsed ? "justify-center" : "px-3")}>
        <NavLink
          to={brand.to}
          className="flex items-center gap-3 group"
          onClick={() => setSidebarOpen(false)}
        >
          <div className={cn('size-3 shrink-0 rounded-full transition-transform group-hover:scale-125', a.dot)} />
          {!isCollapsed && (
            <span className="text-xl font-bold tracking-tight bg-gradient-to-br from-slate-900 to-slate-600 bg-clip-text text-transparent dark:from-white dark:to-slate-400">
              {brand.title}
            </span>
          )}
        </NavLink>
      </div>

      <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto px-1 custom-scrollbar" aria-label="Asosiy menyu">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={navLinkClass}
            onClick={() => setSidebarOpen(false)}
            title={isCollapsed ? item.label : undefined}
          >
            {item.icon && <span className={cn("size-5 shrink-0", !isCollapsed && "opacity-80 group-hover:opacity-100")}>{item.icon}</span>}
            {!isCollapsed && <span className="truncate">{item.label}</span>}
            {isCollapsed && !item.icon && <span className="text-xs font-bold uppercase">{item.label[0]}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto space-y-4 pt-6 border-t border-slate-200/50 dark:border-slate-800/50">
        <div className={cn("flex flex-col gap-4", isCollapsed ? "items-center" : "px-3")}>
          <div className={cn("flex items-center gap-3", isCollapsed ? "flex-col" : "")}>
             <ThemeToggle className={cn("size-10 transition-transform hover:scale-105", isCollapsed ? "" : "shrink-0")} />
             {!isCollapsed && (
               <div className="min-w-0 flex-1">
                 <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                   {fullName || 'Foydalanuvchi'}
                 </p>
                 <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                   {user?.email}
                 </p>
               </div>
             )}
          </div>
          
          <Button
            type="button"
            variant="secondary"
            className={cn(
              "relative flex items-center justify-center gap-2 overflow-hidden transition-all duration-200 active:scale-95",
              isCollapsed ? "size-10 p-0" : "w-full py-2.5"
            )}
            onClick={() => {
              void signOut()
            }}
            title="Chiqish"
          >
            <LogOut className="size-4" />
            {!isCollapsed && <span>Chiqish</span>}
          </Button>
        </div>

        {/* Collapse Toggle (Desktop only) */}
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 size-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:scale-110 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          {isCollapsed ? <ChevronRight className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-slate-50/50 dark:bg-slate-950/50">
      {/* Mobile top bar */}
      <header className="flex-none sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-slate-200/80 bg-white/80 px-4 py-3 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/80 lg:hidden">
        <button
          type="button"
          className="inline-flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          onClick={() => setSidebarOpen((o) => !o)}
        >
          {sidebarOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
        
        <NavLink
          to={brand.to}
          className={cn('flex items-center gap-2 text-lg font-bold tracking-tight', a.mobileTitle)}
        >
          <div className={cn('size-2 rounded-full', a.dot)} />
          {brand.title}
        </NavLink>
        
        <div className="flex items-center gap-2">
           <ThemeToggle className="size-9" />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          id="app-sidebar"
          className={cn(
            'fixed left-0 z-50 transition-all duration-300 ease-in-out',
            'top-0 h-full lg:sticky lg:z-0 lg:h-full',
            isCollapsed ? 'lg:w-20' : 'lg:w-72',
            sidebarOpen ? 'w-72 translate-x-0' : 'w-72 -translate-x-full lg:translate-x-0',
            'border-r border-slate-200/60 dark:border-slate-800/60 shadow-xl lg:shadow-none'
          )}
        >
          {sidebarInner}
        </aside>

        {/* Content */}
        <main className="relative flex min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden custom-scrollbar">
          {/* Decorative gradients */}
          <div className="pointer-events-none absolute -top-24 right-0 size-96 bg-sky-500/10 blur-[100px] dark:bg-sky-500/5" />
          <div className="pointer-events-none absolute -bottom-24 left-0 size-96 bg-violet-500/10 blur-[100px] dark:bg-violet-500/5" />
          
          <div className="relative z-10 flex-1 px-4 py-8 sm:px-6 lg:px-10">
            <div className="mx-auto w-full max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Backdrop for mobile */}
      {sidebarOpen ? (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}
    </div>
  )
}
