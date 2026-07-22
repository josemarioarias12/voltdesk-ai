interface Props { reason: string }

const MESSAGES: Record<string, string> = {
  expired:             'This demo session has expired.',
  capacity_reached:    'Maximum capacity (50 guests) reached.',
  workspace_not_found: 'Invalid demo link.',
  rate_limited:        'Too many requests. Please wait a moment and try again.',
  unexpected_error:    'Something went wrong. Please try again.',
}

export default function DemoExpired({ reason }: Props) {
  return (
    <div style={{ minHeight: '100vh', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '40px 32px', textAlign: 'center' as const, maxWidth: 340, width: '100%' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#DC2626" strokeWidth={2} aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          </svg>
        </div>
        <p style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>Demo unavailable</p>
        <p style={{ fontSize: 14, color: '#475569' }}>{MESSAGES[reason] ?? reason}</p>
      </div>
    </div>
  )
}
