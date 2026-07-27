import { ReactNode, useEffect, useState } from 'react'
import { router, usePage, Link } from '@inertiajs/react'
import type { GlobalEvent } from '@inertiajs/core'
import FaceIdPrompt from '@/components/FaceIdPrompt'
import { SharedProps } from '@/types'
import { IconBolt } from '@/components/Icons'
import NotificationBell from '@/components/NotificationBell'
import Avatar from '@/components/Avatar'
import { useLocale } from '@/hooks/useLocale'
import { SkeletonDashboard } from './Skeleton'
import { Toaster, toast } from 'sonner'
import VoltCopilotPanel from '@/components/VoltCopilotPanel'

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
 const { auth, workspace, notifications, unread_notifications_count, active_tickets_count, flash, show_face_id_prompt } = usePage<SharedProps>().props
  const currentPath = window.location.pathname
  const [navigating, setNavigating] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { locale, setLocale } = useLocale()
  useEffect(() => {
    const onStart = (event: GlobalEvent<'start'>) => {
      const visit = event.detail.visit
      if (visit.method === 'get' && visit.only.length === 0) setNavigating(true)
    }
    const onFinish = () => setNavigating(false)
    const onNetworkError = () => {
      toast.error('Network error — please check your connection and try again.')
    }
    const onHttpException = () => {
      toast.error('Something went wrong on our end. Please try again.')
    }
    const removeStart = router.on('start', onStart)
    const removeFinish = router.on('finish', onFinish)
    const removeNetworkError = router.on('networkError', onNetworkError)
    const removeHttpException = router.on('httpException', onHttpException)
    return () => { removeStart(); removeFinish(); removeNetworkError(); removeHttpException() }
  }, [])

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

      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      {/* ── Sidebar ── */}
      <aside
        className={sidebarOpen ? 'w-44 flex-shrink-0 flex flex-col fixed top-0 left-0 bottom-0 z-30 transition-transform duration-300 translate-x-0' : 'w-44 flex-shrink-0 flex flex-col fixed top-0 left-0 bottom-0 z-30 transition-transform duration-300 lg:translate-x-0 -translate-x-full'}
        style={{ background: '#0F172A' }}
      >
        <div className="flex items-center gap-2 px-4 py-5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: '#028090' }}
          >
            <IconBolt size={16} color="#fff" />
          </div>
          <span className="font-bold text-white text-sm">VoltDesk <span style={{ color: '#028090' }}>AI</span></span>
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
                    {active_tickets_count}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

       <div className="px-3 py-4 border-t" style={{ borderColor: '#1E293B' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link href="/settings/profile"><Avatar avatarUrl={auth.user?.avatar_url} firstName={auth.user?.first_name} size={32} /></Link>
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
      <div className="flex-1 flex flex-col lg:ml-44 min-w-0">
        <header
          className="h-14 flex items-center justify-between px-6 border-b"
          style={{ background: '#fff', borderColor: '#E2E8F0' }}
        >
          <div className="flex items-center gap-2 text-sm" style={{ color: '#94A3B8' }}>
            <button
              className="lg:hidden mr-2 p-1.5 rounded-lg"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#0F172A' }}
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="font-medium" style={{ color: '#0F172A' }}>{workspace?.name ?? 'Workspace'}</span>
            <span>›</span>
            <span>{title ?? 'Dashboard'}</span>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
              style={{ background: '#F0FDFA', color: '#028090', border: '1px solid #99F6E4' }}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: '#028090' }} />
              {workspace?.name}
            </div>
            <div
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm"
              style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#94A3B8' }}
            >
              <SearchIcon />
              <span>Search...</span>
              <span className="text-xs px-1 rounded" style={{ background: '#E2E8F0' }}>K</span>
            </div>
            <div
              className="flex items-center rounded-lg p-0.5"
              style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}
              role="group"
              aria-label="Language"
            >
              <button
                onClick={() => setLocale('en')}
                className="px-2 py-1 rounded-md text-xs font-semibold transition-colors"
                style={{ background: locale === 'en' ? '#028090' : 'transparent', color: locale === 'en' ? '#fff' : '#94A3B8', border: 'none', cursor: 'pointer' }}
              >
                EN
              </button>
              <button
                onClick={() => setLocale('es')}
                className="px-2 py-1 rounded-md text-xs font-semibold transition-colors"
                style={{ background: locale === 'es' ? '#028090' : 'transparent', color: locale === 'es' ? '#fff' : '#94A3B8', border: 'none', cursor: 'pointer' }}
              >
                ES
              </button>
            </div>
            {auth.user && (
              <NotificationBell
                initialNotifications={notifications ?? []}
                initialUnreadCount={unread_notifications_count ?? 0}
                userId={auth.user.id}
              />
            )}
            <Link href="/settings/profile" style={{ display: 'flex' }}><Avatar avatarUrl={auth.user?.avatar_url} firstName={auth.user?.first_name} size={36} /></Link>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {!navigating && <FaceIdPrompt show={show_face_id_prompt} />}
          {navigating ? <SkeletonDashboard /> : children}
        </main>
      </div>

      <VoltCopilotPanel />
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