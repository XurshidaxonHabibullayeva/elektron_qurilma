import { Outlet } from 'react-router-dom'
import { DashboardShell } from '@/components/DashboardShell'

export function TeacherLayout() {
  return (
    <DashboardShell
      brand={{ title: "O'qituvchi", to: '/teacher' }}
      accent="teal"
      nav={[
        { to: '/teacher', label: 'Bosh sahifa', end: true },
        { to: '/teacher/results', label: 'Natijalar' },
        { to: '/guide', label: "Yo'riqnoma" },
      ]}
    >
      <Outlet />
    </DashboardShell>
  )
}
