import type { UserRole } from '@/types'

export function roleHomePath(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/admin'
    case 'teacher':
      return '/teacher'
    case 'student':
      return '/student'
  }
}

/** Whether this pathname is allowed for the given role (prefix match). */
export function pathAllowedForRole(pathname: string, role: UserRole): boolean {
  const p = pathname.split('?')[0] ?? pathname
  if (p === '/' || p === '') return false
  if (p.startsWith('/admin')) return role === 'admin'
  if (p.startsWith('/teacher')) return role === 'teacher'
  if (p.startsWith('/student')) return role === 'student'
  return false
}
