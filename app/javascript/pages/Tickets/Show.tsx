import { useState, useCallback } from 'react'
import { router } from '@inertiajs/react'
import type {
  TicketsShowProps, Ticket, TicketComment, TicketActivity,
  TicketPriority, TicketStatus, AgentActionPending,
} from '@/types/tickets'
import { useActionCable } from '@/hooks/useActionCable'
import AppLayout from '@/components/AppLayout'

// ── Design tokens ─────────────────────────────────────────────────────────────
const CARD: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  border: '1px solid rgba(15,23,42,0.08)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.05)',
}

const LABEL: React.CSSProperties = {
  fontSize: 10.5,
  fontWeight: 600,
  color: '#A3ACBA',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
}

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

// ── AI Pipeline animation (pending_classification) ────────────────────────────
const PIPELINE_STEPS = [
  'Analyzing ticket text',
  'Searching similar resolved tickets',
  'Determining priority and urgency',
  'Generating suggested response',
  'Finalizing classification',
]

function AiPipelineCard() {
  const [activeStep] = useState(0)

  return (
    <div style={{ ...CARD, padding: 20, marginBottom: 16, border: '1px solid rgba(147,51,234,0.2)', background: '#FAFAFA' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#9333EA', animation: 'pulse 1.5s ease-in-out infinite' }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#9333EA' }}>AI Classification Pipeline Running</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {PIPELINE_STEPS.map((step, idx) => {
          const done    = idx < activeStep
          const current = idx === activeStep
          return (
            <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                background: done ? '#028090' : current ? '#9333EA' : '#F1F5F9',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {done
                  ? <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  : current
                    ? <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />
                    : null}
              </div>
              <span style={{ fontSize: 12, color: done ? '#028090' : current ? '#0F172A' : '#94A3B8', fontWeight: current ? 600 : 400 }}>
                {step}
                {current && <span style={{ color: '#9333EA' }}> ...</span>}
              </span>
            </div>
          )
        })}
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  )
}

// ── XAI Panel ─────────────────────────────────────────────────────────────────
function XaiPanel({ ticket }: { ticket: Ticket }) {
  const [collapsed, setCollapsed] = useState(false)
  const meta = ticket.ai_metadata

  if (!meta?.reasoning) return null

  const { category_signals, priority_signals, confidence, similar_ticket } = meta.reasoning
  const confidencePct = Math.round(confidence * 100)
  const isHigh = confidence >= 0.70

  return (
    <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 4px 16px rgba(2,128,144,0.12)' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#028090,#026E7A)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" />
            <path d="M7 4v3l2 1" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>AI Classification Reasoning</span>
          <span style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 10.5, padding: '2px 8px', borderRadius: 20 }}>GPT-4o</span>
        </div>
        <button onClick={() => setCollapsed(!collapsed)}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          {collapsed ? 'Expand' : 'Collapse'}
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d={collapsed ? 'M2 4l4 4 4-4' : 'M2 8l4-4 4 4'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {!collapsed && (
        <div style={{ background: '#fff', padding: 20 }}>
          {/* Signals grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <div>
              <p style={{ ...LABEL, marginBottom: 8 }}>Category Signals</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {category_signals.map(s => (
                  <span key={s} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: 'rgba(2,128,144,0.08)', color: '#028090', border: '1px solid rgba(2,128,144,0.15)' }}>{s}</span>
                ))}
              </div>
            </div>
            <div>
              <p style={{ ...LABEL, marginBottom: 8 }}>Priority Signals</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {priority_signals.map(s => (
                  <span key={s} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: '#FFF7ED', border: '1px solid #FED7AA', color: '#C2410C' }}>{s}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Confidence bar */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={LABEL}>Classification Confidence</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: isHigh ? '#16A34A' : '#EF4444' }}>
                {confidencePct}% — {isHigh ? 'High' : 'Low'} Confidence
              </span>
            </div>
            <div style={{ height: 6, background: '#F1F5F9', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${confidencePct}%`, background: isHigh ? '#16A34A' : '#EF4444', borderRadius: 3, transition: 'width 600ms ease' }} />
            </div>
          </div>

          {!isHigh && (
            <div style={{ padding: '10px 14px', borderRadius: 8, background: '#FEF2F2', border: '1px solid rgba(239,68,68,0.2)', marginBottom: 16 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: '#DC2626' }}>Low Confidence — Manual review recommended</span>
            </div>
          )}

          {similar_ticket && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 8, background: '#F8FAFC', border: '1px solid rgba(15,23,42,0.08)' }}>
              <div>
                <p style={{ ...LABEL, marginBottom: 2 }}>Similar Ticket Reference</p>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#028090' }}>{similar_ticket}</span>
                <span style={{ fontSize: 13, color: '#475569' }}> — Similar issue resolved</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: '#DCFCE7', color: '#16A34A' }}>Resolved</span>
            </div>
          )}

          {ticket.correction_rate && ticket.correction_rate.times_corrected > 0 && (
            <div style={{ padding: '10px 14px', borderRadius: 8, background: ticket.correction_rate.times_corrected > 5 ? '#FFFBEB' : '#F8FAFC', border: `1px solid ${ticket.correction_rate.times_corrected > 5 ? 'rgba(234,179,8,0.3)' : 'rgba(15,23,42,0.08)'}`, marginTop: 12 }}>
              <span style={{ fontSize: 12, color: '#475569' }}>
                Category <strong style={{ color: '#028090' }}>{ticket.correction_rate.category}</strong> corrected{' '}
                <strong>{ticket.correction_rate.times_corrected}</strong> times in this workspace
              </span>
              {ticket.correction_rate.times_corrected > 5 && (
                <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#FEF3C7', color: '#D97706' }}>High correction rate</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── RAG Suggested Response card ───────────────────────────────────────────────
function RagSuggestionCard({
  agentAction,
  onAccept,
}: {
  agentAction: AgentActionPending
  onAccept: (text: string) => void
}) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed || !agentAction.ai_reasoning) return null

  const citationNumbers = agentAction.similar_tickets
    .slice(0, 3)
    .map(t => t.title)
    .join(', ')

  return (
    <div style={{ ...CARD, marginBottom: 16, border: '1px solid rgba(2,195,154,0.25)', background: 'linear-gradient(135deg, rgba(2,195,154,0.04) 0%, #fff 100%)' }}>
      {/* Header */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(15,23,42,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1l1.8 3.6L14 5.6l-3 2.9.7 4.1L8 10.5l-3.7 2.1.7-4.1-3-2.9 4.2-.9z" stroke="#02C39A" strokeWidth="1.3" strokeLinejoin="round" />
          </svg>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>AI Suggested Response</span>
          <span style={{ fontSize: 10.5, color: '#02C39A', fontWeight: 600, background: 'rgba(2,195,154,0.1)', padding: '2px 8px', borderRadius: 20 }}>
            {Math.round(agentAction.top_similarity * 100)}% match
          </span>
        </div>
        <button onClick={() => setDismissed(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A3ACBA', fontSize: 12 }}>
          Dismiss
        </button>
      </div>

      {/* Citation */}
      {citationNumbers && (
        <div style={{ padding: '8px 20px 0', fontSize: 11, color: '#A3ACBA' }}>
          Based on similar resolved tickets: <span style={{ color: '#028090', fontWeight: 500 }}>{citationNumbers}</span>
        </div>
      )}

      {/* Response text */}
      <div style={{ padding: '12px 20px', fontSize: 13, color: '#475569', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
        {agentAction.ai_reasoning}
      </div>

      {/* Actions */}
      <div style={{ padding: '0 20px 16px', display: 'flex', gap: 8 }}>
        <button
          onClick={() => onAccept(agentAction.ai_reasoning)}
          style={{ padding: '7px 16px', background: '#028090', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>
          Accept Response
        </button>
        <button
          onClick={() => onAccept(agentAction.ai_reasoning)}
          style={{ padding: '7px 16px', background: '#fff', border: '1px solid rgba(15,23,42,0.12)', borderRadius: 8, fontSize: 12, fontWeight: 500, color: '#475569', cursor: 'pointer' }}>
          Edit Before Sending
        </button>
      </div>
    </div>
  )
}

// ── Agent Orchestrator Approval Card ─────────────────────────────────────────
function AgentApprovalCard({ agentAction, ticketId }: { agentAction: AgentActionPending; ticketId: number }) {
  const confidencePct = Math.round(agentAction.confidence * 100)

  return (
    <div style={{ ...CARD, marginBottom: 16, border: '1px solid rgba(249,115,22,0.25)', background: 'linear-gradient(135deg, rgba(249,115,22,0.04) 0%, #fff 100%)' }}>
      {/* Header */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(15,23,42,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F97316', flexShrink: 0, animation: 'pulse 2s ease-in-out infinite' }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>AI Agent Awaiting Approval</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: 'rgba(249,115,22,0.1)', color: '#F97316' }}>
          Human-in-the-Loop
        </span>
      </div>

      {/* Proposal */}
      <div style={{ padding: '16px 20px' }}>
        <p style={{ ...LABEL, marginBottom: 12 }}>AI Proposes the Following Actions</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: '#F8FAFC', border: '1px solid rgba(15,23,42,0.06)' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1a6 6 0 100 12A6 6 0 007 1zm0 3v4l3 1.5" stroke="#028090" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: 12, color: '#0F172A' }}>Auto-resolve this ticket using RAG response</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: '#F8FAFC', border: '1px solid rgba(15,23,42,0.06)' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 4h10M2 7h7M2 10h5" stroke="#028090" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: 12, color: '#0F172A' }}>Post suggested response as public comment</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: '#F8FAFC', border: '1px solid rgba(15,23,42,0.06)' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1l1.5 3 3.5.5-2.5 2.5.5 3.5L7 9l-3 1.5.5-3.5L2 4.5 5.5 4z" stroke="#028090" strokeWidth="1.3" strokeLinejoin="round" />
            </svg>
            <span style={{ fontSize: 12, color: '#0F172A' }}>Notify requester of resolution</span>
          </div>
        </div>

        {/* Confidence */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={LABEL}>AI Confidence</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: confidencePct >= 75 ? '#16A34A' : '#F97316' }}>
              {confidencePct}%
            </span>
          </div>
          <div style={{ height: 5, background: '#F1F5F9', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${confidencePct}%`, background: confidencePct >= 75 ? '#028090' : '#F97316', borderRadius: 3 }} />
          </div>
        </div>

        {/* Similar tickets used */}
        {agentAction.similar_tickets.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ ...LABEL, marginBottom: 8 }}>Based On</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {agentAction.similar_tickets.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>{t.title}</span>
                  <span style={{ color: '#A3ACBA', flexShrink: 0 }}>{Math.round(t.similarity * 100)}% similar</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Approve / Reject */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => router.patch(`/agent_actions/${agentAction.id}/ticket_approve`)}
            style={{ flex: 1, padding: '9px 0', background: '#028090', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>
            Approve & Execute
          </button>
          <button
            onClick={() => router.patch(`/agent_actions/${agentAction.id}/ticket_reject`)}
            style={{ flex: 1, padding: '9px 0', background: '#fff', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#EF4444', cursor: 'pointer' }}>
            Override / Reject
          </button>
        </div>

        <p style={{ fontSize: 11, color: '#A3ACBA', marginTop: 10, textAlign: 'center' }}>
          Awaiting approval · {formatRelative(agentAction.created_at)}
        </p>
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  )
}

// ── Comment ───────────────────────────────────────────────────────────────────
function CommentItem({ comment }: { comment: TicketComment }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '16px 20px', borderBottom: '1px solid rgba(15,23,42,0.05)' }}>
      <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#028090', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>{comment.user.full_name.charAt(0)}</span>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{comment.user.full_name}</span>
          <span style={{ fontSize: 11, color: '#A3ACBA' }}>{comment.user.role.replace(/_/g, ' ')}</span>
          {comment.internal && (
            <span style={{ fontSize: 10.5, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#FFF7ED', color: '#C2410C', border: '1px solid #FED7AA' }}>Internal</span>
          )}
          <span style={{ marginLeft: 'auto', fontSize: 11, color: '#A3ACBA' }}>{formatRelative(comment.created_at)}</span>
        </div>
        <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{comment.body}</p>
      </div>
    </div>
  )
}

// ── Activity ──────────────────────────────────────────────────────────────────
function ActivityItem({ activity }: { activity: TicketActivity }) {
  const meta = activity.metadata as Record<string, string>
  const labels: Record<string, string> = {
    created:        'Ticket created',
    status_changed: `Status changed to ${meta.to ?? ''}`,
    assigned:       `Assigned to ${meta.to_user_name ?? 'agent'}`,
    escalated:      'Escalated — SLA breached',
    sla_breached:   'SLA breached',
    sla_warning:    'SLA warning — deadline approaching',
    ai_classified:  'AI classified ticket',
  }

  return (
    <div style={{ display: 'flex', gap: 10, padding: '10px 20px' }}>
      <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#F8FAFC', border: '1px solid rgba(15,23,42,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <circle cx="5.5" cy="5.5" r="4" stroke="#A3ACBA" strokeWidth="1.2" />
          <path d="M5.5 3.5v2.5l1.5 1" stroke="#A3ACBA" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </div>
      <div>
        <p style={{ fontSize: 12, color: '#475569' }}>{labels[activity.action] ?? activity.action.replace(/_/g, ' ')}</p>
        <p style={{ fontSize: 11, color: '#A3ACBA', marginTop: 2 }}>{formatRelative(activity.created_at)}</p>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function TicketsShow({
  ticket, can_resolve, can_assign: _can_assign, can_internal, agent_action,
}: TicketsShowProps) {
  const [commentBody, setCommentBody] = useState('')
  const [isInternal, setIsInternal]   = useState(false)
  const [activeTab, setActiveTab]     = useState<'all' | 'internal' | 'external'>('all')

  useActionCable(
    { channel: 'TicketsChannel', ticket_id: ticket.id },
    useCallback(() => { router.reload({ only: ['ticket', 'agent_action'] }) }, [])
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

  function acceptRagSuggestion(text: string) {
    setCommentBody(text)
    setTimeout(() => {
      document.querySelector('textarea')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }

  return (
    <AppLayout title={ticket.ticket_number}>
      {/* Breadcrumb + actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <button onClick={() => router.get('/tickets')}
            style={{ background: 'none', border: 'none', color: '#A3ACBA', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Tickets
          </button>
          <span style={{ color: '#E2E8F0' }}>/</span>
          <span style={{ color: '#0F172A', fontWeight: 500 }}>{ticket.ticket_number}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {can_resolve && ticket.status !== 'resolved' && ticket.status !== 'closed' && (
            <button
              onClick={() => router.post(`/tickets/${ticket.id}/resolve`)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 18px', background: '#028090', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M2 6.5l3 3 6-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Resolve Ticket
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24 }}>
        {/* Left column */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header card */}
          <div style={{ ...CARD, padding: 24, marginBottom: 16 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 13, fontWeight: 700, padding: '4px 10px', borderRadius: 8, background: 'rgba(2,128,144,0.08)', color: '#028090', fontFamily: 'monospace' }}>
                {ticket.ticket_number}
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: statusCfg.bg, color: statusCfg.text }}>{statusCfg.label}</span>
              <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: `${priorityColor}15`, color: priorityColor, textTransform: 'capitalize' }}>{ticket.priority}</span>
              <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 20, background: '#F1F5F9', color: '#64748B', textTransform: 'capitalize' }}>{ticket.category}</span>
            </div>
            <h1 style={{ fontSize: 19, fontWeight: 700, color: '#0F172A', marginBottom: 16, lineHeight: 1.4 }}>{ticket.title}</h1>
            <p style={{ ...LABEL, marginBottom: 8 }}>Description</p>
            <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{ticket.description ?? 'No description provided.'}</p>
          </div>

          {/* AI Pipeline (only when classifying) */}
          {ticket.status === 'pending_classification' && <AiPipelineCard />}

          {/* Agent Orchestrator approval card (human-in-the-loop) */}
          {agent_action && agent_action.status === 'pending_approval' && (
            <AgentApprovalCard agentAction={agent_action} ticketId={ticket.id} />
          )}

          {/* RAG Suggested Response (from orchestrator result) */}
          {agent_action && agent_action.ai_reasoning && agent_action.status === 'pending_approval' && (
            <RagSuggestionCard agentAction={agent_action} onAccept={acceptRagSuggestion} />
          )}

          {/* XAI Panel */}
          <XaiPanel ticket={ticket} />

          {/* Comments */}
          <div style={{ ...CARD }}>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(15,23,42,0.06)', padding: '0 20px' }}>
              {(['all', 'internal', 'external'] as const).map(tab => {
                const tabLabels = { all: 'All Activity', internal: 'Internal Notes', external: 'External' }
                return (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    style={{ padding: '13px 4px', marginRight: 24, fontSize: 13, fontWeight: 500, border: 'none', background: 'none', cursor: 'pointer', borderBottom: activeTab === tab ? '2px solid #028090' : '2px solid transparent', color: activeTab === tab ? '#028090' : '#64748B', transition: 'color 120ms ease' }}>
                    {tabLabels[tab]}
                  </button>
                )
              })}
            </div>

            {visibleComments.length === 0 && activeTab !== 'all' && (
              <p style={{ padding: '24px 20px', fontSize: 13, color: '#A3ACBA', textAlign: 'center' }}>No {activeTab} comments yet.</p>
            )}
            {visibleComments.map(c => <CommentItem key={c.id} comment={c} />)}

            {activeTab === 'all' && ticket.activities.length > 0 && (
              <div style={{ paddingTop: 4, paddingBottom: 4 }}>
                {ticket.activities.map(a => <ActivityItem key={a.id} activity={a} />)}
              </div>
            )}

            {/* Reply box */}
            <div style={{ borderTop: '1px solid rgba(15,23,42,0.06)', padding: 20 }}>
              <form onSubmit={submitComment}>
                <textarea
                  value={commentBody}
                  onChange={e => setCommentBody(e.target.value)}
                  placeholder="Write a reply or internal note..."
                  rows={3}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid rgba(15,23,42,0.12)', borderRadius: 8, fontSize: 13, resize: 'none', outline: 'none', color: '#0F172A', boxSizing: 'border-box', transition: 'border-color 120ms ease', lineHeight: 1.6 }}
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                  <div>
                    {can_internal && (
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B', cursor: 'pointer' }}>
                        <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} />
                        Internal note
                      </label>
                    )}
                  </div>
                  <button type="submit" disabled={!commentBody.trim()}
                    style={{ padding: '7px 18px', background: '#028090', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', cursor: commentBody.trim() ? 'pointer' : 'default', opacity: commentBody.trim() ? 1 : 0.4, transition: 'opacity 120ms ease' }}>
                    Send
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ width: 268, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* SLA */}
          <div style={{ ...CARD, padding: 16, borderColor: ticket.sla_status === 'breached' ? 'rgba(239,68,68,0.25)' : 'rgba(15,23,42,0.08)', background: ticket.sla_status === 'breached' ? '#FEF2F2' : '#fff' }}>
            <p style={{ ...LABEL, color: ticket.sla_status === 'breached' ? '#DC2626' : '#A3ACBA', marginBottom: 8 }}>
              {ticket.sla_status === 'breached' ? 'SLA Breached' : 'SLA Deadline'}
            </p>
            {ticket.sla_status === 'breached' ? (
              <>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#DC2626' }}>Breached</p>
                <p style={{ fontSize: 11, color: '#A3ACBA', marginTop: 4 }}>Opened {formatRelative(ticket.created_at)}</p>
              </>
            ) : ticket.due_at ? (
              <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{new Date(ticket.due_at).toLocaleString()}</p>
            ) : (
              <p style={{ fontSize: 13, color: '#A3ACBA' }}>No SLA set</p>
            )}
          </div>

          {/* Details */}
          <div style={{ ...CARD, padding: 16 }}>
            <p style={{ ...LABEL, marginBottom: 16 }}>Ticket Details</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Assignee */}
              <div>
                <p style={{ fontSize: 11, color: '#A3ACBA', marginBottom: 6 }}>Assigned To</p>
                {ticket.assigned_to ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#028090', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ color: '#fff', fontSize: 11, fontWeight: 600 }}>{ticket.assigned_to.full_name.charAt(0)}</span>
                    </div>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#0F172A' }}>{ticket.assigned_to.full_name}</p>
                      <p style={{ fontSize: 11, color: '#A3ACBA', textTransform: 'capitalize' }}>{ticket.assigned_to.role.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                ) : <span style={{ fontSize: 12, color: '#A3ACBA', fontStyle: 'italic' }}>Unassigned</span>}
              </div>

              {/* Requester */}
              <div>
                <p style={{ fontSize: 11, color: '#A3ACBA', marginBottom: 6 }}>Requested By</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ color: '#fff', fontSize: 11, fontWeight: 600 }}>{ticket.created_by.full_name.charAt(0)}</span>
                  </div>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#0F172A' }}>{ticket.created_by.full_name}</p>
                    <p style={{ fontSize: 11, color: '#A3ACBA', textTransform: 'capitalize' }}>{ticket.created_by.role.replace(/_/g, ' ')}</p>
                  </div>
                </div>
              </div>

              {/* Metadata rows */}
              {([
                { label: 'Department', value: ticket.department.name },
                { label: 'Category',   value: ticket.category },
                { label: 'Priority',   value: ticket.priority, color: priorityColor },
                { label: 'Status',     value: statusCfg.label, color: statusCfg.text },
                { label: 'Created',    value: new Date(ticket.created_at).toLocaleDateString() },
              ] as Array<{ label: string; value: string; color?: string }>).map(({ label, value, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: '#A3ACBA', width: 76, flexShrink: 0 }}>{label}</span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: color ?? '#0F172A', textTransform: 'capitalize' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          {ticket.ai_metadata?.tags && ticket.ai_metadata.tags.length > 0 && (
            <div style={{ ...CARD, padding: 16 }}>
              <p style={{ ...LABEL, marginBottom: 10 }}>AI Tags</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {ticket.ai_metadata.tags.map(tag => (
                  <span key={tag} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#F1F5F9', color: '#64748B' }}>{tag}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}