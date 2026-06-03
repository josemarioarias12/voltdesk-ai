import AppLayout from '@/components/AppLayout'
import { SharedProps } from '@/types'
import { usePage } from '@inertiajs/react'

export default function DashboardIndex() {
  const { auth, workspace } = usePage<SharedProps>().props

  return (
    <AppLayout title="Dashboard">
      <div style={{ maxWidth: '900px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0F172A', margin: '0 0 4px' }}>
          Welcome, {auth.user?.first_name}
        </h1>
        <p style={{ color: '#475569', fontSize: '14px', margin: '0 0 32px' }}>
          {workspace?.name} · {auth.user?.role?.replace(/_/g, ' ')}
        </p>
        <div style={{
          background: '#fff', borderRadius: '16px', padding: '32px',
          border: '1px solid #E2E8F0', boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
          textAlign: 'center', color: '#94A3B8',
        }}>
          <p style={{ fontSize: '14px' }}>Dashboard analytics coming in S6 🚀</p>
        </div>
      </div>
    </AppLayout>
  )
}
