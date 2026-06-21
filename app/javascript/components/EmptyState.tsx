import type { ReactNode } from 'react'

function DefaultEmptyIcon() {
  return (
    <svg width="48" height="48" fill="none" stroke="#CBD5E1" viewBox="0 0 24 24">
      <rect x="3" y="8" width="18" height="12" rx="2" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l3-4h12l3 4M9 12h6" />
    </svg>
  )
}

interface EmptyStateProps {
  icon?: string | ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const resolvedIcon = icon ?? <DefaultEmptyIcon />
  const isStringIcon = typeof resolvedIcon === 'string'

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '48px 24px', textAlign: 'center'
    }}>
      <div style={{ fontSize: isStringIcon ? 48 : undefined, marginBottom: 16 }}>{resolvedIcon}</div>
      <p style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: '0 0 8px' }}>{title}</p>
      {description && (
        <p style={{ fontSize: 14, color: '#475569', margin: '0 0 24px', maxWidth: 320 }}>{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          style={{
            background: '#028090', color: '#fff', border: 'none',
            borderRadius: 10, padding: '10px 24px', fontWeight: 600,
            fontSize: 14, cursor: 'pointer'
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}