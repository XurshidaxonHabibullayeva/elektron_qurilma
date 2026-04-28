import { Outlet } from 'react-router-dom'
import { Home, Video, BarChart2, BookOpen, User } from 'lucide-react'
import { DashboardShell } from '@/components/DashboardShell'

export function TeacherLayout() {
  return (
    <DashboardShell
      brand={{ title: "O'qituvchi", to: '/teacher' }}
      accent="teal"
      nav={[
        { to: '/teacher', label: 'Bosh sahifa', icon: <Home className="size-5" />, end: true },
        { to: '/teacher/lessons', label: 'Mening darslarim', icon: <Video className="size-5" /> },
        { to: '/teacher/results', label: 'Natijalar', icon: <BarChart2 className="size-5" /> },
        { to: '/teacher/profile', label: 'Profil', icon: <User className="size-5" /> },
        { to: '/guide', label: "Yo'riqnoma", icon: <BookOpen className="size-5" /> },
      ]}
    >
      <Outlet />
    </DashboardShell>
  )
}
