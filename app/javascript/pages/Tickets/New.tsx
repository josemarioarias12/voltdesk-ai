import { useState, useEffect, useRef, useCallback } from 'react'
import { router, useForm } from '@inertiajs/react'
import { motion, AnimatePresence } from 'framer-motion'
import type { TicketsNewProps, TicketPriority } from '@/types/tickets'
import { useVoiceTicket } from '@/hooks/useVoiceTicket'
import AppLayout from '@/components/AppLayout'

// ── Design tokens ─────────────────────────────────────────────────────────────
const TEAL = '#028090'
const MINT = '#02C39A'
const NAVY = '#0D1B2A'

const CARD: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  border: '1px solid rgba(15,23,42,0.08)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
}

const INPUT: React.CSSProperties = {
  width: '100%',
  padding: '9px 14px',
  border: '1px solid rgba(15,23,42,0.12)',
  borderRadius: 8,
  fontSize: 13,
  color: NAVY,
  outline: 'none',
  boxSizing: 'border-box',
  background: '#fff',
  transition: 'border-color 120ms ease',
}

const LABEL: React.CSSProperties = {
  display: 'block',
  fontSize: 10.5,
  fontWeight: 600,
  color: '#94A3B8',
  textTransform: 'uppercase',
  letterSpacing: '0.09em',
  marginBottom: 6,
}

// ── Constants ─────────────────────────────────────────────────────────────────
const QUICK_TEMPLATES = [
  { label: 'VPN Issue',         title: 'Cannot connect to VPN from home network',      department: 'IT' },
  { label: 'Hardware Request',  title: 'Request for new hardware equipment',            department: 'IT' },
  { label: 'Access Request',    title: 'Need access to internal system or application', department: 'IT' },
  { label: 'Printer Issue',     title: 'Printer not working in the office',             department: 'IT' },
  { label: 'Software License',  title: 'Request for software license renewal',          department: 'IT' },
]

const PRIORITY_OPTIONS: Array<{ value: TicketPriority; label: string; color: string; bg: string }> = [
  { value: 'low',      label: 'Low',      color: '#6B7280', bg: '#F1F5F9' },
  { value: 'medium',   label: 'Medium',   color: '#CA8A04', bg: '#FEF9C3' },
  { value: 'high',     label: 'High',     color: '#EA580C', bg: '#FFF7ED' },
  { value: 'critical', label: 'Critical', color: '#DC2626', bg: '#FEF2F2' },
]

const STATUS_COLORS: Record<string, string> = {
  open:        '#16A34A',
  in_progress: '#2563EB',
  resolved:    '#9333EA',
  pending:     '#CA8A04',
  closed:      '#64748B',
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────
function MicIcon({ size = 24, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  )
}

function TypeIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  )
}

function SparkleIcon({ size = 14, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  )
}

function CheckCircleIcon({ color = TEAL }: { color?: string }) {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function BoltIcon({ size = 16, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  )
}

// ── AI Preview types ───────────────────────────────────────────────────────────
interface AiPreviewData {
  category:      string
  category_conf: number
  priority:      string
  priority_conf: number
  urgency_score: number
  est_sla_hours: number
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function TicketsNew({ departments, recent_tickets }: TicketsNewProps) {
  const { transcript, interimTranscript, voiceState, isSupported, startListening, stopListening, resetTranscript, errorMessage } = useVoiceTicket('es-ES')

  const { data, setData, post, processing, errors } = useForm({
    title:         '',
    description:   '',
    department_id: '',
    priority:      '' as TicketPriority | '',
    source:        'web' as 'web' | 'voice',
  })

  const [inputMode,        setInputMode]        = useState<'voice' | 'type'>('voice')
  const [dragOver,         setDragOver]          = useState(false)
  const [selectedDept,     setSelectedDept]      = useState<string | null>(null)
  const [aiPreview,        setAiPreview]         = useState<AiPreviewData | null>(null)
  const [aiLoading,        setAiLoading]         = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Voice → title
  useEffect(() => {
    if (transcript) { setData('title', transcript); setData('source', 'voice') }
  }, [transcript])

  // AI Preview debounce
  const fetchAiPreview = useCallback(async (title: string, description: string) => {
    if (title.trim().length < 6) { setAiPreview(null); return }
    setAiLoading(true)
    try {
      const params = new URLSearchParams({ title, description })
      const res = await fetch(`/tickets/ai_preview?${params.toString()}`, {
        headers: { 'X-CSRF-Token': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '' },
      })
      if (res.ok) setAiPreview(await res.json() as AiPreviewData)
    } catch { /* silent */ } finally { setAiLoading(false) }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => { void fetchAiPreview(data.title, data.description) }, 800)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [data.title, data.description, fetchAiPreview])

  function handleVoiceToggle() {
    if (voiceState === 'listening') stopListening()
    else { resetTranscript(); startListening() }
  }

  function handleTemplate(tmpl: typeof QUICK_TEMPLATES[number]) {
    setData('title', tmpl.title)
    const found = departments.find(d => d.name.toLowerCase() === tmpl.department.toLowerCase())
    if (found) { setData('department_id', String(found.id)); setSelectedDept(found.name) }
  }

  function handleDeptQuick(dept: { id: number; name: string }) {
    setSelectedDept(dept.name)
    setData('department_id', String(dept.id))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    post('/tickets')
  }

  const isListening   = voiceState === 'listening'
  const canSubmit     = !processing && !!data.title && !!data.department_id
  const priorityMeta  = PRIORITY_OPTIONS.find(p => p.value === data.priority)

  const priorityColor = (val: string) => PRIORITY_OPTIONS.find(p => p.value === val)?.color ?? '#64748B'

  return (
    <AppLayout title="New Ticket">

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <p style={LABEL}>New Ticket</p>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: NAVY, letterSpacing: '-0.02em', marginBottom: 4 }}>
          What do you need help with?
        </h1>
        <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.75 }}>
          AI will classify, prioritize and route this automatically.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

        {/* ── Left column ─────────────────────────────────────────────────── */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Segmented toggle */}
          <div style={{ display: 'inline-flex', background: '#F1F5F9', borderRadius: 20, padding: 3, marginBottom: 20, gap: 2 }}>
            {(['voice', 'type'] as const).map(mode => {
              const active = inputMode === mode
              return (
                <button key={mode} type="button" onClick={() => setInputMode(mode)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 16px', borderRadius: 18, border: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: active ? 600 : 400,
                    background: active ? '#fff' : 'transparent',
                    color: active ? TEAL : '#64748B',
                    boxShadow: active ? '0 1px 3px rgba(0,0,0,0.10)' : 'none',
                    transition: 'all 120ms ease',
                  }}>
                  {mode === 'voice' ? <MicIcon size={14} color={active ? TEAL : '#94A3B8'} /> : <TypeIcon size={14} />}
                  {mode === 'voice' ? 'Voice Input' : 'Type Manually'}
                </button>
              )
            })}
          </div>

          {/* Voice panel */}
          <AnimatePresence>
            {inputMode === 'voice' && (
              <motion.div key="voice-panel"
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}>
                <div style={{ background: 'linear-gradient(135deg, #028090, #026E7A)', borderRadius: 12, marginBottom: 12, padding: '32px 24px', textAlign: 'center' }}>
                  <button onClick={handleVoiceToggle} disabled={!isSupported} type="button"
                    style={{
                      width: 56, height: 56, borderRadius: '50%', border: 'none',
                      background: isListening ? TEAL : 'rgba(2,128,144,0.08)',
                      cursor: isSupported ? 'pointer' : 'not-allowed',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 14px',
                      transition: 'all 200ms ease',
                    }}>
                    <MicIcon size={24} color={isListening ? '#fff' : TEAL} />
                  </button>
                  <p style={{ fontSize: 13, fontWeight: 600, color: TEAL, marginBottom: 4 }}>
                    {isListening ? 'Listening… click to stop' : 'Click to describe your issue by voice'}
                  </p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
                    Audio stays on your device · Web Speech API
                  </p>
                  {!isSupported && (
                    <p style={{ fontSize: 12, color: '#EA580C', marginTop: 8, background: '#FFF7ED', padding: '4px 12px', borderRadius: 20, display: 'inline-block' }}>
                      Requires Chrome or Edge
                    </p>
                  )}

                  {/* Transcript box */}
                  <div style={{ marginTop: 16, background: 'rgba(255,255,255,0.12)', borderRadius: 8, padding: '10px 14px', minHeight: 40, textAlign: 'left' }}>
                    {data.title || interimTranscript
                      ? <p style={{ fontSize: 13, color: '#fff' }}>{data.title || interimTranscript}</p>
                      : <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', fontStyle: 'italic' }}>Your transcript will appear here…</p>
                    }
                  </div>
                </div>

                {errorMessage && (
                  <div style={{ marginBottom: 12, padding: '9px 14px', background: '#FEF2F2', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, fontSize: 13, color: '#DC2626' }}>
                    {errorMessage}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(15,23,42,0.06)' }} />
            <span style={{ fontSize: 11, color: '#CBD5E1', letterSpacing: '0.04em' }}>or type below</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(15,23,42,0.06)' }} />
          </div>

          {/* Quick templates */}
          <div style={{ marginBottom: 24 }}>
            <p style={LABEL}>Quick Templates</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {QUICK_TEMPLATES.map((tmpl, i) => (
                <motion.button key={tmpl.label} type="button" onClick={() => handleTemplate(tmpl)}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{
                    padding: '5px 14px', borderRadius: 20, border: '1px solid rgba(15,23,42,0.12)',
                    fontSize: 12, fontWeight: 500, cursor: 'pointer', background: '#fff', color: '#475569',
                    transition: 'all 120ms ease',
                  }}
                  onMouseEnter={e => { const b = e.currentTarget; b.style.borderColor = TEAL; b.style.color = TEAL; b.style.background = 'rgba(2,128,144,0.04)' }}
                  onMouseLeave={e => { const b = e.currentTarget; b.style.borderColor = 'rgba(15,23,42,0.12)'; b.style.color = '#475569'; b.style.background = '#fff' }}>
                  {tmpl.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Title */}
            <div>
              <label style={LABEL}>Title <span style={{ color: '#EF4444' }}>*</span></label>
              <input type="text" value={data.title}
                onChange={e => setData('title', e.target.value)}
                placeholder='e.g. "Cannot connect to VPN from home network"'
                required style={INPUT}
                onFocus={e => { e.target.style.borderColor = TEAL }}
                onBlur={e => { e.target.style.borderColor = 'rgba(15,23,42,0.12)' }}
              />
              {errors.title && <p style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>{errors.title}</p>}
            </div>

            {/* Description */}
            <div>
              <label style={LABEL}>Description</label>
              <textarea value={data.description}
                onChange={e => setData('description', e.target.value)}
                placeholder="Describe the issue in more detail…"
                rows={4}
                style={{ ...INPUT, resize: 'none', lineHeight: 1.75 }}
                onFocus={e => { e.target.style.borderColor = TEAL }}
                onBlur={e => { e.target.style.borderColor = 'rgba(15,23,42,0.12)' }}
              />
            </div>

            {/* Department + Priority */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

              {/* Department */}
              <div>
                <label style={LABEL}>Department <span style={{ color: '#EF4444' }}>*</span></label>
                <select value={data.department_id}
                  onChange={e => setData('department_id', e.target.value)}
                  required style={INPUT}
                  onFocus={e => { e.target.style.borderColor = TEAL }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(15,23,42,0.12)' }}>
                  <option value="">Select department…</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
                  {departments.slice(0, 5).map(d => (
                    <button key={d.id} type="button" onClick={() => handleDeptQuick(d)}
                      style={{
                        fontSize: 11, padding: '3px 10px', borderRadius: 20, border: '1px solid', cursor: 'pointer',
                        borderColor: selectedDept === d.name ? TEAL : 'rgba(15,23,42,0.12)',
                        background: selectedDept === d.name ? TEAL : 'transparent',
                        color: selectedDept === d.name ? '#fff' : '#64748B',
                        transition: 'all 120ms ease',
                      }}>
                      {d.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority */}
              <div>
                <label style={LABEL}>Priority</label>
                <select value={data.priority}
                  onChange={e => setData('priority', e.target.value as TicketPriority)}
                  style={INPUT}
                  onFocus={e => { e.target.style.borderColor = TEAL }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(15,23,42,0.12)' }}>
                  <option value="">Select priority…</option>
                  {PRIORITY_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
                <div style={{ display: 'flex', gap: 5, marginTop: 8, flexWrap: 'wrap' }}>
                  {PRIORITY_OPTIONS.map(p => (
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
                <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 6 }}>AI will adjust after classification</p>
              </div>
            </div>

            {/* Attachments */}
            <div>
              <label style={LABEL}>Attachments</label>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false) }}
                style={{
                  border: `2px dashed ${dragOver ? TEAL : 'rgba(15,23,42,0.10)'}`,
                  borderRadius: 8, padding: '24px', textAlign: 'center',
                  background: dragOver ? 'rgba(2,128,144,0.04)' : '#FAFAFA',
                  cursor: 'pointer', transition: 'all 120ms ease',
                }}>
                <svg width="22" height="22" fill="none" stroke="#CBD5E1" viewBox="0 0 24 24" style={{ marginBottom: 8 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 4 }}>Drop files here or click to upload</p>
                <p style={{ fontSize: 11, color: '#CBD5E1' }}>PNG, JPG, PDF up to 10MB</p>
              </div>
            </div>

            {/* Submit */}
            <motion.button type="submit" disabled={!canSubmit}
              whileHover={canSubmit ? { scale: 1.005 } : {}}
              whileTap={canSubmit ? { scale: 0.995 } : {}}
              style={{
                width: '100%', padding: '13px', background: canSubmit ? TEAL : '#94A3B8',
                border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#fff',
                cursor: canSubmit ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background 120ms ease',
              }}>
              <BoltIcon size={15} color="#fff" />
              {processing ? 'Creating…' : 'Create Ticket — AI classifies immediately'}
            </motion.button>

            <div style={{ textAlign: 'center' }}>
              <button type="button" onClick={() => router.get('/tickets')}
                style={{ background: 'none', border: 'none', fontSize: 13, color: '#94A3B8', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* ── Right sidebar — single #FAFAFA surface ───────────────────────── */}
        <div style={{ width: 264, flexShrink: 0, background: '#FAFAFA', borderRadius: 12, border: '1px solid rgba(15,23,42,0.07)', overflow: 'hidden' }}>

          {/* AI PREVIEW */}
          <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
              <div style={{ position: 'relative', width: 8, height: 8 }}>
                <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: MINT, opacity: aiLoading ? 1 : 0.9 }} />
                {aiLoading && (
                  <span style={{ position: 'absolute', inset: -2, borderRadius: '50%', border: `2px solid ${MINT}`, animation: 'ping 1s cubic-bezier(0,0,0.2,1) infinite', opacity: 0.4 }} />
                )}
              </div>
              <p style={{ fontSize: 10.5, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.09em' }}>
                AI Preview
              </p>
            </div>

            <AnimatePresence mode="wait">
              {aiPreview ? (
                <motion.div key="preview-data"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}>

                  {/* Category */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 12, color: '#64748B' }}>Category</span>
                    <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 10px', borderRadius: 20, background: 'rgba(2,128,144,0.10)', color: TEAL }}>
                      {aiPreview.category} · {aiPreview.category_conf}%
                    </span>
                  </div>

                  {/* Priority */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 12, color: '#64748B' }}>Priority</span>
                    <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 10px', borderRadius: 20,
                      background: PRIORITY_OPTIONS.find(p => p.value === aiPreview.priority)?.bg ?? '#F1F5F9',
                      color: priorityColor(aiPreview.priority) }}>
                      {aiPreview.priority.charAt(0).toUpperCase() + aiPreview.priority.slice(1)} · {aiPreview.priority_conf}%
                    </span>
                  </div>

                  {/* Est. SLA */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 12, color: '#64748B' }}>Est. SLA</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: NAVY }}>
                      {aiPreview.est_sla_hours < 24 ? `${aiPreview.est_sla_hours} hours` : `${aiPreview.est_sla_hours / 24} days`}
                    </span>
                  </div>

                  {/* Urgency bar */}
                  <div style={{ marginBottom: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 12, color: '#64748B' }}>Urgency</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: aiPreview.urgency_score >= 70 ? '#DC2626' : TEAL }}>
                        {aiPreview.urgency_score}
                      </span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: 'rgba(15,23,42,0.08)', overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${aiPreview.urgency_score}%` }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                        style={{ height: '100%', borderRadius: 2, background: aiPreview.urgency_score >= 70 ? '#DC2626' : TEAL }} />
                    </div>
                  </div>

                  <p style={{ fontSize: 11, color: '#CBD5E1', marginTop: 10 }}>Predictions update as you type</p>
                </motion.div>
              ) : (
                <motion.div key="preview-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <p style={{ fontSize: 12, color: '#CBD5E1', lineHeight: 1.6 }}>
                    Start typing a title to see AI predictions…
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* AI WILL DETECT */}
          <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
            <p style={{ ...LABEL, marginBottom: 10 }}>AI Will Detect</p>
            {[
              'Category routing',
              'Urgency 0–100',
              'Similar resolved tickets',
              'Suggested response for agents',
              'SLA deadline based on priority',
            ].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                <CheckCircleIcon color={TEAL} />
                <span style={{ fontSize: 12, color: '#475569' }}>{item}</span>
              </div>
            ))}
          </div>

          {/* YOUR RECENT TICKETS */}
          {recent_tickets.length > 0 && (
            <div style={{ padding: '14px 18px' }}>
              <p style={{ ...LABEL, marginBottom: 10 }}>Your Recent Tickets</p>
              {recent_tickets.map(t => (
                <button key={t.id} type="button" onClick={() => router.get(`/tickets/${t.id}`)}
                  style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '7px 6px', borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', marginBottom: 2, transition: 'background 120ms ease', textAlign: 'left' }}
                  onMouseEnter={e => { (e.currentTarget).style.background = 'rgba(15,23,42,0.04)' }}
                  onMouseLeave={e => { (e.currentTarget).style.background = 'none' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: TEAL, fontFamily: 'monospace', marginBottom: 2 }}>{t.ticket_number}</p>
                    <p style={{ fontSize: 11, color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</p>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, color: STATUS_COLORS[t.status] ?? '#94A3B8', textTransform: 'capitalize', flexShrink: 0, marginLeft: 6, marginTop: 1 }}>
                    {t.status.replace(/_/g, ' ')}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ping animation keyframe */}
      <style>{`@keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }`}</style>
    </AppLayout>
  )
}