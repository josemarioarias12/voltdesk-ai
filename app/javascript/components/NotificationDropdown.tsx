import { useEffect, useRef, useState } from 'react'
import { NotificationIcon } from '@/utils/notificationStyle'

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
const UNREAD_TINT = 'rgba(2, 128, 144, 0.04)'
const UNREAD_ACCENT = '#028090'

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
                padding:      '14px 20px 14px 17px',
                cursor:       n.read ? 'default' : 'pointer',
                background:   n.read ? 'transparent' : UNREAD_TINT,
                borderLeft:   n.read ? '3px solid transparent' : `3px solid ${UNREAD_ACCENT}`,
                borderBottom: '1px solid #F8FAFC',
                transition:   'background 0.15s',
              }}
            >
              <div style={{
                width:          '36px',
                height:         '36px',
                borderRadius:   '10px',
                background:     n.read ? '#F1F5F9' : '#F0F9FA',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                flexShrink:     0,
              }}>
                <NotificationIcon type={n.notification_type} />
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
                  background:   UNREAD_ACCENT,
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