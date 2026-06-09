import { useState } from 'react'
import AppLayout from '@/components/AppLayout'
import { router } from '@inertiajs/react'
import { LeaveRequest } from '@/types'
import { toast } from 'sonner'

interface Stats {
  pending_count: number
  approved_this_month: number
  on_leave_today: number
}

interface Props {
  leave_requests: LeaveRequest[]
  stats: Stats
}

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  pending:  { bg: '#FEF3C7', color: '#D97706', label: 'Pending' },
  approved: { bg: '#DCFCE7', color: '#16A34A', label: 'Approved' },
  rejected: { bg: '#FEE2E2', color: '#DC2626', label: 'Rejected' },
}

const LEAVE_TYPE_STYLES: Record<string, { bg: string; color: string }> = {
  vacation:   { bg: '#EFF6FF', color: '#2563EB' },
  sick_leave: { bg: '#FFF7ED', color: '#EA580C' },
  personal:   { bg: '#F5F3FF', color: '#7C3AED' },
  maternity:  { bg: '#FDF2F8', color: '#DB2777' },
  paternity:  { bg: '#F0FDF4', color: '#16A34A' },
}

interface RejectModal {
  id: number
  name: string
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  return (
    <div style={{
      width: '34px', height: '34px', borderRadius: '50%',
      background: '#028090', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '12px', fontWeight: '700', flexShrink: 0,
    }}>
      {initials}
    </div>
  )
}

export default function LeaveRequestsIndex({ leave_requests, stats }: Props) {
  const [rejectModal, setRejectModal]       = useState<RejectModal | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [submitting, setSubmitting]         = useState(false)

  const pending = leave_requests.filter(lr => lr.status === 'pending')

  const handleApprove = (id: number, name: string) => {
    setSubmitting(true)
    router.post(`/hr/leave_requests/${id}/approve`, {}, {
      onSuccess: () => toast.success(`Leave request for ${name} approved`),
      onError:   () => toast.error('Failed to approve request'),
      onFinish:  () => setSubmitting(false),
    })
  }

  const openRejectModal = (id: number, name: string) => {
    setRejectModal({ id, name })
    setRejectionReason('')
  }

  const handleReject = () => {
    if (!rejectModal || !rejectionReason.trim()) return
    setSubmitting(true)
    router.post(`/hr/leave_requests/${rejectModal.id}/reject`,
      { rejection_reason: rejectionReason },
      {
        onSuccess: () => {
          toast.error(`Leave request for ${rejectModal.name} rejected`)
          setRejectModal(null)
        },
        onError:  () => toast.error('Failed to reject request'),
        onFinish: () => setSubmitting(false),
      }
    )
  }

  return (
    <AppLayout title="Leave Requests">
      {/* Reject modal */}
      {rejectModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2000,
        }}>
          <div style={{
            background: '#fff', borderRadius: '16px', padding: '28px',
            width: '440px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0F172A', margin: '0 0 6px' }}>
              Reject Leave Request
            </h2>
            <p style={{ fontSize: '14px', color: '#475569', margin: '0 0 20px' }}>
              Rejecting request from <strong>{rejectModal.name}</strong>
            </p>

            <label style={{ fontSize: '13px', fontWeight: '600', color: '#0F172A', display: 'block', marginBottom: '8px' }}>
              Rejection reason <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <textarea
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="Please provide a reason for rejecting this request..."
              rows={3}
              autoFocus
              style={{
                width: '100%', padding: '10px 12px', borderRadius: '10px',
                border: '1px solid #E2E8F0', fontSize: '14px',
                resize: 'none', outline: 'none', fontFamily: 'inherit',
                boxSizing: 'border-box', marginBottom: '16px',
              }}
            />

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setRejectModal(null)}
                style={{
                  flex: 1, padding: '11px', borderRadius: '10px',
                  background: 'transparent', border: '1px solid #E2E8F0',
                  fontSize: '14px', fontWeight: '600', color: '#475569', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim() || submitting}
                style={{
                  flex: 1, padding: '11px', borderRadius: '10px',
                  background: rejectionReason.trim() ? '#DC2626' : '#94A3B8',
                  border: 'none', fontSize: '14px', fontWeight: '600',
                  color: '#fff', cursor: rejectionReason.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                {submitting ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: '1100px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#0F172A', margin: '0 0 4px' }}>Leave Requests</h1>
            <p style={{ color: '#475569', fontSize: '14px', margin: 0 }}>Manage and approve employee time-off requests</p>
          </div>
          <button
            onClick={() => router.get('/hr/leave_requests/new')}
            style={{
              background: '#028090', color: '#fff', border: 'none',
              borderRadius: '10px', padding: '10px 18px',
              fontSize: '14px', fontWeight: '600', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '7px',
            }}
          >
            <span style={{ fontSize: '18px', lineHeight: 1 }}>+</span> New Request
          </button>
        </div>

        {/* KPI cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Pending Approval', value: stats.pending_count,       sub: 'awaiting review', color: '#D97706', bg: '#FEF3C7' },
            { label: 'Approved This Month', value: stats.approved_this_month, sub: 'this month',   color: '#16A34A', bg: '#DCFCE7' },
            { label: 'On Leave Today',    value: stats.on_leave_today,     sub: 'active today',    color: '#028090', bg: '#F0FDFA' },
          ].map((card, i) => (
            <div key={i} style={{
              background: '#fff', borderRadius: '16px', padding: '20px 24px',
              border: '1px solid #E2E8F0', boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
            }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '12px',
                background: card.bg, display: 'flex', alignItems: 'center',
                justifyContent: 'center', marginBottom: '12px',
              }}>
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: card.color }} />
              </div>
              <p style={{ fontSize: '11px', fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>{card.label}</p>
              <p style={{ fontSize: '30px', fontWeight: '700', color: card.color, margin: '0 0 2px' }}>{card.value}</p>
              <p style={{ fontSize: '12px', color: '#475569', margin: 0 }}>{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{
          background: '#fff', borderRadius: '16px',
          border: '1px solid #E2E8F0', boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
          overflow: 'hidden',
        }}>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                {['Employee', 'Leave Type', 'Period & Duration', 'Status', 'Requested', 'Actions'].map(col => (
                  <th key={col} style={{
                    padding: '12px 16px', textAlign: 'left',
                    fontSize: '11px', fontWeight: '600', color: '#94A3B8',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leave_requests.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
                    No leave requests yet
                  </td>
                </tr>
              ) : (
                leave_requests.map((lr, i) => {
                  const status    = STATUS_STYLES[lr.status] ?? STATUS_STYLES.pending
                  const leaveType = LEAVE_TYPE_STYLES[lr.leave_type] ?? { bg: '#F1F5F9', color: '#475569' }
                  return (
                    <tr
                      key={lr.id}
                      style={{
                        borderBottom: i < leave_requests.length - 1 ? '1px solid #F1F5F9' : 'none',
                        borderLeft:   lr.status === 'pending' ? '3px solid #D97706' : '3px solid transparent',
                      }}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Avatar name={lr.user.full_name} />
                          <div>
                            <p style={{ fontSize: '13px', fontWeight: '600', color: '#0F172A', margin: 0 }}>{lr.user.full_name}</p>
                            <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>{lr.user.role?.replace(/_/g, ' ')} · {lr.user.department ?? 'General'}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          fontSize: '12px', fontWeight: '600',
                          color: leaveType.color, background: leaveType.bg,
                          padding: '3px 10px', borderRadius: '20px',
                        }}>
                          {lr.leave_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <p style={{ fontSize: '13px', color: '#0F172A', margin: '0 0 2px' }}>
                          {lr.start_date} – {lr.end_date}
                        </p>
                        <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>📅 {lr.business_days} days</p>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          fontSize: '12px', fontWeight: '600',
                          color: status.color, background: status.bg,
                          padding: '3px 10px', borderRadius: '20px',
                        }}>
                          {status.label}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#475569', fontSize: '13px' }}>
                        {new Date(lr.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {lr.status === 'pending' ? (
                            <>
                              <button
                                onClick={() => handleApprove(lr.id, lr.user.full_name)}
                                disabled={submitting}
                                style={{
                                  background: '#16A34A', color: '#fff', border: 'none',
                                  borderRadius: '8px', padding: '6px 12px',
                                  fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                                }}
                              >
                                ✓ Approve
                              </button>
                              <button
                                onClick={() => openRejectModal(lr.id, lr.user.full_name)}
                                style={{
                                  background: 'transparent', color: '#DC2626',
                                  border: '1px solid #DC2626',
                                  borderRadius: '8px', padding: '6px 12px',
                                  fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                                }}
                              >
                                ✕ Reject
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => router.get(`/hr/leave_requests/${lr.id}`)}
                              style={{
                                background: 'transparent', color: '#475569',
                                border: '1px solid #E2E8F0',
                                borderRadius: '8px', padding: '6px 12px',
                                fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                              }}
                            >
                              View
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
          </div>
          <div style={{ padding: '12px 16px', borderTop: '1px solid #F1F5F9', color: '#94A3B8', fontSize: '13px' }}>
            Showing {leave_requests.length} requests
            {pending.length > 0 && (
              <span style={{ marginLeft: '12px', color: '#D97706', fontWeight: '600' }}>
                · {pending.length} pending review
              </span>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
