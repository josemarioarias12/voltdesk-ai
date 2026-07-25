import { useState, useEffect, useRef, useMemo } from 'react'
import { router } from '@inertiajs/react'
import { toast } from 'sonner'
import AppLayout from '@/components/AppLayout'
import EmptyState from '@/components/EmptyState'
import { LeaveRequest } from '@/types'
import { CARD, LABEL, TH_STYLE, BADGE, SLATE, NAVY, TEAL, DANGER, DANGER_BG, WARNING, WARNING_BG, SUCCESS, SUCCESS_BG } from '@/styles/tokens'

// ── Responsive hook ───────────────────────────────────────────────────────────
function useWindowWidth() {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return width
}

interface Stats {
  pending_count: number
  approved_this_month: number
  on_leave_today: number
}

interface Props {
  leave_requests: LeaveRequest[]
  stats: Stats
}

type StatusFilter = 'all' | 'pending' | 'pending_second_approval' | 'approved' | 'rejected'

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  pending:                 { bg: WARNING_BG, color: WARNING, label: 'Pending' },
  pending_second_approval: { bg: '#F5F3FF', color: '#7C3AED', label: 'Awaiting Final Approval' },
  approved:                { bg: SUCCESS_BG, color: SUCCESS, label: 'Approved' },
  rejected:                { bg: DANGER_BG, color: DANGER, label: 'Rejected' },
}

const LEAVE_TYPE_STYLES: Record<string, { bg: string; color: string }> = {
  vacation:   { bg: '#EFF6FF', color: '#2563EB' },
  sick_leave: { bg: '#FFF7ED', color: '#EA580C' },
  personal:   { bg: '#F5F3FF', color: '#7C3AED' },
  maternity:  { bg: '#FDF2F8', color: '#DB2777' },
  paternity:  { bg: '#F0FDF4', color: '#16A34A' },
  other:      { bg: SLATE[50], color: SLATE[600] },
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function PlusIcon({ size = 16, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m-7-7h14" />
    </svg>
  )
}

function CheckIcon({ size = 14, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

function XIcon({ size = 14, color = DANGER }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function ShieldIcon({ size = 14, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
    </svg>
  )
}

function EyeIcon({ size = 14, color = SLATE[600] }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" strokeWidth={2} />
    </svg>
  )
}

function SearchIcon({ size = 15, color = SLATE[400] }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <circle cx="11" cy="11" r="7" strokeWidth={2} />
      <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
    </svg>
  )
}

function ClockIcon({ size = 13, color = SLATE[400] }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <circle cx="12" cy="12" r="9" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3" />
    </svg>
  )
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  return (
    <div style={{
      width: 34, height: 34, borderRadius: '50%',
      background: TEAL, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, fontWeight: 700, flexShrink: 0,
    }}>
      {initials}
    </div>
  )
}

function humanize(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

interface RejectModal {
  id: number
  name: string
}

export default function LeaveRequestsIndex({ leave_requests, stats }: Props) {
  const [rejectModal, setRejectModal]         = useState<RejectModal | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [submitting, setSubmitting]           = useState(false)
  const [statusFilter, setStatusFilter]       = useState<StatusFilter>('all')
  const [search, setSearch]                   = useState('')
  const modalRef = useRef<HTMLDivElement>(null)

  const windowWidth = useWindowWidth()
  const isMobile     = windowWidth < 768

  const counts = useMemo(() => ({
    all: leave_requests.length,
    pending: leave_requests.filter(lr => lr.status === 'pending').length,
    pending_second_approval: leave_requests.filter(lr => lr.status === 'pending_second_approval').length,
    approved: leave_requests.filter(lr => lr.status === 'approved').length,
    rejected: leave_requests.filter(lr => lr.status === 'rejected').length,
  }), [leave_requests])

  const filtered = useMemo(() => {
    return leave_requests.filter(lr => {
      const matchesStatus = statusFilter === 'all' || lr.status === statusFilter
      const matchesSearch = search.trim().length === 0 ||
        lr.user.full_name.toLowerCase().includes(search.trim().toLowerCase())
      return matchesStatus && matchesSearch
    })
  }, [leave_requests, statusFilter, search])

  useEffect(() => {
    if (!rejectModal) return

    const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
      'button, textarea, [href], input, [tabindex]:not([tabindex="-1"])'
    )
    focusable?.[0]?.focus()

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') { setRejectModal(null); return }
      if (e.key !== 'Tab' || !focusable || focusable.length === 0) return

      const first = focusable[0]
      const last  = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [rejectModal])

  const handleApprove = (id: number, name: string, isFinal: boolean) => {
    setSubmitting(true)
    router.post(`/hr/leave_requests/${id}/approve`, {}, {
      onSuccess: () => toast.success(isFinal ? `Final approval given for ${name}` : `Leave request for ${name} approved`),
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

  const STATUS_TABS: Array<{ key: StatusFilter; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'pending_second_approval', label: 'Awaiting Final' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
  ]

  return (
    <AppLayout title="Leave Requests">
      {/* Reject modal */}
      {rejectModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 16 }}
          onClick={() => setRejectModal(null)}
        >
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-modal-title"
            onClick={e => e.stopPropagation()}
            style={{ ...CARD, padding: 28, width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
          >
            <h2 id="reject-modal-title" style={{ fontSize: 18, fontWeight: 700, color: NAVY, margin: '0 0 6px' }}>
              Reject leave request
            </h2>
            <p style={{ fontSize: 14, color: SLATE[600], margin: '0 0 20px' }}>
              Rejecting request from <strong>{rejectModal.name}</strong>
            </p>

            <label style={LABEL}>
              Rejection reason <span style={{ color: DANGER }}>*</span>
            </label>
            <textarea
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="Explain why this request is being rejected"
              rows={3}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(15,23,42,0.14)', fontSize: 14, resize: 'none', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 16 }}
            />

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setRejectModal(null)}
                style={{ flex: 1, padding: 11, borderRadius: 10, background: 'transparent', border: '1px solid rgba(15,23,42,0.14)', fontSize: 14, fontWeight: 600, color: SLATE[600], cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim() || submitting}
                style={{ flex: 1, padding: 11, borderRadius: 10, background: rejectionReason.trim() ? DANGER : SLATE[400], border: 'none', fontSize: 14, fontWeight: 600, color: '#fff', cursor: rejectionReason.trim() ? 'pointer' : 'not-allowed' }}
              >
                {submitting ? 'Rejecting…' : 'Confirm rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1100 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: isMobile ? 'stretch' : 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 16 : 0 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: NAVY, letterSpacing: '-0.02em', margin: '0 0 4px' }}>Leave Requests</h1>
            <p style={{ color: SLATE[600], fontSize: 13, margin: 0 }}>Manage and approve employee time-off requests</p>
          </div>
          <button
            onClick={() => router.get('/hr/leave_requests/new')}
            style={{ background: TEAL, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
          >
            <PlusIcon /> New Request
          </button>
        </div>

        {/* KPI cards */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Pending Approval', value: stats.pending_count, sub: 'awaiting review', color: WARNING, bg: WARNING_BG },
            { label: 'Approved This Month', value: stats.approved_this_month, sub: 'this month', color: SUCCESS, bg: SUCCESS_BG },
            { label: 'On Leave Today', value: stats.on_leave_today, sub: 'active today', color: TEAL, bg: '#F0FDFA' },
          ].map(card => (
            <div key={card.label} style={{ ...CARD, padding: '20px 24px' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: card.color }} />
              </div>
              <p style={{ fontSize: 11, fontWeight: 600, color: SLATE[400], textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>{card.label}</p>
              <p style={{ fontSize: 30, fontWeight: 700, color: card.color, margin: '0 0 2px' }}>{card.value}</p>
              <p style={{ fontSize: 12, color: SLATE[600], margin: 0 }}>{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 12, marginBottom: 16, alignItems: isMobile ? 'stretch' : 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {STATUS_TABS.map(tab => {
              const active = statusFilter === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  style={{
                    padding: '6px 14px', borderRadius: 20, border: active ? `1px solid ${TEAL}` : '1px solid rgba(15,23,42,0.12)',
                    background: active ? 'rgba(2,128,144,0.08)' : '#fff', color: active ? TEAL : SLATE[600],
                    fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  {tab.label}
                  <span style={{ fontSize: 11, opacity: 0.7 }}>{counts[tab.key]}</span>
                </button>
              )
            })}
          </div>
          <div style={{ position: 'relative', width: isMobile ? '100%' : 220 }}>
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
              <SearchIcon />
            </div>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by employee"
              style={{ width: '100%', padding: '8px 12px 8px 34px', borderRadius: 8, border: '1px solid rgba(15,23,42,0.14)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* Table (desktop) / Card list (mobile) */}
        {isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.length === 0 ? (
              <div style={CARD}><EmptyState title="No leave requests found" description="Try adjusting your filters or search." /></div>
            ) : (
              filtered.map(lr => {
                const status    = STATUS_STYLES[lr.status] ?? STATUS_STYLES.pending
                const leaveType = LEAVE_TYPE_STYLES[lr.leave_type] ?? { bg: SLATE[50], color: SLATE[600] }
                return (
                  <div key={lr.id} style={{ ...CARD, padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <Avatar name={lr.user.full_name} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: NAVY, margin: 0 }}>{lr.user.full_name}</p>
                        <p style={{ fontSize: 12, color: SLATE[400], margin: 0 }}>{lr.user.department ?? 'General'}</p>
                      </div>
                      <span style={{ ...BADGE, color: status.color, background: status.bg }}>{status.label}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ ...BADGE, color: leaveType.color, background: leaveType.bg }}>{humanize(lr.leave_type)}</span>
                      <span style={{ fontSize: 12, color: SLATE[400], display: 'flex', alignItems: 'center', gap: 4 }}>
                        <ClockIcon /> {lr.business_days} days
                      </span>
                    </div>
                    <RowActions lr={lr} onApprove={handleApprove} onReject={openRejectModal} submitting={submitting} fullWidth />
                  </div>
                )
              })
            )}
          </div>
        ) : (
          <div style={{ ...CARD, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', minWidth: 700, borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: SLATE[50], borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
                    {['Employee', 'Leave Type', 'Period & Duration', 'Status', 'Requested', 'Actions'].map(col => (
                      <th key={col} style={TH_STYLE}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={6}><EmptyState title="No leave requests found" description="Try adjusting your filters or search." /></td></tr>
                  ) : (
                    filtered.map((lr, i) => {
                      const status    = STATUS_STYLES[lr.status] ?? STATUS_STYLES.pending
                      const leaveType = LEAVE_TYPE_STYLES[lr.leave_type] ?? { bg: SLATE[50], color: SLATE[600] }
                      return (
                        <tr key={lr.id} style={{
                          borderBottom: i < filtered.length - 1 ? '1px solid rgba(15,23,42,0.04)' : 'none',
                          borderLeft: lr.status === 'pending' || lr.status === 'pending_second_approval' ? `3px solid ${status.color}` : '3px solid transparent',
                        }}>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <Avatar name={lr.user.full_name} />
                              <div>
                                <p style={{ fontSize: 13, fontWeight: 600, color: NAVY, margin: 0 }}>{lr.user.full_name}</p>
                                <p style={{ fontSize: 12, color: SLATE[400], margin: 0 }}>{humanize(lr.user.role)} · {lr.user.department ?? 'General'}</p>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ ...BADGE, color: leaveType.color, background: leaveType.bg }}>{humanize(lr.leave_type)}</span>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <p style={{ fontSize: 13, color: NAVY, margin: '0 0 2px' }}>{lr.start_date} – {lr.end_date}</p>
                            <p style={{ fontSize: 12, color: SLATE[400], margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <ClockIcon /> {lr.business_days} days
                            </p>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ ...BADGE, color: status.color, background: status.bg }}>{status.label}</span>
                          </td>
                          <td style={{ padding: '14px 16px', color: SLATE[600], fontSize: 13 }}>
                            {new Date(lr.created_at).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <RowActions lr={lr} onApprove={handleApprove} onReject={openRejectModal} submitting={submitting} />
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(15,23,42,0.04)', color: SLATE[400], fontSize: 13 }}>
              Showing {filtered.length} of {leave_requests.length} requests
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

// ── Row actions — driven entirely by backend-computed permissions ─────────────
function RowActions({ lr, onApprove, onReject, submitting, fullWidth }: {
  lr: LeaveRequest
  onApprove: (id: number, name: string, isFinal: boolean) => void
  onReject: (id: number, name: string) => void
  submitting: boolean
  fullWidth?: boolean
}) {
  const containerStyle: React.CSSProperties = { display: 'flex', gap: 8, width: fullWidth ? '100%' : undefined }

  if (lr.can_final_approve) {
    return (
      <div style={containerStyle}>
        <button
          onClick={() => onApprove(lr.id, lr.user.full_name, true)}
          disabled={submitting}
          style={{ flex: fullWidth ? 1 : undefined, background: '#7C3AED', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
        >
          <ShieldIcon /> Final approval
        </button>
        {lr.can_reject && (
          <button
            onClick={() => onReject(lr.id, lr.user.full_name)}
            style={{ flex: fullWidth ? 1 : undefined, background: 'transparent', color: DANGER, border: `1px solid ${DANGER}`, borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            Reject
          </button>
        )}
      </div>
    )
  }

  if (lr.can_approve) {
    return (
      <div style={containerStyle}>
        <button
          onClick={() => onApprove(lr.id, lr.user.full_name, false)}
          disabled={submitting}
          style={{ flex: fullWidth ? 1 : undefined, background: SUCCESS, color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
        >
          <CheckIcon /> Approve
        </button>
        {lr.can_reject && (
          <button
            onClick={() => onReject(lr.id, lr.user.full_name)}
            style={{ flex: fullWidth ? 1 : undefined, background: 'transparent', color: DANGER, border: `1px solid ${DANGER}`, borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
          >
            <XIcon /> Reject
          </button>
        )}
      </div>
    )
  }

  return (
    <button
      onClick={() => router.get(`/hr/leave_requests/${lr.id}`)}
      style={{ background: 'transparent', color: SLATE[600], border: '1px solid rgba(15,23,42,0.14)', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, width: fullWidth ? '100%' : undefined }}
    >
      <EyeIcon /> View
    </button>
  )
}
