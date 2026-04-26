import type { Session, User } from '@supabase/supabase-js'
import { createContext } from 'react'
import type { ProfileRow } from '@/types'

export type AuthContextValue = {
  session: Session | null
  user: User | null
  profile: ProfileRow | null
  /** True while session exists and profile is still loading. */
  bootstrapping: boolean
  /** Profile could not be loaded or created. */
  profileError: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (
    email: string,
    password: string,
    name: string,
  ) => Promise<{ sessionCreated: boolean }>
  signOut: () => Promise<void>
  /** Parolni tiklash xati; redirect URL loyiha + /auth/update-password bo‘lishi kerak. */
  resetPasswordForEmail: (email: string) => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
