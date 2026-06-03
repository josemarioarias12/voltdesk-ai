import { useState } from 'react'
import AppLayout from '@/components/AppLayout'
import { router } from '@inertiajs/react'
import { LeaveRequest } from '@/types'

interface Props {
  leave_request: LeaveRequest
}

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  pending:  { bg: '#FEF3C7', color: '#D97706', label: 'Pending Approval' },
  approved: { bg: '#DCFCE7', color: '#16A34A', label: 'Approved' },
  rejected: { bg: '#FEE2E2', color: '#DC2626', label: 'Rejected' },
}

const LEAVE_LABELS: Record<string, string> = {
  vacation:   'Vacation',
  sick_leave: 'Sick Leave',
  personal:   'Personal',
  maternity:  'Maternity',
  paternity:  'Paternity',
}

export default function LeaveRequestsShow({ leave_request: lr }: Props) {
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectForm, setShowRejectForm]   = useState(false)
  const [submitting, setSubmitting]           = useState(false)

  const status = STATUS_STYLES[lr.status] ?? STATUS_STYLES.pending

  const handleApprove = () => {
    setSubmitting(true)
    router.post(`/hr/leave_requests/${lr.id}/approve`, {}, {
      onFinish: () => setSubmitting(false),
    })
  }

  const handleReject = () => {
    if (!rejectionReason.trim()) return
    setSubmitting(true)
    router.post(`/hr/leave_requests/${lr.id}/reject`, { rejection_reason: rejectionReason }, {
      onFinish: () => setSubmitting(false),
    })
  }

  return (
    <AppLayout title={`Leave Request #LR-${String(lr.id).padStart(5, '0')}`}>
      <div style={{ maxWidth: '1000px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <button
              onClick={() => router.get('/hr/leave_requests')}
              style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '14px', padding: 0, marginBottom: '8px' }}
            >
              ← Leave Requests
            </button>
            <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#0F172A', margin: '0 0 4px' }}>
              Leave Request #LR-{String(lr.id).padStart(5, '0')}
            </h1>
            <p style={{ color: '#475569', fontSize: '14px', margin: 0 }}>Review and action this leave request</p>
          </div>
          <span style={{
            fontSize: '13px', fontWeight: '600', color: status.color,
            background: status.bg, padding: '6px 14px', borderRadius: '20px',
          }}>
            ● {status.label}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
          {/* Left — details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Request details */}
            <div style={{
              background: '#fff', borderRadius: '16px', padding: '24px',
              border: '1px solid #E2E8F0', boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
            }}>
              <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📋 Request Details
              </h2>

              {/* Employee */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #F1F5F9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '50%',
                    background: '#028090', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px', fontWeight: '700',
                  }}>
                    {lr.user.full_name.charAt(0)}
                  </div>
                  <div>
                    <p style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A', margin: 0 }}>{lr.user.full_name}</p>
                    <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0 }}>{lr.user.role?.replace(/_/g, ' ')} · {lr.user.department ?? 'General'}</p>
                  </div>
                </div>
                <span style={{
                  fontSize: '12px', fontWeight: '600', color: '#2563EB',
                  background: '#EFF6FF', padding: '4px 12px', borderRadius: '20px',
                }}>
                  {LEAVE_LABELS[lr.leave_type] ?? lr.leave_type}
                </span>
              </div>

              {/* Dates grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                {[
                  { label: 'Start Date', value: `📅 ${lr.start_date}` },
                  { label: 'End Date',   value: `📅 ${lr.end_date}` },
                  { label: 'Duration',   value: `⏱ ${lr.business_days} business days` },
                  { label: 'Submitted',  value: `✉ ${new Date(lr.created_at).toLocaleDateString()}` },
                ].map(item => (
                  <div key={item.label}>
                    <p style={{ fontSize: '11px', fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>{item.label}</p>
                    <p style={{ fontSize: '14px', color: '#0F172A', margin: 0 }}>{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Reason */}
              {lr.reason && (
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontSize: '11px', fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>Reason</p>
                  <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '12px 16px', fontSize: '14px', color: '#475569' }}>
                    {lr.reason}
                  </div>
                </div>
              )}

              {/* Rejection reason */}
              {lr.rejection_reason && (
                <div>
                  <p style={{ fontSize: '11px', fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>Rejection Reason</p>
                  <div style={{ background: '#FEF2F2', borderRadius: '10px', padding: '12px 16px', fontSize: '14px', color: '#DC2626' }}>
                    {lr.rejection_reason}
                  </div>
                </div>
              )}
            </div>

            {/* Approval panel — only for pending */}
            {lr.status === 'pending' && (
              <div style={{
                background: '#fff', borderRadius: '16px', padding: '24px',
                border: '1px solid #E2E8F0', boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A', margin: 0 }}>
                    🛡 HR Manager — Decision
                  </h2>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#D97706', background: '#FEF3C7', padding: '3px 10px', borderRadius: '20px' }}>
                    Action required
                  </span>
                </div>

                <button
                  onClick={handleApprove}
                  disabled={submitting}
                  style={{
                    width: '100%', padding: '13px', borderRadius: '10px',
                    background: '#16A34A', color: '#fff', border: 'none',
                    fontSize: '15px', fontWeight: '600', cursor: 'pointer',
                    marginBottom: '10px',
                  }}
                >
                  ✓ Approve Request
                </button>

                <button
                  onClick={() => setShowRejectForm(prev => !prev)}
                  style={{
                    width: '100%', padding: '12px', borderRadius: '10px',
                    background: 'transparent', color: '#DC2626',
                    border: '1px solid #DC2626',
                    fontSize: '15px', fontWeight: '600', cursor: 'pointer',
                  }}
                >
                  ✕ Reject Request
                </button>

                {showRejectForm && (
                  <div style={{ marginTop: '16px' }}>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: '#DC2626', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      ⚠ Rejection reason is required
                    </p>
                    <textarea
                      value={rejectionReason}
                      onChange={e => setRejectionReason(e.target.value)}
                      placeholder="Please provide a reason for rejecting this request..."
                      rows={3}
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: '10px',
                        border: '1px solid #FCA5A5', fontSize: '14px',
                        resize: 'vertical', outline: 'none', fontFamily: 'inherit',
                        boxSizing: 'border-box', marginBottom: '10px',
                      }}
                    />
                    <button
                      onClick={handleReject}
                      disabled={!rejectionReason.trim() || submitting}
                      style={{
                        width: '100%', padding: '11px', borderRadius: '10px',
                        background: rejectionReason.trim() ? '#DC2626' : '#94A3B8',
                        color: '#fff', border: 'none',
                        fontSize: '14px', fontWeight: '600',
                        cursor: rejectionReason.trim() ? 'pointer' : 'not-allowed',
                      }}
                    >
                      ✉ Confirm Rejection
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right — sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Approved by */}
            {lr.approved_by && (
              <div style={{
                background: '#fff', borderRadius: '16px', padding: '20px',
                border: '1px solid #E2E8F0', boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
              }}>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A', margin: '0 0 12px' }}>
                  {lr.status === 'approved' ? '✅ Approved by' : '❌ Rejected by'}
                </h3>
                <p style={{ fontSize: '14px', color: '#475569', margin: 0 }}>{lr.approved_by.full_name}</p>
              </div>
            )}

            {/* Quick actions */}
            <div style={{
              background: '#fff', borderRadius: '16px', padding: '20px',
              border: '1px solid #E2E8F0', boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A', margin: '0 0 12px' }}>Quick Actions</h3>
              {[
                { label: '📋 View all requests', path: '/hr/leave_requests' },
                { label: '➕ New request', path: '/hr/leave_requests/new' },
              ].map(action => (
                <button
                  key={action.path}
                  onClick={() => router.get(action.path)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 0', background: 'none', border: 'none', borderBottom: '1px solid #F1F5F9',
                    cursor: 'pointer', fontSize: '13px', color: '#475569',
                  }}
                >
                  {action.label} <span>›</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
