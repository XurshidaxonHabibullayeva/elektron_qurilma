import { createContext } from 'react'

export type NotificationVariant = 'success' | 'error' | 'info'

export type NotifyOptions = {
  message: string
  variant?: NotificationVariant
  durationMs?: number
}

export type NotificationContextValue = {
  notify: (options: NotifyOptions) => void
}

export const NotificationContext = createContext<NotificationContextValue | null>(null)
