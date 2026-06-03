import { useEffect, useRef } from 'react'

interface Notification {
  id: number
  title: string
  body: string
  notification_type: string
  resource_type: string | null
  resource_id: number | null
  read: boolean
  created_at: string
}

interface Props {
  notifications: Notification[]
  onMarkRead: (id: number | 'all') => void
  onClose: () => void
}

const TYPE_ICONS: Record<string, string> = {
  leave_request_submitted: '📋',
  leave_request_approved:  '✅',
  leave_request_rejected:  '❌',
  ticket_assigned:         '🎫',
  ticket_sla_warning:      '⚠️',
  onboarding_plan_ready:   '🚀',
  daily_digest:            '📊',
}

function timeAgo(isoString: string): string {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000)
  if (diff < 60)    return `${diff}s ago`
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

const clampStyle: React.CSSProperties = {
  fontSize:          '12px',
  color:             '#475569',
  margin:            '0 0 4px',
  overflow:          'hidden',
  display:           '-webkit-box',
  WebkitLineClamp:   2,
  WebkitBoxOrient:   'vertical' as const,
}

export default function NotificationDropdown({ notifications, onMarkRead, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div
      ref={ref}
      style={{
        position:     'absolute',
        top:          'calc(100% + 8px)',
        right:        0,
        width:        '380px',
        background:   '#fff',
        borderRadius: '16px',
        border:       '1px solid #E2E8F0',
        boxShadow:    '0 16px 40px rgba(0,0,0,0.12)',
        zIndex:       1000,
        overflow:     'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        padding:        '16px 20px',
        borderBottom:   '1px solid #F1F5F9',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A' }}>
            Notifications
          </span>
          {unreadCount > 0 && (
            <span style={{
              fontSize:     '12px',
              fontWeight:   '600',
              color:        '#DC2626',
              background:   '#FEE2E2',
              padding:      '2px 8px',
              borderRadius: '20px',
            }}>
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => onMarkRead('all')}
            style={{
              background:   'transparent',
              border:       'none',
              cursor:       'pointer',
              fontSize:     '13px',
              color:        '#028090',
              fontWeight:   '600',
              padding:      '4px 8px',
              borderRadius: '6px',
            }}
          >
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {notifications.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>
            No notifications yet
          </div>
        ) : (
          notifications.map(n => (
            <div
              key={n.id}
              onClick={() => !n.read && onMarkRead(n.id)}
              style={{
                display:      'flex',
                gap:          '12px',
                padding:      '14px 20px',
                cursor:       n.read ? 'default' : 'pointer',
                background:   n.read ? 'transparent' : '#F0FDFA',
                borderBottom: '1px solid #F8FAFC',
                transition:   'background 0.15s',
              }}
            >
              <div style={{
                width:          '36px',
                height:         '36px',
                borderRadius:   '10px',
                background:     n.read ? '#F1F5F9' : '#CCFBF1',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                fontSize:       '18px',
                flexShrink:     0,
              }}>
                {TYPE_ICONS[n.notification_type] ?? '🔔'}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize:     '13px',
                  fontWeight:   n.read ? '400' : '600',
                  color:        '#0F172A',
                  margin:       '0 0 2px',
                  whiteSpace:   'nowrap',
                  overflow:     'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {n.title}
                </p>
                {n.body && (
                  <p style={clampStyle}>
                    {n.body}
                  </p>
                )}
                <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                  {timeAgo(n.created_at)}
                </span>
              </div>

              {!n.read && (
                <div style={{
                  width:        '8px',
                  height:       '8px',
                  borderRadius: '50%',
                  background:   '#028090',
                  flexShrink:   0,
                  marginTop:    '4px',
                }} />
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div style={{ padding: '12px 20px', borderTop: '1px solid #F1F5F9', textAlign: 'center' }}>
          <a
            href="/notifications"
            style={{ fontSize: '13px', color: '#028090', fontWeight: '600', textDecoration: 'none' }}
          >
            View all notifications
          </a>
        </div>
      )}
    </div>
  )
}
