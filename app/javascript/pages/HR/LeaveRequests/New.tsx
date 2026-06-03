import { useState } from 'react'
import AppLayout from '@/components/AppLayout'
import { router } from '@inertiajs/react'

interface Props {
  leave_types: string[]
}

const LEAVE_TYPE_CONFIG: Record<string, { label: string; icon: string; color: string; border: string }> = {
  vacation:   { label: 'Vacation',   icon: '🌴', color: '#2563EB', border: '#BFDBFE' },
  sick_leave: { label: 'Sick Leave', icon: '🤒', color: '#EA580C', border: '#FED7AA' },
  personal:   { label: 'Personal',   icon: '👤', color: '#7C3AED', border: '#DDD6FE' },
  maternity:  { label: 'Maternity',  icon: '🤱', color: '#DB2777', border: '#FBCFE8' },
  paternity:  { label: 'Paternity',  icon: '👶', color: '#16A34A', border: '#BBF7D0' },
}

export default function LeaveRequestsNew({ leave_types }: Props) {
  const [leaveType, setLeaveType] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate]     = useState('')
  const [reason, setReason]       = useState('')
  const [submitting, setSubmitting] = useState(false)

  const businessDays = () => {
    if (!startDate || !endDate) return 0
    const start = new Date(startDate)
    const end   = new Date(endDate)
    if (end < start) return 0
    let count = 0
    const cur = new Date(start)
    while (cur <= end) {
      const day = cur.getDay()
      if (day !== 0 && day !== 6) count++
      cur.setDate(cur.getDate() + 1)
    }
    return count
  }

  const handleSubmit = () => {
    if (!leaveType || !startDate || !endDate) return
    setSubmitting(true)
    router.post('/hr/leave_requests', {
      leave_request: { leave_type: leaveType, start_date: startDate, end_date: endDate, reason }
    }, { onFinish: () => setSubmitting(false) })
  }

  const days = businessDays()

  return (
    <AppLayout title="Request Time Off">
      <div style={{ maxWidth: '700px' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={() => router.get('/hr/leave_requests')}
            style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '14px', padding: 0, marginBottom: '8px' }}
          >
            ← Leave Requests
          </button>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#0F172A', margin: '0 0 4px' }}>Request Time Off</h1>
          <p style={{ color: '#475569', fontSize: '14px', margin: 0 }}>Submit a leave request for approval</p>
        </div>

        <div style={{
          background: '#fff', borderRadius: '16px', padding: '28px',
          border: '1px solid #E2E8F0', boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
        }}>
          {/* Leave type */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontSize: '14px', fontWeight: '600', color: '#0F172A', display: 'block', marginBottom: '12px' }}>
              Leave Type <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {leave_types.map(type => {
                const cfg = LEAVE_TYPE_CONFIG[type]
                if (!cfg) return null
                const selected = leaveType === type
                return (
                  <button
                    key={type}
                    onClick={() => setLeaveType(type)}
                    style={{
                      padding: '16px 12px', borderRadius: '12px', cursor: 'pointer',
                      border: selected ? `2px solid ${cfg.color}` : `1px solid #E2E8F0`,
                      background: selected ? `${cfg.border}40` : '#fff',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                      transition: 'all 0.15s',
                    }}
                  >
                    <span style={{ fontSize: '22px' }}>{cfg.icon}</span>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: selected ? cfg.color : '#475569' }}>{cfg.label}</span>
                    {selected && <span style={{ fontSize: '16px', color: cfg.color }}>✓</span>}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Date range */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontSize: '14px', fontWeight: '600', color: '#0F172A', display: 'block', marginBottom: '12px' }}>
              Date Range <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '12px', alignItems: 'center' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: '10px',
                    border: '1px solid #E2E8F0', fontSize: '14px', color: '#0F172A',
                    outline: 'none',
                  }}
                />
              </div>
              <span style={{ color: '#94A3B8', fontSize: '18px', marginTop: '18px' }}>→</span>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: '10px',
                    border: '1px solid #E2E8F0', fontSize: '14px', color: '#0F172A',
                    outline: 'none',
                  }}
                />
              </div>
            </div>
            {days > 0 && (
              <div style={{
                marginTop: '12px', padding: '10px 14px', borderRadius: '10px',
                background: '#F0FDFA', border: '1px solid #99F6E4',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <span style={{ color: '#028090' }}>⏱</span>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#028090' }}>
                  Duration: {days} business {days === 1 ? 'day' : 'days'}
                </span>
                <span style={{ fontSize: '12px', color: '#475569' }}>
                  ({startDate} – {endDate})
                </span>
              </div>
            )}
          </div>

          {/* Reason */}
          <div style={{ marginBottom: '28px' }}>
            <label style={{ fontSize: '14px', fontWeight: '600', color: '#0F172A', display: 'block', marginBottom: '8px' }}>
              Reason <span style={{ fontSize: '12px', fontWeight: '400', color: '#94A3B8' }}>Optional</span>
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Briefly describe the reason for your leave request..."
              rows={3}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: '10px',
                border: '1px solid #E2E8F0', fontSize: '14px', color: '#0F172A',
                resize: 'vertical', outline: 'none', fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!leaveType || !startDate || !endDate || submitting}
            style={{
              width: '100%', padding: '13px', borderRadius: '10px',
              background: (!leaveType || !startDate || !endDate) ? '#94A3B8' : '#028090',
              color: '#fff', border: 'none', fontSize: '15px', fontWeight: '600',
              cursor: (!leaveType || !startDate || !endDate) ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? 'Submitting...' : '✈ Submit Request'}
          </button>
          <p style={{ textAlign: 'center', fontSize: '13px', color: '#94A3B8', margin: '12px 0 0' }}>
            🔔 Your manager will be notified immediately
          </p>
          <p style={{ textAlign: 'center', margin: '8px 0 0' }}>
            <button onClick={() => router.get('/hr/leave_requests')} style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '13px', cursor: 'pointer' }}>
              Cancel
            </button>
          </p>
        </div>
      </div>
    </AppLayout>
  )
}
