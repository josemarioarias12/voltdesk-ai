import { useState, useEffect } from 'react'
import { router, useForm } from '@inertiajs/react'
import type { TicketsNewProps, TicketPriority } from '@/types/tickets'
import { useVoiceTicket } from '@/hooks/useVoiceTicket'
import AppLayout from '@/components/AppLayout'

// ── Design tokens ─────────────────────────────────────────────────────────────
const CARD: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  border: '1px solid rgba(15,23,42,0.08)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.05)',
}

const INPUT: React.CSSProperties = {
  width: '100%',
  padding: '9px 14px',
  border: '1px solid rgba(15,23,42,0.12)',
  borderRadius: 8,
  fontSize: 13,
  color: '#0F172A',
  outline: 'none',
  boxSizing: 'border-box',
  background: '#fff',
}

const LABEL_STYLE: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: '#0F172A',
  marginBottom: 6,
}

// ── Constants ─────────────────────────────────────────────────────────────────
const PRIORITY_QUICK: Array<{ value: TicketPriority; label: string; color: string; bg: string }> = [
  { value: 'low',      label: 'Low',      color: '#6B7280', bg: '#F1F5F9' },
  { value: 'medium',   label: 'Medium',   color: '#CA8A04', bg: '#FEF9C3' },
  { value: 'high',     label: 'High',     color: '#EA580C', bg: '#FFF7ED' },
  { value: 'critical', label: 'Critical', color: '#DC2626', bg: '#FEF2F2' },
]

const DEPT_QUICK = ['IT', 'HR', 'Facilities', 'Finance', 'Operations', 'General']

// ── Mic icon ──────────────────────────────────────────────────────────────────
function MicIcon() {
  return (
    <svg width="28" height="28" fill="none" stroke="rgba(255,255,255,0.95)" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function TicketsNew({ departments, recent_tickets }: TicketsNewProps) {
  const {
    transcript, interimTranscript, voiceState,
    isSupported, startListening, stopListening,
    resetTranscript, errorMessage,
  } = useVoiceTicket('es-ES')

  const { data, setData, post, processing, errors } = useForm({
    title:         '',
    description:   '',
    department_id: '',
    priority:      '' as TicketPriority | '',
    source:        'web' as 'web' | 'voice',
  })

  const [dragOver, setDragOver]           = useState(false)
  const [selectedDeptQuick, setDeptQuick] = useState<string | null>(null)

  useEffect(() => {
    if (transcript) { setData('title', transcript); setData('source', 'voice') }
  }, [transcript])

  function handleVoiceClick() {
    if (voiceState === 'listening') { stopListening() }
    else { resetTranscript(); startListening() }
  }

  function handleDeptQuick(dept: string) {
    setDeptQuick(dept)
    const found = departments.find(d => d.name.toLowerCase() === dept.toLowerCase())
    if (found) setData('department_id', String(found.id))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    post('/tickets')
  }

  const isListening = voiceState === 'listening'

  const recentStatusColors: Record<string, string> = {
    open: '#16A34A', in_progress: '#2563EB', resolved: '#9333EA', pending: '#CA8A04',
  }

  return (
    <AppLayout title="New Ticket">
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 20 }}>
        <button onClick={() => router.get('/tickets')}
          style={{ background: 'none', border: 'none', color: '#A3ACBA', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Tickets
        </button>
        <span style={{ color: '#E2E8F0' }}>/</span>
        <span style={{ color: '#0F172A', fontWeight: 500 }}>New Ticket</span>
      </div>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A' }}>New Ticket</h1>
        <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Describe your issue and our AI will classify and route it automatically</p>
      </div>

      <div style={{ display: 'flex', gap: 24 }}>
        {/* Left: form */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Voice panel — intentionally keeps teal gradient */}
          <div style={{ background: 'linear-gradient(135deg,#028090,#026E7A)', borderRadius: 12, marginBottom: 12, overflow: 'hidden' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 24px' }}>
              <button onClick={handleVoiceClick} disabled={!isSupported}
                style={{
                  width: 64, height: 64, borderRadius: '50%', border: 'none',
                  background: isListening ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.2)',
                  cursor: isSupported ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 14,
                  transform: isListening ? 'scale(1.1)' : 'scale(1)',
                  transition: 'all 200ms ease',
                }}>
                <MicIcon />
              </button>
              <p style={{ color: '#fff', fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                {isListening ? 'Listening… click to stop' : 'Click to describe your issue by voice'}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>
                Powered by Web Speech API — audio stays on your device
              </p>
              {!isSupported && (
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 8, background: 'rgba(255,255,255,0.1)', padding: '5px 14px', borderRadius: 20 }}>
                  Voice input requires Chrome or Edge
                </p>
              )}
            </div>
          </div>

          {/* Transcript display */}
          <div style={{ ...CARD, padding: '12px 16px', marginBottom: 10, minHeight: 46 }}>
            {data.title || interimTranscript ? (
              <p style={{ fontSize: 13, color: '#0F172A' }}>{data.title || interimTranscript}</p>
            ) : (
              <p style={{ fontSize: 13, color: '#A3ACBA', fontStyle: 'italic' }}>Your speech will appear here in real time...</p>
            )}
          </div>

          {/* Voice state indicators */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20, padding: '0 4px' }}>
            {(['idle', 'listening', 'processing'] as const).map(state => {
              const dotColors = { idle: '#A3ACBA', listening: '#EF4444', processing: '#F97316' }
              const isActive  = voiceState === state
              return (
                <div key={state} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: isActive ? dotColors[state] : '#E2E8F0', display: 'inline-block' }} />
                  <span style={{ fontSize: 12, color: isActive ? '#0F172A' : '#A3ACBA', fontWeight: isActive ? 500 : 400, textTransform: 'capitalize' }}>{state}</span>
                </div>
              )
            })}
            <span style={{ marginLeft: 'auto', fontSize: 12, color: '#A3ACBA' }}>
              Current: <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{voiceState}</span>
            </span>
          </div>

          {errorMessage && (
            <div style={{ marginBottom: 16, padding: '10px 14px', background: '#FEF2F2', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, fontSize: 13, color: '#DC2626' }}>
              {errorMessage}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(15,23,42,0.06)' }} />
            <span style={{ fontSize: 12, color: '#A3ACBA' }}>or type your request below</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(15,23,42,0.06)' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Title */}
            <div>
              <label style={LABEL_STYLE}>
                Title <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="text"
                value={data.title}
                onChange={e => setData('title', e.target.value)}
                placeholder='Brief summary, e.g. "Laptop not connecting to VPN"'
                required
                style={INPUT}
              />
              {errors.title && <p style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>{errors.title}</p>}
            </div>

            {/* Description */}
            <div>
              <label style={LABEL_STYLE}>Description</label>
              <textarea
                value={data.description}
                onChange={e => setData('description', e.target.value)}
                placeholder="Describe the issue in detail..."
                rows={5}
                style={{ ...INPUT, resize: 'none', lineHeight: 1.6 }}
              />
            </div>

            {/* Department + Priority */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={LABEL_STYLE}>
                  Department <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <select
                  value={data.department_id}
                  onChange={e => setData('department_id', e.target.value)}
                  required
                  style={INPUT}
                >
                  <option value="">Select department...</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
                  {DEPT_QUICK.map(dept => (
                    <button key={dept} type="button" onClick={() => handleDeptQuick(dept)}
                      style={{
                        fontSize: 11, padding: '3px 10px', borderRadius: 20, border: '1px solid', cursor: 'pointer',
                        borderColor: selectedDeptQuick === dept ? '#028090' : 'rgba(15,23,42,0.12)',
                        background: selectedDeptQuick === dept ? '#028090' : 'transparent',
                        color: selectedDeptQuick === dept ? '#fff' : '#64748B',
                        transition: 'all 120ms ease',
                      }}>
                      {dept}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={LABEL_STYLE}>Priority</label>
                <select
                  value={data.priority}
                  onChange={e => setData('priority', e.target.value as TicketPriority)}
                  style={INPUT}
                >
                  <option value="">Select priority...</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
                <div style={{ display: 'flex', gap: 5, marginTop: 8, flexWrap: 'wrap' }}>
                  {PRIORITY_QUICK.map(p => (
                    <button key={p.value} type="button" onClick={() => setData('priority', p.value)}
                      style={{
                        fontSize: 11, padding: '3px 10px', borderRadius: 20, border: '1px solid', cursor: 'pointer', fontWeight: 500,
                        borderColor: data.priority === p.value ? p.color : 'rgba(15,23,42,0.12)',
                        background: data.priority === p.value ? p.bg : 'transparent',
                        color: data.priority === p.value ? p.color : '#64748B',
                        transition: 'all 120ms ease',
                      }}>
                      {p.label}
                    </button>
                  ))}
                </div>
                <p style={{ fontSize: 11, color: '#A3ACBA', marginTop: 6 }}>AI will adjust priority after classification</p>
              </div>
            </div>

            {/* Attachments */}
            <div>
              <label style={LABEL_STYLE}>Attachments</label>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false) }}
                style={{
                  border: `2px dashed ${dragOver ? '#028090' : 'rgba(15,23,42,0.12)'}`,
                  borderRadius: 8, padding: '28px 24px', textAlign: 'center',
                  background: dragOver ? 'rgba(2,128,144,0.04)' : '#FAFAFA',
                  cursor: 'pointer', transition: 'all 120ms ease',
                }}>
                <svg width="24" height="24" fill="none" stroke="#A3ACBA" viewBox="0 0 24 24" style={{ marginBottom: 8 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p style={{ fontSize: 13, color: '#64748B', marginBottom: 4 }}>Drag and drop files here</p>
                <button type="button"
                  style={{ padding: '6px 16px', border: '1px solid rgba(15,23,42,0.12)', borderRadius: 8, fontSize: 12, color: '#64748B', background: '#fff', cursor: 'pointer', marginTop: 4 }}>
                  Browse files
                </button>
                <p style={{ fontSize: 11, color: '#A3ACBA', marginTop: 8 }}>PNG, JPG, PDF, TXT up to 10MB</p>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={processing || !data.title || !data.department_id}
              style={{
                width: '100%', padding: '12px', background: '#028090', border: 'none',
                borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#fff',
                cursor: processing || !data.title || !data.department_id ? 'default' : 'pointer',
                opacity: processing || !data.title || !data.department_id ? 0.5 : 1,
                transition: 'opacity 120ms ease',
              }}>
              {processing ? 'Creating…' : 'Create Ticket — AI Classification Starts Immediately'}
            </button>

            <div style={{ textAlign: 'center' }}>
              <button type="button" onClick={() => router.get('/tickets')}
                style={{ background: 'none', border: 'none', fontSize: 13, color: '#A3ACBA', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Right sidebar */}
        <div style={{ width: 252, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* AI detection — intentionally keeps teal gradient */}
          <div style={{ borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 4px 16px rgba(2,128,144,0.15)' }}>
            <div style={{ background: 'linear-gradient(135deg,#028090,#026E7A)', padding: '12px 16px' }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M6.5 1l1.2 2.5L10.5 4l-2 2 .5 2.8L6.5 7.5 4 8.8l.5-2.8-2-2 2.8-.5z" stroke="#fff" strokeWidth="1.2" strokeLinejoin="round" />
                </svg>
                AI will automatically detect
              </p>
            </div>
            <div style={{ background: 'linear-gradient(135deg,#028090,#026E7A)', padding: '10px 16px 16px' }}>
              {[
                'Category and department routing',
                'Urgency score 0–100',
                'Similar resolved tickets',
                'Suggested response for agents',
                'SLA deadline based on priority',
              ].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
                  <div style={{ width: 15, height: 15, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1.5 4l1.5 1.5L6.5 2" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div style={{ ...CARD, padding: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="5.5" stroke="#028090" strokeWidth="1.3" />
                <path d="M7 5v2.5M7 9h.01" stroke="#028090" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              Tips for faster resolution
            </p>
            {[
              'Be specific — include error messages, device names, and affected users.',
              'Attach screenshots or logs to help AI and agents diagnose faster.',
              'Mention urgency context (e.g. "month-close in 2 hours") to trigger Critical priority.',
            ].map((tip, i) => (
              <p key={i} style={{ fontSize: 12, color: '#64748B', lineHeight: 1.6, marginBottom: 8 }}>{tip}</p>
            ))}
          </div>

          {/* Recent tickets */}
          {recent_tickets.length > 0 && (
            <div style={{ ...CARD, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Your recent tickets</span>
                <button onClick={() => router.get('/tickets')}
                  style={{ background: 'none', border: 'none', fontSize: 12, fontWeight: 500, color: '#028090', cursor: 'pointer' }}>
                  View all
                </button>
              </div>
              {recent_tickets.map(t => (
                <button key={t.id} onClick={() => router.get(`/tickets/${t.id}`)}
                  style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 8px', borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', marginBottom: 3, transition: 'background 120ms ease' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#F8FAFC' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                >
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#028090', fontFamily: 'monospace' }}>{t.ticket_number}</p>
                    <p style={{ fontSize: 12, color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 136 }}>{t.title}</p>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 500, color: recentStatusColors[t.status] ?? '#A3ACBA', textTransform: 'capitalize' }}>
                    {t.status.replace(/_/g, ' ')}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}