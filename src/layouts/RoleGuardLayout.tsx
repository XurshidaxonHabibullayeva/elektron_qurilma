import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { roleHomePath } from '@/utils/rolePaths'
import type { UserRole } from '@/types'

type RoleGuardLayoutProps = {
  allowed: readonly UserRole[]
}

export function RoleGuardLayout({ allowed }: RoleGuardLayoutProps) {
  const { session, profile } = useAuth()

  if (!session) {
    return <Navigate to="/login" replace />
  }
  if (!profile) {
    return <Navigate to="/login" replace />
  }
  if (!allowed.includes(profile.role)) {
    return <Navigate to={roleHomePath(profile.role)} replace />
  }
  return <Outlet />
}
