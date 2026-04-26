import { type ReactNode, useEffect } from 'react'
import { Button } from '@/components/Button'
import { cn } from '@/utils/cn'

type ModalProps = {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  className?: string
}

export function Modal({ open, title, onClose, children, className }: ModalProps) {
  useEffect(() => {
    if (!open) {
      return
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm dark:bg-black/60"
        aria-label="Oynani yopish"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          'relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900',
          className,
        )}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2
            id="modal-title"
            className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white"
          >
            {title}
          </h2>
          <Button
            type="button"
            variant="ghost"
            className="shrink-0 px-2 py-1 text-slate-500"
            onClick={onClose}
            aria-label="Yopish"
          >
            ✕
          </Button>
        </div>
        {children}
      </div>
    </div>
  )
}
