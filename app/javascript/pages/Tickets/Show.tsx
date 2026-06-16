import { useState, useCallback, useRef } from 'react'
import { router } from '@inertiajs/react'
import type { TicketsShowProps, Ticket, TicketComment, TicketActivity, TicketPriority, TicketStatus } from '@/types/tickets'
import { useActionCable } from '@/hooks/useActionCable'
import AppLayout from '@/components/AppLayout'

const PRIORITY_COLORS: Record<TicketPriority, string> = {
  critical: '#EF4444', high: '#F97316', medium: '#EAB308', low: '#6B7280',
}

const STATUS_CFG: Record<TicketStatus, { label: string; bg: string; text: string }> = {
  open:                   { label: 'Open',        bg: '#DCFCE7', text: '#16A34A' },
  in_progress:            { label: 'In Progress', bg: '#DBEAFE', text: '#2563EB' },
  pending:                { label: 'Pending',     bg: '#FEF9C3', text: '#CA8A04' },
  resolved:               { label: 'Resolved',    bg: '#DCFCE7', text: '#16A34A' },
  closed:                 { label: 'Closed',      bg: '#F1F5F9', text: '#64748B' },
  pending_classification: { label: 'Classifying', bg: '#F3E8FF', text: '#9333EA' },
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m} minutes ago`
  if (h < 24) return `${h} hours ago`
  return `${d} days ago`
}

// ── XAI Panel ─────────────────────────────────────────────────────────────────
function XaiPanel({ ticket }: { ticket: Ticket }) {
  const [collapsed, setCollapsed] = useState(false)
  const meta = ticket.ai_metadata

  if (!meta?.reasoning) {
    return (
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', padding: 20, marginBottom: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <p style={{ fontSize: 13, color: '#94A3B8' }}>⚡ AI classification in progress…</p>
      </div>
    )
  }

  const { category_signals, priority_signals, confidence, similar_ticket } = meta.reasoning
  const confidencePct = Math.round(confidence * 100)
  const isHigh = confidence >= 0.70

  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 16, boxShadow: '0 4px 24px rgba(2,128,144,0.20)' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#028090,#026E7A)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>AI Classification Reasoning</span>
          <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 11, padding: '2px 10px', borderRadius: 20 }}>Powered by GPT-4o</span>
        </div>
        <button onClick={() => setCollapsed(!collapsed)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', fontSize: 13, cursor: 'pointer' }}>
          {collapsed ? 'Expand ▼' : 'Collapse ▲'}
        </button>
      </div>

      {!collapsed && (
        <div style={{ background: '#fff', margin: '0 16px 16px', borderRadius: 12, padding: 20 }}>
          {/* Signals */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 20 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Category Signals</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {category_signals.map(s => (
                  <span key={s} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 20, border: '1px solid #E2E8F0', color: '#475569', background: '#F8FAFC' }}>{s}</span>
                ))}
              </div>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Priority Signals</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {priority_signals.map(s => (
                  <span key={s} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 20, background: '#FFF7ED', border: '1px solid #FED7AA', color: '#C2410C' }}>{s}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Confidence bar */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>Classification Confidence</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: isHigh ? '#16A34A' : '#EF4444' }}>
                {isHigh ? 'High' : 'Low'} Confidence {confidence.toFixed(2)}
              </span>
            </div>
            <div style={{ height: 8, background: '#F1F5F9', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${confidencePct}%`, background: isHigh ? '#16A34A' : '#EF4444', borderRadius: 4 }} />
            </div>
          </div>

          {/* Low confidence warning */}
          {!isHigh && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #FECACA', marginBottom: 16 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#DC2626' }}>⚠ Low Confidence — Review Recommended</span>
              <span style={{ fontSize: 11, color: '#94A3B8' }}>Shown when score &lt; 0.70</span>
            </div>
          )}

          {/* Similar ticket */}
          {similar_ticket && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 10, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <div>
                <p style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600, marginBottom: 2 }}>Similar Ticket Reference</p>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#028090' }}>{similar_ticket}</span>
                <span style={{ fontSize: 13, color: '#475569' }}> — Similar issue, resolved in 2h</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20, background: '#DCFCE7', color: '#16A34A' }}>Resolved</span>
            </div>
          )}

          {/* Correction rate */}
          {ticket.correction_rate && ticket.correction_rate.times_corrected > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: ticket.correction_rate.times_corrected > 5 ? '#FFFBEB' : '#F8FAFC', border: `1px solid ${ticket.correction_rate.times_corrected > 5 ? '#FDE68A' : '#E2E8F0'}`, marginTop: 12 }}>
              <span style={{ fontSize: 13, color: '#475569' }}>
                Category <strong style={{ color: '#028090' }}>{ticket.correction_rate.category}</strong> was corrected <strong>{ticket.correction_rate.times_corrected}</strong> times by agents in this workspace
              </span>
              {ticket.correction_rate.times_corrected > 5 && (
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: '#FEF3C7', color: '#D97706' }}>⚠ High correction rate</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Comment ───────────────────────────────────────────────────────────────────
function CommentItem({ comment }: { comment: TicketComment }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '16px 20px', borderBottom: '1px solid #E2E8F0' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#028090', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{comment.user.full_name.charAt(0)}</span>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{comment.user.full_name}</span>
          <span style={{ fontSize: 12, color: '#94A3B8' }}>{comment.user.role.replace(/_/g, ' ')}</span>
          {comment.internal && (
            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#FFF7ED', color: '#C2410C', border: '1px solid #FED7AA' }}>Internal Note</span>
          )}
          <span style={{ marginLeft: 'auto', fontSize: 12, color: '#94A3B8' }}>{formatRelative(comment.created_at)}</span>
        </div>
        <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>{comment.body}</p>
      </div>
    </div>
  )
}

// ── Activity ──────────────────────────────────────────────────────────────────
function ActivityItem({ activity }: { activity: TicketActivity }) {
  const labels: Record<string, string> = {
    created:        'Ticket created',
    status_changed: `Status changed to ${(activity.metadata as Record<string,string>).to ?? ''}`,
    assigned:       `Assigned to ${(activity.metadata as Record<string,string>).to_user_name ?? 'agent'}`,
    escalated:      'Escalated to Critical — SLA breached',
    sla_breached:   'SLA breached — past target response time',
    sla_warning:    'SLA warning — deadline approaching',
    ai_classified:  'AI classified ticket',
  }

  return (
    <div style={{ display: 'flex', gap: 12, padding: '12px 20px' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: 12 }}>⚙</span>
      </div>
      <div>
        <p style={{ fontSize: 13, color: '#0F172A' }}>{labels[activity.action] ?? activity.action.replace(/_/g, ' ')}</p>
        <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{formatRelative(activity.created_at)}</p>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function TicketsShow({ ticket, can_resolve, can_assign, can_internal }: TicketsShowProps) {
  const [commentBody, setCommentBody] = useState('')
  const [isInternal, setIsInternal]   = useState(false)
  const [activeTab, setActiveTab]     = useState<'all' | 'internal' | 'external'>('all')

  useActionCable(
    { channel: 'TicketsChannel', ticket_id: ticket.id },
    useCallback(() => { router.reload({ only: ['ticket'] }) }, [])
  )

  const priorityColor = PRIORITY_COLORS[ticket.priority]
  const statusCfg     = STATUS_CFG[ticket.status] ?? STATUS_CFG.open

  const visibleComments = ticket.comments.filter(c => {
    if (activeTab === 'internal') return c.internal
    if (activeTab === 'external') return !c.internal
    return true
  })

  function submitComment(e: React.FormEvent) {
    e.preventDefault()
    if (!commentBody.trim()) return
    router.post(`/tickets/${ticket.id}/comments`, {
      ticket_comment: { body: commentBody, internal: isInternal }
    }, { onSuccess: () => { setCommentBody(''); setIsInternal(false) } })
  }

  return (
    <AppLayout title={ticket.ticket_number}>
      {/* Breadcrumb + actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <button onClick={() => router.get('/tickets')} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>← Tickets</button>
          <span style={{ color: '#E2E8F0' }}>/</span>
          <span style={{ color: '#0F172A', fontWeight: 500 }}>{ticket.ticket_number}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {can_resolve && ticket.status !== 'resolved' && ticket.status !== 'closed' && (
            <button
              onClick={() => router.post(`/tickets/${ticket.id}/resolve`)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', background: '#028090', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' }}
            >
              ✓ Resolve Ticket
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24 }}>
        {/* Left column */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header card */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', padding: 24, marginBottom: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, padding: '4px 10px', borderRadius: 8, background: 'rgba(2,128,144,0.1)', color: '#028090' }}>{ticket.ticket_number}</span>
              <span style={{ fontSize: 13, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: statusCfg.bg, color: statusCfg.text }}>{statusCfg.label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: `${priorityColor}15`, color: priorityColor }}>{ticket.priority}</span>
              <span style={{ fontSize: 13, padding: '4px 10px', borderRadius: 20, background: '#F1F5F9', color: '#475569' }}>{ticket.category.toUpperCase()}</span>
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 16 }}>{ticket.title}</h1>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Description</p>
            <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{ticket.description ?? 'No description provided.'}</p>
          </div>

          <XaiPanel ticket={ticket} />

          {/* Comments */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', padding: '0 20px' }}>
              {(['all', 'internal', 'external'] as const).map(tab => {
                const labels = { all: 'All Activity', internal: 'Internal Notes', external: 'External' }
                return (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    style={{ padding: '14px 4px', marginRight: 24, fontSize: 13, fontWeight: 500, border: 'none', background: 'none', cursor: 'pointer', borderBottom: activeTab === tab ? '2px solid #028090' : '2px solid transparent', color: activeTab === tab ? '#028090' : '#475569' }}>
                    {labels[tab]}
                  </button>
                )
              })}
            </div>

            {/* Comments list */}
            {visibleComments.map(c => <CommentItem key={c.id} comment={c} />)}
            {ticket.activities.length > 0 && activeTab === 'all' && (
              <div style={{ padding: '8px 0' }}>
                {ticket.activities.map(a => <ActivityItem key={a.id} activity={a} />)}
              </div>
            )}

            {/* Reply box */}
            <div style={{ borderTop: '1px solid #E2E8F0', padding: 20 }}>
              <form onSubmit={submitComment}>
                <textarea value={commentBody} onChange={e => setCommentBody(e.target.value)}
                  placeholder="Write a reply or internal note..."
                  rows={3}
                  style={{ width: '100%', padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 13, resize: 'none', outline: 'none', color: '#0F172A', boxSizing: 'border-box' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {can_internal && (
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#94A3B8', cursor: 'pointer' }}>
                        <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} />
                        Internal note
                      </label>
                    )}
                  </div>
                  <button type="submit" disabled={!commentBody.trim()}
                    style={{ padding: '8px 20px', background: '#028090', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', opacity: commentBody.trim() ? 1 : 0.4 }}>
                    Send
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ width: 272, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* SLA */}
          <div style={{ borderRadius: 16, border: '1px solid', padding: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', borderColor: ticket.sla_status === 'breached' ? '#FECACA' : '#E2E8F0', background: ticket.sla_status === 'breached' ? '#FEF2F2' : '#fff' }}>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: ticket.sla_status === 'breached' ? '#DC2626' : '#94A3B8', marginBottom: 6 }}>
              {ticket.sla_status === 'breached' ? '⚠ SLA DEADLINE' : 'SLA Deadline'}
            </p>
            {ticket.sla_status === 'breached' ? (
              <>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#DC2626' }}>Breached</p>
                <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>Opened {formatRelative(ticket.created_at)}</p>
              </>
            ) : ticket.due_at ? (
              <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{new Date(ticket.due_at).toLocaleString()}</p>
            ) : (
              <p style={{ fontSize: 13, color: '#94A3B8' }}>No SLA set</p>
            )}
          </div>

          {/* Details */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', padding: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>Ticket Details</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Assignee */}
              <div>
                <p style={{ fontSize: 11, color: '#94A3B8', marginBottom: 6 }}>Assigned To</p>
                {ticket.assigned_to ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#028090', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>{ticket.assigned_to.full_name.charAt(0)}</span>
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, color: '#0F172A' }}>{ticket.assigned_to.full_name}</p>
                      <p style={{ fontSize: 11, color: '#94A3B8' }}>{ticket.assigned_to.role.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                ) : <span style={{ fontSize: 13, color: '#94A3B8', fontStyle: 'italic' }}>Unassigned</span>}
              </div>
              {/* Requester */}
              <div>
                <p style={{ fontSize: 11, color: '#94A3B8', marginBottom: 6 }}>Requested By</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>{ticket.created_by.full_name.charAt(0)}</span>
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500, color: '#0F172A' }}>{ticket.created_by.full_name}</p>
                    <p style={{ fontSize: 11, color: '#94A3B8' }}>{ticket.created_by.role.replace(/_/g, ' ')}</p>
                  </div>
                </div>
              </div>
              {[
                { label: 'Department', value: ticket.department.name },
                { label: 'Category',   value: ticket.category },
                { label: 'Priority',   value: ticket.priority, color: priorityColor },
                { label: 'Status',     value: statusCfg.label, color: statusCfg.text },
                { label: 'Created',    value: new Date(ticket.created_at).toLocaleDateString() },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: '#94A3B8', width: 80, flexShrink: 0 }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: color ?? '#0F172A', textTransform: 'capitalize' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          {ticket.ai_metadata?.tags && ticket.ai_metadata.tags.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', padding: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Tags</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {ticket.ai_metadata.tags.map(tag => (
                  <span key={tag} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 20, background: '#F1F5F9', color: '#475569' }}>{tag}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
