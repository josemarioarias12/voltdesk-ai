export const NOTIFICATION_ICON_COLOR: Record<string, string> = {
  leave_request_submitted: '#0F172A',
  leave_request_approved:  '#16A34A',
  leave_request_rejected:  '#DC2626',
  ticket_assigned:         '#028090',
  ticket_sla_warning:      '#F97316',
  onboarding_plan_ready:   '#028090',
  daily_digest:            '#475569',
}

interface IconProps {
  width: number
  height: number
  viewBox: string
  fill: string
  stroke: string
  strokeWidth: number
  strokeLinecap: 'round'
  strokeLinejoin: 'round'
}

export function getNotificationIconProps(type: string, size = 18): IconProps {
  const color = NOTIFICATION_ICON_COLOR[type] ?? '#94A3B8'
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }
}

export function NotificationIconPath({ type }: { type: string }) {
  switch (type) {
    case 'leave_request_submitted':
      return (
        <>
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <path d="M9 3v2h6V3" />
          <path d="M8 11h8M8 15h5" />
        </>
      )
    case 'leave_request_approved':
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M8.5 12.5l2.5 2.5 5-5" />
        </>
      )
    case 'leave_request_rejected':
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9.5l5 5M14.5 9.5l-5 5" />
        </>
      )
    case 'ticket_assigned':
      return (
        <>
          <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8z" />
          <path d="M14 6v12" strokeDasharray="2 2" />
        </>
      )
    case 'ticket_sla_warning':
      return (
        <>
          <path d="M12 3l9 16H3l9-16z" />
          <path d="M12 10v4" />
          <circle cx="12" cy="17" r="0.5" fill="currentColor" />
        </>
      )
    case 'onboarding_plan_ready':
      return (
        <>
          <path d="M12 2c2.5 2.5 4 6 4 10 0 2-1 4-1 4l-3 3-3-3s-1-2-1-4c0-4 1.5-7.5 4-10z" />
          <circle cx="12" cy="10" r="1.5" />
          <path d="M9 17l-2 4M15 17l2 4" />
        </>
      )
    case 'daily_digest':
      return <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    default:
      return (
        <>
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </>
      )
  }
}

export function NotificationIcon({ type, size = 18 }: { type: string; size?: number }) {
  return (
    <svg {...getNotificationIconProps(type, size)}>
      <NotificationIconPath type={type} />
    </svg>
  )
}