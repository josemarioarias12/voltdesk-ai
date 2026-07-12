import { useState } from 'react'
import { router } from '@inertiajs/react'
import AppLayout from '@/components/AppLayout'
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
  unread_count: number
}

type FilterTab = 'all' | 'unread'

function timeAgo(isoString: string): string {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000)
  if (diff < 60)    return `${diff}s ago`
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

const UNREAD_TINT = 'rgba(2, 128, 144, 0.04)'
const UNREAD_ACCENT = '#028090'

export default function NotificationsIndex({ notifications, unread_count }: Props) {
  const [activeTab, setActiveTab] = useState<FilterTab>('all')

  const visibleNotifications = activeTab === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications

  const handleMarkRead = (id: number) => {
    router.post(`/notifications/${id}/mark_read`, {}, { preserveState: true, preserveScroll: true })
  }

  const handleMarkAllRead = () => {
    router.post('/notifications/mark_read', { id: 'all' }, { preserveState: true, preserveScroll: true })
  }

  return (
    <AppLayout title="Notifications">
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <div style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          marginBottom:   '4px',
          flexWrap:       'wrap',
          gap:            '12px',
        }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
              Notifications
            </h1>
            <p style={{ fontSize: '13px', color: '#94A3B8', margin: '4px 0 0' }}>
              Stay up to date with tickets, HR, and system activity
            </p>
          </div>
          {unread_count > 0 && (
            <button
              onClick={handleMarkAllRead}
              style={{
                background:   'transparent',
                border:       '1px solid #E2E8F0',
                borderRadius: '8px',
                padding:      '8px 14px',
                fontSize:     '13px',
                fontWeight:   600,
                color:        '#028090',
                cursor:       'pointer',
              }}
            >
              Mark all read
            </button>
          )}
        </div>

        <div style={{
          display:      'flex',
          gap:          '4px',
          borderBottom: '1px solid #E2E8F0',
          margin:       '20px 0',
        }}>
          {(['all', 'unread'] as FilterTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background:    'transparent',
                border:        'none',
                borderBottom:  activeTab === tab ? '2px solid #028090' : '2px solid transparent',
                padding:       '10px 4px',
                marginRight:   '20px',
                fontSize:      '14px',
                fontWeight:    activeTab === tab ? 600 : 500,
                color:         activeTab === tab ? '#0F172A' : '#94A3B8',
                cursor:        'pointer',
              }}
            >
              {tab === 'unread' ? `Unread (${unread_count})` : 'All'}
            </button>
          ))}
        </div>

        <div style={{
          background:   '#fff',
          border:       '1px solid #E2E8F0',
          borderRadius: '12px',
          overflow:     'hidden',
        }}>
          {visibleNotifications.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>
              {activeTab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </div>
          ) : (
            visibleNotifications.map(n => (
              <div
                key={n.id}
                onClick={() => !n.read && handleMarkRead(n.id)}
                style={{
                  display:      'flex',
                  gap:          '14px',
                  padding:      '16px 20px 16px 17px',
                  cursor:       n.read ? 'default' : 'pointer',
                  background:   n.read ? 'transparent' : UNREAD_TINT,
                  borderLeft:   n.read ? '3px solid transparent' : `3px solid ${UNREAD_ACCENT}`,
                  borderBottom: '1px solid #F1F5F9',
                }}
              >
                <div style={{
                  width:          '40px',
                  height:         '40px',
                  borderRadius:   '10px',
                  background:     n.read ? '#F1F5F9' : '#F0F9FA',
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  flexShrink:     0,
                }}>
                  <NotificationIcon type={n.notification_type} size={20} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize:   '14px',
                    fontWeight: n.read ? 400 : 600,
                    color:      '#0F172A',
                    margin:     '0 0 4px',
                  }}>
                    {n.title}
                  </p>
                  {n.body && (
                    <p style={{ fontSize: '13px', color: '#475569', margin: '0 0 6px' }}>
                      {n.body}
                    </p>
                  )}
                  <span style={{ fontSize: '12px', color: '#94A3B8' }}>
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
                    marginTop:    '5px',
                  }} />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  )
}