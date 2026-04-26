import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

type StatCardProps = {
  label: string
  value: ReactNode
  hint?: string
  className?: string
}

export function StatCard({ label, value, hint, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200/90 bg-white p-6 shadow-md dark:border-slate-700/80 dark:bg-slate-900/70',
        className,
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
        {value}
      </div>
      {hint ? (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      ) : null}
    </div>
  )
}
