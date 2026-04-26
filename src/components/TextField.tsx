import type { InputHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  hint?: string
}

export function TextField({ label, hint, id, className, ...props }: TextFieldProps) {
  const fieldId = id ?? props.name
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={fieldId}
        className="block text-sm font-medium text-slate-700 dark:text-slate-300"
      >
        {label}
      </label>
      <input
        id={fieldId}
        className={cn(
          'block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100',
          'placeholder:text-slate-400 transition-[border-color,box-shadow] dark:placeholder:text-slate-500',
          'focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:border-slate-300 dark:focus:ring-slate-300/15',
          className,
        )}
        {...props}
      />
      {hint ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      ) : null}
    </div>
  )
}
