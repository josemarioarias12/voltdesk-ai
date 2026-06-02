import { useState, useEffect } from 'react'
import { router, useForm } from '@inertiajs/react'
import type { TicketsNewProps, TicketPriority } from '@/types/tickets'
import { useVoiceTicket } from '@/hooks/useVoiceTicket'
import AppLayout from '@/components/AppLayout'

const PRIORITY_QUICK: Array<{ value: TicketPriority; label: string; color: string; bg: string }> = [
  { value: 'low',      label: 'Low',      color: '#6B7280', bg: '#F1F5F9' },
  { value: 'medium',   label: 'Medium',   color: '#CA8A04', bg: '#FEF9C3' },
  { value: 'high',     label: 'High',     color: '#EA580C', bg: '#FFF7ED' },
  { value: 'critical', label: 'Critical', color: '#DC2626', bg: '#FEF2F2' },
]

const DEPT_QUICK = ['IT', 'HR', 'Facilities', 'Finance', 'Operations', 'General']

export default function TicketsNew({ departments, recent_tickets }: TicketsNewProps) {
  const { transcript, interimTranscript, voiceState, isSupported, startListening, stopListening, resetTranscript, errorMessage } = useVoiceTicket('es-ES')

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
        <button onClick={() => router.get('/tickets')} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>← Tickets</button>
        <span style={{ color: '#E2E8F0' }}>/</span>
        <span style={{ color: '#0F172A', fontWeight: 500 }}>New Ticket</span>
      </div>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A' }}>New Ticket</h1>
        <p style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>Describe your issue and our AI will classify and route it automatically</p>
      </div>

      <div style={{ display: 'flex', gap: 24 }}>
        {/* Left: form */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Voice panel */}
          <div style={{ background: 'linear-gradient(135deg,#028090,#026E7A)', borderRadius: 16, marginBottom: 16, overflow: 'hidden' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 24px' }}>
              <button onClick={handleVoiceClick} disabled={!isSupported}
                style={{ width: 64, height: 64, borderRadius: '50%', border: 'none', background: isListening ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.2)', cursor: isSupported ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, transform: isListening ? 'scale(1.1)' : 'scale(1)', transition: 'all 0.2s' }}>
                <MicIcon />
              </button>
              <p style={{ color: '#fff', fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
                {isListening ? 'Listening… click to stop' : 'Click to describe your issue by voice'}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
                Powered by Web Speech API — audio stays on your device
              </p>
              {!isSupported && (
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 8, background: 'rgba(255,255,255,0.1)', padding: '6px 16px', borderRadius: 20 }}>
                  Voice input requires Chrome or Edge
                </p>
              )}
            </div>
          </div>

          {/* Transcript display */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', padding: '14px 16px', marginBottom: 12, minHeight: 48, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
            {data.title || interimTranscript ? (
              <p style={{ fontSize: 13, color: '#0F172A' }}>{data.title || interimTranscript}</p>
            ) : (
              <p style={{ fontSize: 13, color: '#94A3B8', fontStyle: 'italic' }}>Your speech will appear here in real time...</p>
            )}
          </div>

          {/* Voice state indicators */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20, padding: '0 4px' }}>
            {(['idle', 'listening', 'processing'] as const).map(state => {
              const dotColors = { idle: '#94A3B8', listening: '#EF4444', processing: '#F97316' }
              const isActive = voiceState === state
              return (
                <div key={state} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: isActive ? dotColors[state] : '#E2E8F0', display: 'inline-block' }} />
                  <span style={{ fontSize: 12, color: isActive ? '#0F172A' : '#94A3B8', fontWeight: isActive ? 500 : 400, textTransform: 'capitalize' }}>{state}</span>
                </div>
              )
            })}
            <span style={{ marginLeft: 'auto', fontSize: 12, color: '#94A3B8' }}>Current: <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{voiceState}</span></span>
          </div>

          {errorMessage && (
            <div style={{ marginBottom: 16, padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, fontSize: 13, color: '#DC2626' }}>{errorMessage}</div>
          )}

          <p style={{ textAlign: 'center', fontSize: 13, color: '#94A3B8', marginBottom: 20 }}>— or type your request below —</p>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Title */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0F172A', marginBottom: 6 }}>
                Title <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input type="text" value={data.title} onChange={e => setData('title', e.target.value)}
                placeholder='Brief summary, e.g. "Laptop not connecting to VPN"'
                required
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 13, color: '#0F172A', outline: 'none', boxSizing: 'border-box' }}
              />
              {errors.title && <p style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>{errors.title}</p>}
            </div>

            {/* Description */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0F172A', marginBottom: 6 }}>Description</label>
              <textarea value={data.description} onChange={e => setData('description', e.target.value)}
                placeholder="Describe the issue in detail..."
                rows={5}
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 13, color: '#0F172A', resize: 'none', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* Department + Priority */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0F172A', marginBottom: 6 }}>
                  Department <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <select value={data.department_id} onChange={e => setData('department_id', e.target.value)} required
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 13, color: '#0F172A', background: '#fff', outline: 'none' }}>
                  <option value="">Select department...</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  {DEPT_QUICK.map(dept => (
                    <button key={dept} type="button" onClick={() => handleDeptQuick(dept)}
                      style={{ fontSize: 12, padding: '4px 10px', borderRadius: 8, border: '1px solid', cursor: 'pointer', borderColor: selectedDeptQuick === dept ? '#028090' : '#E2E8F0', background: selectedDeptQuick === dept ? '#028090' : 'transparent', color: selectedDeptQuick === dept ? '#fff' : '#475569' }}>
                      {dept}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0F172A', marginBottom: 6 }}>Priority</label>
                <select value={data.priority} onChange={e => setData('priority', e.target.value as TicketPriority)}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 13, color: '#0F172A', background: '#fff', outline: 'none' }}>
                  <option value="">Select priority...</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  {PRIORITY_QUICK.map(p => (
                    <button key={p.value} type="button" onClick={() => setData('priority', p.value)}
                      style={{ fontSize: 12, padding: '4px 10px', borderRadius: 8, border: '1px solid', cursor: 'pointer', fontWeight: 500, borderColor: data.priority === p.value ? p.color : '#E2E8F0', background: data.priority === p.value ? p.bg : 'transparent', color: data.priority === p.value ? p.color : '#475569' }}>
                      {p.label}
                    </button>
                  ))}
                </div>
                <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 6 }}>⚡ AI will adjust this after classification</p>
              </div>
            </div>

            {/* Attachments */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0F172A', marginBottom: 6 }}>Attachments</label>
              <div onDragOver={e => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)} onDrop={e => { e.preventDefault(); setDragOver(false) }}
                style={{ border: `2px dashed ${dragOver ? '#028090' : '#E2E8F0'}`, borderRadius: 10, padding: '32px 24px', textAlign: 'center', background: dragOver ? '#F0FDFA' : '#FAFAFA', cursor: 'pointer', transition: 'all 0.2s' }}>
                <p style={{ fontSize: 13, color: '#475569', marginBottom: 4 }}>Drag and drop files here</p>
                <p style={{ fontSize: 12, color: '#94A3B8', marginBottom: 12 }}>or</p>
                <button type="button" style={{ padding: '8px 20px', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 13, color: '#475569', background: '#fff', cursor: 'pointer' }}>Browse files</button>
                <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 10 }}>PNG, JPG, PDF, TXT up to 10MB</p>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={processing || !data.title || !data.department_id}
              style={{ width: '100%', padding: '14px', background: '#028090', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, color: '#fff', cursor: 'pointer', opacity: processing || !data.title || !data.department_id ? 0.5 : 1 }}>
              {processing ? 'Creating…' : '⚡ Create Ticket'}
            </button>

            <p style={{ textAlign: 'center', fontSize: 12, color: '#94A3B8' }}>⚡ AI classification starts immediately after creation</p>
            <div style={{ textAlign: 'center' }}>
              <button type="button" onClick={() => router.get('/tickets')} style={{ background: 'none', border: 'none', fontSize: 13, color: '#94A3B8', cursor: 'pointer' }}>Cancel</button>
            </div>
          </form>
        </div>

        {/* Right sidebar */}
        <div style={{ width: 256, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* AI detection */}
          <div style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 24px rgba(2,128,144,0.20)' }}>
            <div style={{ background: 'linear-gradient(135deg,#028090,#026E7A)', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>⚡ AI will automatically detect:</p>
            </div>
            <div style={{ background: 'linear-gradient(135deg,#028090,#026E7A)', padding: '12px 16px 16px' }}>
              {['Category and department routing', 'Urgency score 0–100', 'Similar resolved tickets', 'Suggested response for agents', 'SLA deadline based on priority'].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ color: '#fff', fontSize: 10 }}>✓</span>
                  </div>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', padding: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', marginBottom: 12 }}>💡 Tips for faster resolution</p>
            {[
              'Be specific — include error messages, device names, and affected users.',
              'Attach screenshots or logs to help AI and agents diagnose faster.',
              'Mention urgency context (e.g. "month-close in 2 hours") to trigger Critical priority.',
            ].map((tip, i) => (
              <p key={i} style={{ fontSize: 12, color: '#475569', lineHeight: 1.6, marginBottom: 10 }}>{tip}</p>
            ))}
          </div>

          {/* Recent tickets */}
          {recent_tickets.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', padding: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Your recent tickets</span>
                <button onClick={() => router.get('/tickets')} style={{ background: 'none', border: 'none', fontSize: 12, fontWeight: 500, color: '#028090', cursor: 'pointer' }}>View all</button>
              </div>
              {recent_tickets.map(t => (
                <button key={t.id} onClick={() => router.get(`/tickets/${t.id}`)}
                  style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', marginBottom: 4 }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#028090' }}>{t.ticket_number}</p>
                    <p style={{ fontSize: 12, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>{t.title}</p>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 500, color: recentStatusColors[t.status] ?? '#94A3B8' }}>
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

function MicIcon() {
  return (
    <svg width="28" height="28" fill="none" stroke="rgba(255,255,255,0.95)" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  )
}
