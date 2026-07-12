import { useEffect, useRef, useState } from 'react'

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
  isMobile: boolean
  anchorTop: number
}

const TYPE_ICON_COLOR: Record<string, string> = {
  leave_request_submitted: '#0F172A',
  leave_request_approved:  '#16A34A',
  leave_request_rejected:  '#DC2626',
  ticket_assigned:         '#028090',
  ticket_sla_warning:      '#F97316',
  onboarding_plan_ready:   '#028090',
  daily_digest:            '#475569',
}

function TypeIcon({ type }: { type: string }) {
  const color = TYPE_ICON_COLOR[type] ?? '#94A3B8'
  const iconProps = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }

  switch (type) {
    case 'leave_request_submitted':
      return (
        <svg {...iconProps}>
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <path d="M9 3v2h6V3" />
          <path d="M8 11h8M8 15h5" />
        </svg>
      )
    case 'leave_request_approved':
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M8.5 12.5l2.5 2.5 5-5" />
        </svg>
      )
    case 'leave_request_rejected':
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9.5l5 5M14.5 9.5l-5 5" />
        </svg>
      )
    case 'ticket_assigned':
      return (
        <svg {...iconProps}>
          <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8z" />
          <path d="M14 6v12" strokeDasharray="2 2" />
        </svg>
      )
    case 'ticket_sla_warning':
      return (
        <svg {...iconProps}>
          <path d="M12 3l9 16H3l9-16z" />
          <path d="M12 10v4" />
          <circle cx="12" cy="17" r="0.5" fill={color} />
        </svg>
      )
    case 'onboarding_plan_ready':
      return (
        <svg {...iconProps}>
          <path d="M12 2c2.5 2.5 4 6 4 10 0 2-1 4-1 4l-3 3-3-3s-1-2-1-4c0-4 1.5-7.5 4-10z" />
          <circle cx="12" cy="10" r="1.5" />
          <path d="M9 17l-2 4M15 17l2 4" />
        </svg>
      )
    case 'daily_digest':
      return (
        <svg {...iconProps}>
          <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
        </svg>
      )
    default:
      return (
        <svg {...iconProps}>
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      )
  }
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

const MAX_LIST_HEIGHT = 400
const BOTTOM_SAFE_MARGIN = 16

export default function NotificationDropdown({ notifications, onMarkRead, onClose, isMobile, anchorTop }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [viewportHeight, setViewportHeight] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 0
  )

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  useEffect(() => {
    const handleResize = () => setViewportHeight(window.innerHeight)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  const availableListHeight = isMobile
    ? Math.min(MAX_LIST_HEIGHT, viewportHeight - anchorTop - BOTTOM_SAFE_MARGIN)
    : MAX_LIST_HEIGHT

  const containerStyle: React.CSSProperties = isMobile
    ? {
        position:     'fixed',
        top:          `${anchorTop}px`,
        left:         '12px',
        right:        '12px',
        width:        'auto',
        background:   '#fff',
        borderRadius: '16px',
        border:       '1px solid #E2E8F0',
        boxShadow:    '0 16px 40px rgba(0,0,0,0.12)',
        zIndex:       1000,
        overflow:     'hidden',
      }
    : {
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
      }

  return (
    <div ref={ref} style={containerStyle}>
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

      <div style={{ maxHeight: `${availableListHeight}px`, overflowY: 'auto' }}>
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
                flexShrink:     0,
              }}>
                <TypeIcon type={n.notification_type} />
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