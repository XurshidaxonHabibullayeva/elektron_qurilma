import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
}

const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-slate-900 text-white shadow-sm hover:bg-slate-800 focus-visible:ring-slate-900/40 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200',
  secondary:
    'bg-white text-slate-900 ring-1 ring-slate-200/80 hover:bg-slate-50 focus-visible:ring-slate-400/30 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-600 dark:hover:bg-slate-800',
  ghost:
    'text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-400/20 dark:text-slate-300 dark:hover:bg-white/5',
}

export function Button({
  className,
  variant = 'primary',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:focus-visible:ring-offset-slate-950',
        'disabled:pointer-events-none disabled:opacity-45',
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}
