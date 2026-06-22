import { useState, useCallback, useEffect, useRef } from 'react'
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
  border: '1px solid rgba(15,23,42,0.06)',
  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
}

const LABEL: React.CSSProperties = {
  fontSize: 10.5,
  fontWeight: 600,
  color: '#94A3B8',
  textTransform: 'uppercase',
  letterSpacing: '0.09em',
}

const DIVIDER: React.CSSProperties = {
  height: 1,
  background: 'rgba(15,23,42,0.05)',
  margin: '0',
}

const PRIORITY_COLORS: Record<TicketPriority, string> = {
  critical: '#DC2626', high: '#EA580C', medium: '#D97706', low: '#6B7280',
}

const PRIORITY_BG: Record<TicketPriority, string> = {
  critical: '#FEF2F2', high: '#FFF7ED', medium: '#FFFBEB', low: '#F8FAFC',
}

const STATUS_CFG: Record<TicketStatus, { label: string; bg: string; text: string; dot: string }> = {
  open:                   { label: 'Open',        bg: '#F0FDF4', text: '#15803D', dot: '#22C55E' },
  in_progress:            { label: 'In Progress', bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6' },
  pending:                { label: 'Pending',     bg: '#FEFCE8', text: '#A16207', dot: '#EAB308' },
  resolved:               { label: 'Resolved',    bg: '#F0FDF4', text: '#15803D', dot: '#22C55E' },
  closed:                 { label: 'Closed',      bg: '#F8FAFC', text: '#475569', dot: '#94A3B8' },
  pending_classification: { label: 'Classifying', bg: '#FAF5FF', text: '#7C3AED', dot: '#A855F7' },
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  if (h < 24) return `${h}h ago`
  return `${d}d ago`
}

// ── AI Pipeline Card ──────────────────────────────────────────────────────────
const PIPELINE_STEPS = [
  { label: 'Analyzing ticket text', detail: 'Extracting keywords and intent' },
  { label: 'Searching similar tickets', detail: 'Scanning resolved ticket embeddings' },
  { label: 'Determining priority', detail: 'Scoring urgency 0–100' },
  { label: 'Generating suggested response', detail: 'RAG pipeline with top 3 precedents' },
  { label: 'Finalizing classification', detail: 'Writing to ticket record' },
]

function AiPipelineCard() {
  const [activeStep, setActiveStep] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setActiveStep(prev => (prev < PIPELINE_STEPS.length - 1 ? prev + 1 : prev))
    }, 2200)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  const progress = Math.round(((activeStep + 1) / PIPELINE_STEPS.length) * 100)

  return (
    <div style={{ ...CARD, marginBottom: 12, borderLeft: '3px solid #7C3AED', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative', width: 8, height: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#7C3AED' }} />
            <div style={{ position: 'absolute', inset: -3, borderRadius: '50%', border: '2px solid rgba(124,58,237,0.25)', animation: 'ping 1.8s ease-in-out infinite' }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#7C3AED' }}>AI Classification Pipeline</span>
          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#FAF5FF', color: '#7C3AED', border: '1px solid rgba(124,58,237,0.15)' }}>
            GPT-4o
          </span>
        </div>
        <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>
          {activeStep + 1} / {PIPELINE_STEPS.length}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ height: 2, background: 'rgba(124,58,237,0.1)', margin: '0 20px' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: '#7C3AED', borderRadius: 1, transition: 'width 600ms ease' }} />
      </div>

      {/* Steps */}
      <div style={{ padding: '12px 20px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {PIPELINE_STEPS.map((step, idx) => {
          const done    = idx < activeStep
          const current = idx === activeStep
          return (
            <div key={step.label} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderRadius: 8,
              background: current ? '#7C3AED' : done ? 'rgba(124,58,237,0.04)' : 'transparent',
              transition: 'background 300ms ease',
            }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: done ? '#7C3AED' : current ? 'rgba(255,255,255,0.2)' : 'rgba(15,23,42,0.05)',
              }}>
                {done ? (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: current ? '#fff' : '#CBD5E1' }} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: current ? 600 : 400, color: current ? '#fff' : done ? '#7C3AED' : '#94A3B8', lineHeight: 1.3 }}>
                  {step.label}
                </p>
                {current && (
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>{step.detail}</p>
                )}
              </div>
              {current && (
                <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.6)', animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
      <style>{`
        @keyframes ping { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.8);opacity:0} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
      `}</style>
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
    <div style={{ ...CARD, marginBottom: 12, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '13px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: collapsed ? 'none' : '1px solid rgba(15,23,42,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(2,128,144,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM7 4v3.5l2.5 1.5" stroke="#028090" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>AI Classification Reasoning</p>
            <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>Powered by GPT-4o · {confidencePct}% confidence</p>
          </div>
        </div>
        <button onClick={() => setCollapsed(!collapsed)}
          style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: '1px solid rgba(15,23,42,0.08)', borderRadius: 6, padding: '4px 10px', fontSize: 11, color: '#64748B', cursor: 'pointer', fontWeight: 500 }}>
          {collapsed ? 'Expand' : 'Collapse'}
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d={collapsed ? 'M2 3.5l3 3 3-3' : 'M2 6.5l3-3 3 3'} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {!collapsed && (
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Signals */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <p style={{ ...LABEL, marginBottom: 8 }}>Category signals</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {category_signals.map(s => (
                  <span key={s} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: 'rgba(2,128,144,0.07)', color: '#028090', border: '1px solid rgba(2,128,144,0.12)', fontWeight: 500 }}>{s}</span>
                ))}
              </div>
            </div>
            <div>
              <p style={{ ...LABEL, marginBottom: 8 }}>Priority signals</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {priority_signals.map(s => (
                  <span key={s} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: '#FFF7ED', border: '1px solid rgba(234,88,12,0.15)', color: '#C2410C', fontWeight: 500 }}>{s}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Confidence */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <p style={LABEL}>Confidence score</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 20, fontWeight: 700, color: isHigh ? '#15803D' : '#DC2626', lineHeight: 1 }}>{confidencePct}%</span>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: isHigh ? '#F0FDF4' : '#FEF2F2', color: isHigh ? '#15803D' : '#DC2626', fontWeight: 600 }}>
                  {isHigh ? 'High' : 'Low'}
                </span>
              </div>
            </div>
            <div style={{ height: 6, background: '#F1F5F9', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${confidencePct}%`, background: isHigh ? '#22C55E' : '#EF4444', borderRadius: 3, transition: 'width 800ms ease' }} />
            </div>
            {!isHigh && (
              <p style={{ fontSize: 11, color: '#DC2626', marginTop: 6, fontWeight: 500 }}>Manual review recommended — confidence below threshold</p>
            )}
          </div>

          {/* Similar ticket */}
          {similar_ticket && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 8, background: '#F8FAFC', border: '1px solid rgba(15,23,42,0.06)' }}>
              <div>
                <p style={{ ...LABEL, marginBottom: 3 }}>Similar ticket reference</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#028090', fontFamily: 'monospace' }}>{similar_ticket}</span>
                  <span style={{ fontSize: 12, color: '#64748B' }}>— Similar issue, resolved</span>
                </div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: '#F0FDF4', color: '#15803D', border: '1px solid rgba(21,128,61,0.15)' }}>Resolved</span>
            </div>
          )}

          {/* Correction rate */}
          {ticket.correction_rate && ticket.correction_rate.times_corrected > 0 && (
            <div style={{ padding: '10px 14px', borderRadius: 8, background: ticket.correction_rate.times_corrected > 5 ? '#FFFBEB' : '#F8FAFC', border: `1px solid ${ticket.correction_rate.times_corrected > 5 ? 'rgba(217,119,6,0.2)' : 'rgba(15,23,42,0.06)'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: '#475569' }}>
                  Category <strong style={{ color: '#028090' }}>{ticket.correction_rate.category}</strong> corrected <strong>{ticket.correction_rate.times_corrected}×</strong> in this workspace
                </span>
                {ticket.correction_rate.times_corrected > 5 && (
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#FEF3C7', color: '#D97706', flexShrink: 0 }}>High rate</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── RAG Suggestion Card ───────────────────────────────────────────────────────
function RagSuggestionCard({ agentAction, onAccept }: { agentAction: AgentActionPending; onAccept: (text: string) => void }) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed || !agentAction.ai_reasoning) return null

  return (
    <div style={{ ...CARD, marginBottom: 12, borderLeft: '3px solid #02C39A', overflow: 'hidden' }}>
      <div style={{ padding: '13px 20px', borderBottom: '1px solid rgba(15,23,42,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(2,195,154,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1l1.5 3 3.5.5-2.5 2.4.6 3.6L7 8.9l-3.1 1.6.6-3.6L2 4.5 5.5 4z" stroke="#02C39A" strokeWidth="1.3" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>AI Suggested Response</p>
            <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>
              {Math.round(agentAction.top_similarity * 100)}% similarity match · based on {agentAction.similar_tickets.length} resolved tickets
            </p>
          </div>
        </div>
        <button onClick={() => setDismissed(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: 18, lineHeight: 1, padding: '2px 6px' }}>×</button>
      </div>
      <div style={{ padding: '14px 20px', fontSize: 13, color: '#374151', lineHeight: 1.75, whiteSpace: 'pre-line', background: 'rgba(2,195,154,0.02)' }}>
        {agentAction.ai_reasoning}
      </div>
      <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(15,23,42,0.05)', display: 'flex', gap: 8 }}>
        <button onClick={() => onAccept(agentAction.ai_reasoning)}
          style={{ padding: '7px 16px', background: '#028090', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>
          Accept Response
        </button>
        <button onClick={() => onAccept(agentAction.ai_reasoning)}
          style={{ padding: '7px 16px', background: '#fff', border: '1px solid rgba(15,23,42,0.1)', borderRadius: 8, fontSize: 12, fontWeight: 500, color: '#475569', cursor: 'pointer' }}>
          Edit Before Sending
        </button>
      </div>
    </div>
  )
}

// ── Agent Approval Card ───────────────────────────────────────────────────────
function AgentApprovalCard({ agentAction }: { agentAction: AgentActionPending }) {
  const confidencePct = Math.round(agentAction.confidence * 100)

  return (
    <div style={{ ...CARD, marginBottom: 12, borderLeft: '3px solid #F59E0B', overflow: 'hidden' }}>
      <div style={{ padding: '13px 20px', borderBottom: '1px solid rgba(15,23,42,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="5.5" stroke="#D97706" strokeWidth="1.4" />
              <path d="M7 4.5v3M7 9.5h.01" stroke="#D97706" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>AI Agent Awaiting Approval</p>
            <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>Human-in-the-loop · {formatRelative(agentAction.created_at)}</p>
          </div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: '#FFFBEB', color: '#D97706', border: '1px solid rgba(217,119,6,0.2)' }}>
          {confidencePct}% confidence
        </span>
      </div>

      <div style={{ padding: '14px 20px' }}>
        <p style={{ ...LABEL, marginBottom: 10 }}>Proposed actions</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
          {[
            { icon: (
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M2 6.5l3 3 6-6" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ), label: 'Auto-resolve ticket using RAG response' },
            { icon: (
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M2 3h9M2 6.5h9M2 10h6" stroke="#6B7280" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            ), label: 'Post suggested response as public comment' },
            { icon: (
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M6.5 1.5a5 5 0 100 10 5 5 0 000-10zM6.5 4v3l2 1" stroke="#6B7280" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ), label: 'Notify requester of resolution' },
          ].map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, background: '#F8FAFC', border: '1px solid rgba(15,23,42,0.05)' }}>
              <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>{item.icon}</span>
              <span style={{ fontSize: 12, color: '#374151' }}>{item.label}</span>
            </div>
          ))}
        </div>

        {agentAction.similar_tickets.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ ...LABEL, marginBottom: 8 }}>Based on</p>
            {agentAction.similar_tickets.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(15,23,42,0.04)' }}>
                <span style={{ fontSize: 12, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}>{t.title}</span>
                <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500, flexShrink: 0 }}>{Math.round(t.similarity * 100)}%</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => router.patch(`/agent_actions/${agentAction.id}/ticket_approve`)}
            style={{ flex: 1, padding: '10px 0', background: '#028090', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>
            Approve & Execute
          </button>
          <button onClick={() => router.patch(`/agent_actions/${agentAction.id}/ticket_reject`)}
            style={{ flex: 1, padding: '10px 0', background: '#fff', border: '1px solid rgba(220,38,38,0.25)', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#DC2626', cursor: 'pointer' }}>
            Reject
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Comment ───────────────────────────────────────────────────────────────────
function CommentItem({ comment }: { comment: TicketComment }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '16px 20px', borderBottom: '1px solid rgba(15,23,42,0.04)' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: comment.internal ? '#F59E0B' : '#028090', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>{comment.user.full_name.charAt(0)}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{comment.user.full_name}</span>
          <span style={{ fontSize: 11, color: '#94A3B8', textTransform: 'capitalize' }}>{comment.user.role.replace(/_/g, ' ')}</span>
          {comment.internal && (
            <span style={{ fontSize: 10.5, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: '#FEF3C7', color: '#D97706', border: '1px solid rgba(217,119,6,0.2)' }}>Internal</span>
          )}
          <span style={{ marginLeft: 'auto', fontSize: 11, color: '#94A3B8' }}>{formatRelative(comment.created_at)}</span>
        </div>
        <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.65, whiteSpace: 'pre-line' }}>{comment.body}</p>
      </div>
    </div>
  )
}

// ── Activity ──────────────────────────────────────────────────────────────────
function ActivityItem({ activity }: { activity: TicketActivity }) {
  const meta = activity.metadata as Record<string, string>
  const labels: Record<string, string> = {
    created:        'Ticket created',
    status_changed: `Status → ${meta.to ?? ''}`,
    assigned:       `Assigned to ${meta.to_user_name ?? 'agent'}`,
    escalated:      'Escalated — SLA breached',
    sla_breached:   'SLA breached',
    sla_warning:    'SLA warning — deadline approaching',
    ai_classified:  'AI classified ticket',
  }

  return (
    <div style={{ display: 'flex', gap: 10, padding: '9px 20px' }}>
      <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#F8FAFC', border: '1px solid rgba(15,23,42,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <circle cx="5" cy="5" r="3.5" stroke="#CBD5E1" strokeWidth="1.2" />
          <path d="M5 3.5v2l1 .8" stroke="#CBD5E1" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </div>
      <div>
        <p style={{ fontSize: 12, color: '#475569' }}>{labels[activity.action] ?? activity.action.replace(/_/g, ' ')}</p>
        <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{formatRelative(activity.created_at)}</p>
      </div>
    </div>
  )
}

// ── Sidebar metadata row ──────────────────────────────────────────────────────
function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid rgba(15,23,42,0.04)' }}>
      <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500, flexShrink: 0, paddingTop: 1 }}>{label}</span>
      <div style={{ fontSize: 12, fontWeight: 500, color: '#0F172A', textAlign: 'right' }}>{children}</div>
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
  const priorityBg    = PRIORITY_BG[ticket.priority]
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <button onClick={() => router.get('/tickets')}
            style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: 13, padding: 0 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Tickets
          </button>
          <span style={{ color: '#E2E8F0' }}>/</span>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#0F172A', fontFamily: 'monospace' }}>{ticket.ticket_number}</span>
        </div>
        {can_resolve && ticket.status !== 'resolved' && ticket.status !== 'closed' && (
          <button onClick={() => router.post(`/tickets/${ticket.id}/resolve`)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', background: '#028090', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', letterSpacing: '0.01em' }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M2 6.5l3 3 6-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Resolve Ticket
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        {/* Left column */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Header card */}
          <div style={{ ...CARD, padding: '20px 24px', marginBottom: 12 }}>
            {/* Badges row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 6, background: 'rgba(2,128,144,0.07)', color: '#028090', fontFamily: 'monospace', letterSpacing: '0.04em' }}>
                {ticket.ticket_number}
              </span>
              <span style={{ width: 1, height: 16, background: 'rgba(15,23,42,0.1)' }} />
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: statusCfg.bg, color: statusCfg.text }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: statusCfg.dot, flexShrink: 0 }} />
                {statusCfg.label}
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: priorityBg, color: priorityColor, textTransform: 'capitalize' }}>
                {ticket.priority}
              </span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: '#94A3B8' }}>
                {ticket.department.name} · {ticket.category}
              </span>
            </div>

            {/* Title */}
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', lineHeight: 1.35, marginBottom: 16, letterSpacing: '-0.01em' }}>
              {ticket.title}
            </h1>

            <div style={DIVIDER} />
            <p style={{ ...LABEL, margin: '14px 0 8px' }}>Description</p>
            <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.75, whiteSpace: 'pre-line' }}>
              {ticket.description ?? 'No description provided.'}
            </p>
          </div>

          {/* AI Pipeline (classifying) */}
          {ticket.status === 'pending_classification' && <AiPipelineCard />}

          {/* Agent approval */}
          {agent_action?.status === 'pending_approval' && (
            <AgentApprovalCard agentAction={agent_action} />
          )}

          {/* RAG suggestion */}
          {agent_action?.ai_reasoning && agent_action.status === 'pending_approval' && (
            <RagSuggestionCard agentAction={agent_action} onAccept={acceptRagSuggestion} />
          )}

          {/* XAI Panel */}
          <XaiPanel ticket={ticket} />

          {/* Comments card */}
          <div style={{ ...CARD, overflow: 'hidden' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(15,23,42,0.05)', padding: '0 20px' }}>
              {(['all', 'internal', 'external'] as const).map(tab => {
                const tabLabels = { all: 'All Activity', internal: 'Internal Notes', external: 'External' }
                const isActive  = activeTab === tab
                return (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    style={{ padding: '13px 0', marginRight: 24, fontSize: 13, fontWeight: isActive ? 600 : 400, border: 'none', background: 'none', cursor: 'pointer', borderBottom: isActive ? '2px solid #028090' : '2px solid transparent', color: isActive ? '#028090' : '#64748B', transition: 'color 120ms ease' }}>
                    {tabLabels[tab]}
                  </button>
                )
              })}
              <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', fontSize: 12, color: '#94A3B8' }}>
                {visibleComments.length} comment{visibleComments.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Comments */}
            {visibleComments.length === 0 && activeTab !== 'all' && (
              <p style={{ padding: '24px 20px', fontSize: 13, color: '#94A3B8', textAlign: 'center' }}>No {activeTab} comments yet.</p>
            )}
            {visibleComments.map(c => <CommentItem key={c.id} comment={c} />)}

            {activeTab === 'all' && ticket.activities.length > 0 && (
              <div style={{ background: '#FAFAFA', borderTop: '1px solid rgba(15,23,42,0.04)', paddingTop: 4, paddingBottom: 4 }}>
                {ticket.activities.map(a => <ActivityItem key={a.id} activity={a} />)}
              </div>
            )}

            {/* Reply box */}
            <div style={{ borderTop: '1px solid rgba(15,23,42,0.05)', padding: '16px 20px' }}>
              <form onSubmit={submitComment}>
                <textarea
                  value={commentBody}
                  onChange={e => setCommentBody(e.target.value)}
                  placeholder={isInternal ? 'Write an internal note...' : 'Write a reply...'}
                  rows={3}
                  style={{ width: '100%', padding: '10px 14px', border: `1px solid ${isInternal ? 'rgba(217,119,6,0.3)' : 'rgba(15,23,42,0.1)'}`, borderRadius: 8, fontSize: 13, resize: 'none', outline: 'none', color: '#0F172A', boxSizing: 'border-box', lineHeight: 1.6, background: isInternal ? '#FFFBEB' : '#fff', transition: 'border-color 120ms ease' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                  <div>
                    {can_internal && (
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B', cursor: 'pointer', userSelect: 'none' }}>
                        <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} style={{ accentColor: '#F59E0B' }} />
                        Internal note
                      </label>
                    )}
                  </div>
                  <button type="submit" disabled={!commentBody.trim()}
                    style={{ padding: '7px 20px', background: '#028090', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', cursor: commentBody.trim() ? 'pointer' : 'default', opacity: commentBody.trim() ? 1 : 0.4, transition: 'opacity 120ms ease' }}>
                    Send
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* SLA Card */}
          <div style={{ ...CARD, padding: '14px 16px', borderLeft: ticket.sla_status === 'breached' ? '3px solid #DC2626' : ticket.sla_status === 'at_risk' ? '3px solid #F59E0B' : '3px solid #22C55E' }}>
            <p style={{ ...LABEL, marginBottom: 8, color: ticket.sla_status === 'breached' ? '#DC2626' : ticket.sla_status === 'at_risk' ? '#D97706' : '#94A3B8' }}>
              SLA {ticket.sla_status === 'breached' ? 'Breached' : ticket.sla_status === 'at_risk' ? 'At Risk' : 'Deadline'}
            </p>
            {ticket.sla_status === 'breached' ? (
              <div>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#DC2626', letterSpacing: '-0.01em' }}>Breached</p>
                <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>Opened {formatRelative(ticket.created_at)}</p>
              </div>
            ) : ticket.due_at ? (
              <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{new Date(ticket.due_at).toLocaleString()}</p>
            ) : (
              <p style={{ fontSize: 12, color: '#94A3B8' }}>No SLA configured</p>
            )}
          </div>

          {/* Details Card */}
          <div style={{ ...CARD, padding: '14px 16px' }}>
            <p style={{ ...LABEL, marginBottom: 12 }}>Ticket details</p>

            {/* Assignee */}
            <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid rgba(15,23,42,0.04)' }}>
              <p style={{ fontSize: 11, color: '#94A3B8', marginBottom: 7 }}>Assigned to</p>
              {ticket.assigned_to ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#028090', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>{ticket.assigned_to.full_name.charAt(0)}</span>
                  </div>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#0F172A' }}>{ticket.assigned_to.full_name}</p>
                    <p style={{ fontSize: 10.5, color: '#94A3B8', textTransform: 'capitalize' }}>{ticket.assigned_to.role.replace(/_/g, ' ')}</p>
                  </div>
                </div>
              ) : (
                <span style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic' }}>Unassigned</span>
              )}
            </div>

            {/* Requester */}
            <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid rgba(15,23,42,0.04)' }}>
              <p style={{ fontSize: 11, color: '#94A3B8', marginBottom: 7 }}>Requested by</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>{ticket.created_by.full_name.charAt(0)}</span>
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#0F172A' }}>{ticket.created_by.full_name}</p>
                  <p style={{ fontSize: 10.5, color: '#94A3B8', textTransform: 'capitalize' }}>{ticket.created_by.role.replace(/_/g, ' ')}</p>
                </div>
              </div>
            </div>

            {/* Meta rows */}
            <MetaRow label="Department">{ticket.department.name}</MetaRow>
            <MetaRow label="Category"><span style={{ textTransform: 'capitalize' }}>{ticket.category}</span></MetaRow>
            <MetaRow label="Priority">
              <span style={{ color: priorityColor, textTransform: 'capitalize', fontWeight: 600 }}>{ticket.priority}</span>
            </MetaRow>
            <MetaRow label="Status">
              <span style={{ color: statusCfg.text, fontWeight: 600 }}>{statusCfg.label}</span>
            </MetaRow>
            <MetaRow label="Created">
              <span style={{ fontWeight: 400, color: '#64748B' }}>{new Date(ticket.created_at).toLocaleDateString()}</span>
            </MetaRow>
          </div>

          {/* AI Tags */}
          {ticket.ai_metadata?.tags && ticket.ai_metadata.tags.length > 0 && (
            <div style={{ ...CARD, padding: '14px 16px' }}>
              <p style={{ ...LABEL, marginBottom: 10 }}>AI tags</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {ticket.ai_metadata.tags.map(tag => (
                  <span key={tag} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: '#F1F5F9', color: '#475569', fontWeight: 500 }}>{tag}</span>
                ))}
              </div>
            </div>
          )}

          {/* Urgency Score */}
          {ticket.urgency_score > 0 && (
            <div style={{ ...CARD, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <p style={LABEL}>Urgency score</p>
                <span style={{ fontSize: 20, fontWeight: 700, color: ticket.urgency_score >= 80 ? '#DC2626' : ticket.urgency_score >= 60 ? '#D97706' : '#15803D', letterSpacing: '-0.01em' }}>
                  {ticket.urgency_score}
                </span>
              </div>
              <div style={{ height: 6, background: '#F1F5F9', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${ticket.urgency_score}%`, background: ticket.urgency_score >= 80 ? '#EF4444' : ticket.urgency_score >= 60 ? '#F59E0B' : '#22C55E', borderRadius: 3 }} />
              </div>
              <p style={{ fontSize: 10.5, color: '#94A3B8', marginTop: 5 }}>
                {ticket.urgency_score >= 80 ? 'Critical — immediate attention' : ticket.urgency_score >= 60 ? 'Elevated — monitor closely' : 'Normal range'}
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}