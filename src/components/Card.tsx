import type { HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200/90 bg-white p-6 shadow-md dark:border-slate-700/80 dark:bg-slate-900/70 dark:shadow-none',
        className,
      )}
      {...props}
    />
  )
}
