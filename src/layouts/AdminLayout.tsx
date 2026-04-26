import { Outlet } from 'react-router-dom'
import { DashboardShell } from '@/components/DashboardShell'

export function AdminLayout() {
  return (
    <DashboardShell
      brand={{ title: 'Administrator', to: '/admin' }}
      accent="violet"
      nav={[
        { to: '/admin', label: 'Bosh sahifa', end: true },
        { to: '/guide', label: "Yo'riqnoma" },
      ]}
    >
      <Outlet />
    </DashboardShell>
  )
}
