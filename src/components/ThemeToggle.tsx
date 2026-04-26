import { useTheme } from '@/hooks/useTheme'
import { cn } from '@/utils/cn'

export function ThemeToggle({ className }: { className?: string }) {
  const { preference, cyclePreference } = useTheme()

  const title =
    preference === 'system'
      ? "Mavzu: tizim (qurilma bo'yicha). Bosganda yorug'lik rejimi."
      : preference === 'light'
        ? "Mavzu: yorug'lik. Bosganda qorong'u."
        : "Mavzu: qorong'u. Bosganda tizim (avtomatik)."

  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={cyclePreference}
      className={cn(
        'inline-flex size-10 items-center justify-center rounded-xl border border-slate-200/90 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/80',
        className,
      )}
    >
      {preference === 'system' ? (
        <span className="text-lg" aria-hidden>
          ◐
        </span>
      ) : preference === 'dark' ? (
        <MoonIcon />
      ) : (
        <SunIcon />
      )}
    </button>
  )
}

function SunIcon() {
  return (
    <svg
      className="size-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg
      className="size-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}
