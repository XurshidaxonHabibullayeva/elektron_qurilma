import { Outlet } from 'react-router-dom'
import { Home, Layout, BookOpen, User } from 'lucide-react'
import { DashboardShell } from '@/components/DashboardShell'

export function StudentLayout() {
  return (
    <DashboardShell
      brand={{ title: "O'quvchi", to: '/student' }}
      accent="sky"
      nav={[
        { to: '/student', label: 'Bosh sahifa', icon: <Home className="size-5" />, end: true },
        { to: '/student/results', label: 'Natijalar', icon: <Layout className="size-5" /> },
        { to: '/student/profile', label: 'Profil', icon: <User className="size-5" /> },
        { to: '/guide', label: "Yo'riqnoma", icon: <BookOpen className="size-5" /> },
      ]}
    >
      <Outlet />
    </DashboardShell>
  )
}
