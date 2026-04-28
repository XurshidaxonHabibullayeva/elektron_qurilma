import { Outlet } from 'react-router-dom'
import { Shield, BookOpen, User } from 'lucide-react'
import { DashboardShell } from '@/components/DashboardShell'

export function AdminLayout() {
  return (
    <DashboardShell
      brand={{ title: 'FlipEdu', to: '/admin' }}
      accent="violet"
      nav={[
        { to: '/admin', label: 'Bosh sahifa', icon: <Shield className="size-5" />, end: true },
        { to: '/admin/profile', label: 'Profil', icon: <User className="size-5" /> },
        { to: '/guide', label: "Yo'riqnoma", icon: <BookOpen className="size-5" /> },
      ]}
    >
      <Outlet />
    </DashboardShell>
  )
}
