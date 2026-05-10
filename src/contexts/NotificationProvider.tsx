import { useCallback, useMemo, useState, type ReactNode } from 'react'
import {
  NotificationContext,
  type NotificationVariant,
  type NotifyOptions,
} from '@/contexts/notification-context'

type NotificationItem = {
  id: number
  message: string
  variant: NotificationVariant
}

type NotificationProviderProps = {
  children: ReactNode
}

const DEFAULT_DURATION = 3200

function variantClassName(variant: NotificationVariant): string {
  if (variant === 'success') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/70 dark:text-emerald-100'
  }
  if (variant === 'error') {
    return 'border-red-200 bg-red-50 text-red-900 dark:border-red-900/60 dark:bg-red-950/70 dark:text-red-100'
  }
  return 'border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [items, setItems] = useState<NotificationItem[]>([])

  const removeById = useCallback((id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const notify = useCallback(
    ({ message, variant = 'info', durationMs = DEFAULT_DURATION }: NotifyOptions) => {
      const id = Date.now() + Math.floor(Math.random() * 1000)
      setItems((prev) => [...prev, { id, message, variant }])

      window.setTimeout(() => {
        removeById(id)
      }, Math.max(1200, durationMs))
    },
    [removeById],
  )

  const value = useMemo(() => ({ notify }), [notify])

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[90] flex w-[min(92vw,24rem)] flex-col gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            role="status"
            className={`pointer-events-auto rounded-xl border px-4 py-3 text-sm shadow-lg transition ${variantClassName(item.variant)}`}
          >
            <div className="flex items-start gap-3">
              <p className="min-w-0 flex-1">{item.message}</p>
              <button
                type="button"
                onClick={() => removeById(item.id)}
                className="rounded px-1 text-xs opacity-70 hover:opacity-100"
                aria-label="Xabarni yopish"
              >
                X
              </button>
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  )
}
