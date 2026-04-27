import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { AuthContext, type AuthContextValue } from '@/contexts/auth-context'
import { loadOrCreateProfile } from '@/services/profile.service'
import { supabase } from '@/services/supabase'
import type { ProfileRow } from '@/types'
import { translateAuthError } from '@/utils/supabaseAuthErrors'

type ProfileGate = 'none' | 'loading' | 'ready' | 'error'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [sessionReady, setSessionReady] = useState(false)
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [profileGate, setProfileGate] = useState<ProfileGate>('none')

  useEffect(() => {
    let cancelled = false

    void supabase.auth.getSession().then(({ data: { session: next } }) => {
      if (!cancelled) {
        setSession(next)
        setSessionReady(true)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const uid = session?.user?.id
    if (!uid) {
      queueMicrotask(() => {
        setProfile(null)
        setProfileGate('none')
      })
      return
    }

    let cancelled = false
    queueMicrotask(() => {
      setProfile(null)
      setProfileGate('loading')
      void loadOrCreateProfile(uid)
        .then((p) => {
          if (!cancelled) {
            setProfile(p)
            setProfileGate('ready')
          }
        })
        .catch((err: unknown) => {
          console.error(err)
          if (!cancelled) {
            setProfile(null)
            setProfileGate('error')
          }
        })
    })

    return () => {
      cancelled = true
    }
  }, [session?.user?.id])

  const signIn = useCallback(async (email: string, password: string) => {
    const trimmedEmail = email.trim()
    const { error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    })
    if (error) {
      if (import.meta.env.DEV) {
        console.warn('[supabase auth]', error.message, {
          code: (error as { code?: string }).code,
          status: (error as { status?: number }).status,
        })
      }
      throw new Error(translateAuthError(error.message))
    }
  }, [])

  const signUp = useCallback(
    async (email: string, password: string, name: string) => {
      const trimmedEmail = email.trim()
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: { full_name: name.trim() },
        },
      })
      if (error) {
        throw new Error(translateAuthError(error.message))
      }
      return { sessionCreated: !!data.session }
    },
    [],
  )

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw new Error(translateAuthError(error.message))
    }
  }, [])

  const resetPasswordForEmail = useCallback(async (email: string) => {
    const trimmedEmail = email.trim()
    const redirectTo = `${window.location.origin}/auth/update-password`
    const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
      redirectTo,
    })
    if (error) {
      throw new Error(translateAuthError(error.message))
    }
  }, [])

  const bootstrapping =
    !!session?.user?.id && (profileGate === 'loading' || profileGate === 'none')
  const profileError = !!session?.user?.id && profileGate === 'error'

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      bootstrapping,
      profileError,
      signIn,
      signUp,
      signOut,
      resetPasswordForEmail,
    }),
    [
      session,
      profile,
      bootstrapping,
      profileError,
      signIn,
      signUp,
      signOut,
      resetPasswordForEmail,
    ],
  )

  if (!sessionReady) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3 text-slate-600 dark:text-slate-400">
          <div
            className="size-9 animate-spin rounded-full border-2 border-slate-200 border-t-slate-800 dark:border-slate-700 dark:border-t-slate-300"
            role="status"
            aria-label="Sessiya yuklanmoqda"
          />
          <p className="text-sm">Yuklanmoqda…</p>
        </div>
      </div>
    )
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
