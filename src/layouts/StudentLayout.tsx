import { Outlet } from 'react-router-dom'
import { DashboardShell } from '@/components/DashboardShell'

export function StudentLayout() {
  return (
    <DashboardShell
      brand={{ title: "O'quvchi", to: '/student' }}
      accent="sky"
      nav={[
        { to: '/student', label: 'Bosh sahifa', end: true },
        { to: '/student/results', label: 'Natijalar' },
        { to: '/guide', label: "Yo'riqnoma" },
      ]}
    >
      <Outlet />
    </DashboardShell>
  )
}
