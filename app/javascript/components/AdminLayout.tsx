import { ReactNode } from 'react'
import { Link } from '@inertiajs/react'
import AppLayout from '@/components/AppLayout'

interface NavItem {
  label: string
  path: string
}

interface NavGroup {
  label: string | null
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: null,
    items: [{ label: 'Overview', path: '/admin' }],
  },
  {
    label: 'AI Operations',
    items: [
      { label: 'Audit Log', path: '/admin/audit-log' },
      { label: 'Model Governance', path: '/admin/governance' },
      { label: 'Pattern Alerts', path: '/admin/pattern_alerts' },
      { label: 'AI Health', path: '/admin/ai-health' },
      { label: 'Benchmark', path: '/admin/benchmark' },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { label: 'Users', path: '/admin/users' },
      { label: 'Compliance', path: '/admin/compliance' },
      { label: 'Data Access Log', path: '/admin/data_access_log' },
      { label: 'API Dashboard', path: '/admin/api_dashboard' },
    ],
  },
  {
    label: 'Tools',
    items: [
      { label: 'Operational Twin', path: '/admin/operational-twin' },
      { label: 'Telegram Test', path: '/admin/telegram-test' },
    ],
  },
]

function isActive(currentPath: string, itemPath: string): boolean {
  if (itemPath === '/admin') return currentPath === '/admin'
  return currentPath.startsWith(itemPath)
}

interface Props {
  children: ReactNode
  title?: string
}

export default function AdminLayout({ children, title }: Props) {
  const currentPath = window.location.pathname

  return (
    <AppLayout title={title}>
      <div className="flex gap-8 items-start">
        <nav className="w-52 flex-shrink-0 space-y-6">
          {NAV_GROUPS.map((group) => (
            <div key={group.label ?? 'root'}>
              {group.label && (
                <p
                  className="text-xs font-semibold uppercase tracking-wider px-3 mb-1"
                  style={{ color: '#94A3B8', letterSpacing: '0.05em' }}
                >
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(currentPath, item.path)
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      className="block px-3 py-2 rounded-lg text-sm transition-colors"
                      style={
                        active
                          ? { background: '#E6F4F4', color: '#028090', fontWeight: 600 }
                          : { color: '#475569', fontWeight: 500 }
                      }
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </AppLayout>
  )
}
