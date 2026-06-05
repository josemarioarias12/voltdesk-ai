import { ReactNode, useEffect } from 'react'
import { router, usePage } from '@inertiajs/react'
import { SharedProps } from '@/types'
import { IconBolt } from '@/components/Icons'
import NotificationBell from '@/components/NotificationBell'
import { Toaster, toast } from 'sonner'

interface Props {
  children: ReactNode
  title?: string
}

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard',  icon: DashIcon },
  { label: 'Tickets',   path: '/tickets',    icon: TicketIcon, badge: true },
  { label: 'HR',        path: '/hr',         icon: HrIcon },
  { label: 'Assets',    path: '/inventory',     icon: AssetIcon },
  { label: 'Analytics', path: '/analytics',  icon: ChartIcon },
  { label: 'Admin',     path: '/admin',      icon: AdminIcon },
  { label: 'Settings',  path: '/settings',   icon: GearIcon },
]

export default function AppLayout({ children, title }: Props) {
  const { auth, workspace, notifications, unread_notifications_count, flash } = usePage<SharedProps>().props
  const currentPath = window.location.pathname

  useEffect(() => {
    if (flash?.notice) toast.success(flash.notice)
    if (flash?.alert)  toast.error(flash.alert)
  }, [flash?.notice, flash?.alert])

  return (
    <div className="flex min-h-screen" style={{ background: '#F8FAFC' }}>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: '12px',
            fontSize:     '14px',
            fontWeight:   '500',
          },
          duration: 4000,
        }}
      />

      {/* ── Sidebar ── */}
      <aside
        className="w-44 flex-shrink-0 flex flex-col"
        style={{ background: '#0F172A', position: 'fixed', top: 0, left: 0, bottom: 0 }}
      >
        <div className="flex items-center gap-2 px-4 py-5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: '#028090' }}
          >
            <IconBolt size={16} color="#fff" />
          </div>
          <span className="font-bold text-white text-sm">PulseDesk <span style={{ color: '#028090' }}>AI</span></span>
        </div>

        <nav className="flex-1 px-2 space-y-0.5">
          {NAV_ITEMS.map(({ label, path, icon: Icon, badge }) => {
            const isActive = currentPath.startsWith(path)
            return (
              <button
                key={path}
                onClick={() => router.get(path)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                style={{
                  background: isActive ? '#1E293B' : 'transparent',
                  color:      isActive ? '#FFFFFF' : '#94A3B8',
                }}
              >
                <div className="flex items-center gap-2.5">
                  <Icon active={isActive} />
                  {label}
                </div>
                {badge && isActive && (
                  <span
                    className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: '#028090', color: '#fff' }}
                  >
                    24
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        <div className="px-3 py-4 border-t" style={{ borderColor: '#1E293B' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: '#028090' }}
              >
                <span className="text-white text-xs font-bold">
                  {auth.user?.first_name?.charAt(0) ?? 'U'}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-white text-xs font-medium truncate" title={auth.user?.full_name ?? ''}>
                  {(() => {
                    const n = auth.user?.full_name ?? ''
                    const parts = n.split(' ')
                    return parts.length > 2
                      ? parts.slice(0, 2).join(' ') + ' ' + parts[2]?.charAt(0) + '.'
                      : n
                  })()}
                </p>
                <p className="text-xs truncate capitalize" style={{ color: '#94A3B8' }}>
                  {auth.user?.role?.replace(/_/g, ' ')}
                </p>
              </div>
            </div>
            <form method="post" action="/users/logout" style={{ margin: 0 }}>
                <input type="hidden" name="_method" value="delete" />
                <input type="hidden" name="authenticity_token" value={document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? ''} />
                <button
                  type="submit"
                  title="Sign out"
                  style={{
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    color: '#94A3B8', padding: '4px', borderRadius: '6px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </form>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col" style={{ marginLeft: '176px' }}>
        <header
          className="h-14 flex items-center justify-between px-6 border-b"
          style={{ background: '#fff', borderColor: '#E2E8F0' }}
        >
          <div className="flex items-center gap-2 text-sm" style={{ color: '#94A3B8' }}>
            <span className="font-medium" style={{ color: '#0F172A' }}>{workspace?.name ?? 'Workspace'}</span>
            <span>›</span>
            <span>{title ?? 'Dashboard'}</span>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
              style={{ background: '#F0FDFA', color: '#028090', border: '1px solid #99F6E4' }}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: '#028090' }} />
              {workspace?.name}
            </div>
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm"
              style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#94A3B8' }}
            >
              <SearchIcon />
              <span>Search...</span>
              <span className="text-xs px-1 rounded" style={{ background: '#E2E8F0' }}>K</span>
            </div>
            {auth.user && (
              <NotificationBell
                initialNotifications={notifications ?? []}
                initialUnreadCount={unread_notifications_count ?? 0}
                userId={auth.user.id}
              />
            )}
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: '#028090' }}
            >
              <span className="text-white text-sm font-bold">
                {auth.user?.first_name?.charAt(0) ?? 'U'}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

function DashIcon({ active }: { active?: boolean }) {
  return <svg width="16" height="16" fill="none" stroke={active ? '#fff' : '#94A3B8'} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
}
function TicketIcon({ active }: { active?: boolean }) {
  return <svg width="16" height="16" fill="none" stroke={active ? '#fff' : '#94A3B8'} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
}
function HrIcon({ active }: { active?: boolean }) {
  return <svg width="16" height="16" fill="none" stroke={active ? '#fff' : '#94A3B8'} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
}
function AssetIcon({ active }: { active?: boolean }) {
  return <svg width="16" height="16" fill="none" stroke={active ? '#fff' : '#94A3B8'} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
}
function ChartIcon({ active }: { active?: boolean }) {
  return <svg width="16" height="16" fill="none" stroke={active ? '#fff' : '#94A3B8'} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
}
function AdminIcon({ active }: { active?: boolean }) {
  return <svg width="16" height="16" fill="none" stroke={active ? '#fff' : '#94A3B8'} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
}
function GearIcon({ active }: { active?: boolean }) {
  return <svg width="16" height="16" fill="none" stroke={active ? '#fff' : '#94A3B8'} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
}
function SearchIcon() {
  return <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
}
function ChevronUpDown() {
  return <svg width="14" height="14" fill="none" stroke="#94A3B8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" /></svg>
}
