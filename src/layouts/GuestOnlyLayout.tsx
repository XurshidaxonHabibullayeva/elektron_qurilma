import { Navigate, Outlet } from 'react-router-dom'
import { ProfileLoadError } from '@/components/ProfileLoadError'
import { useAuth } from '@/hooks/useAuth'
import { roleHomePath } from '@/utils/rolePaths'

/** Sends signed-in users away from login/register (to their role home). */
export function GuestOnlyLayout() {
  const { session, profile, bootstrapping, profileError } = useAuth()

  if (session && bootstrapping) {
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
  if (session && profileError) {
    return <ProfileLoadError />
  }
  if (session && profile) {
    return <Navigate to={roleHomePath(profile.role)} replace />
  }
  return <Outlet />
}
