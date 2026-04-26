import { Navigate } from 'react-router-dom'
import { ProfileLoadError } from '@/components/ProfileLoadError'
import { useAuth } from '@/hooks/useAuth'
import { roleHomePath } from '@/utils/rolePaths'

export function HomeRedirect() {
  const { session, profile, bootstrapping, profileError } = useAuth()

  if (!session) {
    return <Navigate to="/login" replace />
  }
  if (bootstrapping) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div
          className="size-9 animate-spin rounded-full border-2 border-slate-200 border-t-slate-800 dark:border-slate-700 dark:border-t-slate-300"
          role="status"
          aria-label="Profil yuklanmoqda"
        />
      </div>
    )
  }
  if (profileError) {
    return <ProfileLoadError />
  }
  if (profile) {
    return <Navigate to={roleHomePath(profile.role)} replace />
  }
  return <Navigate to="/login" replace />
}
