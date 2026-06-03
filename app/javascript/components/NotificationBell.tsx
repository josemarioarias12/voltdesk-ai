import { useState, useEffect } from 'react'
import { useActionCable } from '@/hooks/useActionCable'
import NotificationDropdown from '@/components/NotificationDropdown'
import { router } from '@inertiajs/react'

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
  initialNotifications: Notification[]
  initialUnreadCount: number
  userId: number
}

export default function NotificationBell({ initialNotifications, initialUnreadCount, userId }: Props) {
  const [notifications, setNotifications]   = useState<Notification[]>(initialNotifications)
  const [unreadCount, setUnreadCount]       = useState(initialUnreadCount)
  const [dropdownOpen, setDropdownOpen]     = useState(false)

  useActionCable(
    { channel: 'NotificationsChannel' },
    (data) => {
      const notification = data as unknown as Notification
      setNotifications(prev => [notification, ...prev])
      setUnreadCount(prev => prev + 1)
    }
  )

  const handleMarkRead = (id: number | 'all') => {
    if (id === 'all') {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
      router.post('/notifications/mark_read', {}, { preserveState: true })
    } else {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
      router.post(`/notifications/${id}/mark_read`, {}, { preserveState: true })
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setDropdownOpen(prev => !prev)}
        style={{
          position:       'relative',
          background:     'transparent',
          border:         'none',
          cursor:         'pointer',
          padding:        '8px',
          borderRadius:   '8px',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          color:          '#94A3B8',
        }}
        aria-label={`Notifications — ${unreadCount} unread`}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>

        {unreadCount > 0 && (
          <span style={{
            position:       'absolute',
            top:            '4px',
            right:          '4px',
            minWidth:       '18px',
            height:         '18px',
            background:     '#DC2626',
            color:          '#fff',
            fontSize:       '11px',
            fontWeight:     '700',
            borderRadius:   '9px',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            padding:        '0 4px',
            lineHeight:     1,
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {dropdownOpen && (
        <NotificationDropdown
          notifications={notifications}
          onMarkRead={handleMarkRead}
          onClose={() => setDropdownOpen(false)}
        />
      )}
    </div>
  )
}
