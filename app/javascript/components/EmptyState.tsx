interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export default function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '48px 24px', textAlign: 'center'
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
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