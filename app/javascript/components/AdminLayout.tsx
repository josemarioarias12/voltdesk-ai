import { ReactNode } from 'react'
import { Link } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
import AppLayout from '@/components/AppLayout'

interface NavItem {
  labelKey: string
  path: string
}

interface NavGroup {
  labelKey: string | null
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    labelKey: null,
    items: [{ labelKey: 'nav.overview', path: '/admin' }],
  },
  {
    labelKey: 'nav.aiOperations',
    items: [
      { labelKey: 'nav.auditLog', path: '/admin/audit-log' },
      { labelKey: 'nav.modelGovernance', path: '/admin/governance' },
      { labelKey: 'nav.patternAlerts', path: '/admin/pattern_alerts' },
      { labelKey: 'nav.learning', path: '/admin/learning' },
      { labelKey: 'nav.aiHealth', path: '/admin/ai-health' },
      { labelKey: 'nav.benchmark', path: '/admin/benchmark' },
    ],
  },
  {
    labelKey: 'nav.workspace',
    items: [
      { labelKey: 'nav.users', path: '/admin/users' },
      { labelKey: 'nav.compliance', path: '/admin/compliance' },
      { labelKey: 'nav.dataAccessLog', path: '/admin/data_access_log' },
      { labelKey: 'nav.apiDashboard', path: '/admin/api_dashboard' },
    ],
  },
  {
    labelKey: 'nav.tools',
    items: [
      { labelKey: 'nav.operationalTwin', path: '/admin/operational-twin' },
      { labelKey: 'nav.telegramTest', path: '/admin/telegram-test' },
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
  const { t } = useTranslation('admin')
  const currentPath = window.location.pathname

  return (
    <AppLayout title={title}>
      <div className="flex gap-8 items-start">
        <nav className="w-52 flex-shrink-0 space-y-6">
          {NAV_GROUPS.map((group) => (
            <div key={group.labelKey ?? 'root'}>
              {group.labelKey && (
                <p
                  className="text-xs font-semibold uppercase tracking-wider px-3 mb-1"
                  style={{ color: '#94A3B8', letterSpacing: '0.05em' }}
                >
                  {t(group.labelKey)}
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
                      {t(item.labelKey)}
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