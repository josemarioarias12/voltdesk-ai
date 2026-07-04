import { useState, useEffect, useRef, useCallback } from 'react'
import { router } from '@inertiajs/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useVoiceTicket } from '@/hooks/useVoiceTicket'

interface Department { id: number; name: string }

interface Props {
  workspace_name: string
  expires_in:     number
  guest_count:    number
  departments:    Department[]
}

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'] as const
type Priority = typeof PRIORITIES[number]

const PRIORITY_META: Record<Priority, { color: string; bg: string; border: string; dot: string }> = {
  Low:      { color: '#38BDF8', bg: 'rgba(56,189,248,0.10)',    border: 'rgba(56,189,248,0.4)',    dot: '#38BDF8' },
  Medium:   { color: '#CA8A04', bg: 'rgba(202,138,4,0.08)',    border: 'rgba(202,138,4,0.4)',    dot: '#EAB308' },
  High:     { color: '#EA580C', bg: 'rgba(234,88,12,0.08)',    border: 'rgba(234,88,12,0.4)',    dot: '#F97316' },
  Critical: { color: '#DC2626', bg: 'rgba(220,38,38,0.08)',    border: 'rgba(220,38,38,0.4)',    dot: '#EF4444' },
}

interface DeptStyle { color: string; icon: React.ReactNode }

const QUICK_CHIPS: Array<{ label: string; description: string; department: string }> = [
  { label: 'Printer issue',    description: 'Printer on my floor is not working',         department: 'IT' },
  { label: 'VPN / access',     description: 'Cannot connect to VPN or internal system',    department: 'IT' },
  { label: 'Broken equipment', description: 'Office equipment or furniture is broken',     department: 'Facilities' },
  { label: 'HR question',      description: 'I have a question about a company HR policy', department: 'HR' },
]

function IconMonitor() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
    </svg>
  )
}

function IconUsers() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function IconBuilding() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function IconDollar() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  )
}

function IconSettings() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
    </svg>
  )
}

function IconFile() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
    </svg>
  )
}

function IconArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

function IconSpinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

function IconMic({ color = '#fff' }: { color?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  )
}

function IconPaperclip({ color = '#94A3B8' }: { color?: string }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
    </svg>
  )
}

function IconClose() {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="#fff" strokeWidth={1.5}>
      <path d="M1 1l6 6M7 1L1 7" strokeLinecap="round" />
    </svg>
  )
}

interface DeptStyle { color: string; icon: React.ReactNode }

const DEPT_STYLES: Array<{ keywords: string[]; color: string; icon: React.ReactNode }> = [
  { keywords: ['it', 'infrastructure', 'network'], color: '#028090', icon: <IconMonitor /> },
  { keywords: ['software', 'engineering', 'dev'],  color: '#6366F1', icon: <IconSettings /> },
  { keywords: ['hr', 'human resources', 'people'], color: '#8B5CF6', icon: <IconUsers /> },
  { keywords: ['facilities'],                      color: '#F97316', icon: <IconBuilding /> },
  { keywords: ['finance'],                         color: '#16A34A', icon: <IconDollar /> },
  { keywords: ['operations'],                      color: '#2563EB', icon: <IconSettings /> },
]

function getDeptStyle(name: string): DeptStyle {
  const lower = name.toLowerCase()
  const found = DEPT_STYLES.find(s => s.keywords.some(k => lower.includes(k)))
  return found ?? { color: '#6B7280', icon: <IconFile /> }
}

function findDepartmentByKeyword(departments: Department[], keyword: string): Department | undefined {
  const lower = keyword.toLowerCase()
  return departments.find(d => d.name.toLowerCase().includes(lower))
}

function PulseDot({ color = '#028090' }: { color?: string }) {
  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 10, height: 10, flexShrink: 0 }}>
      <motion.span
        animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
        style={{ position: 'absolute', width: 10, height: 10, borderRadius: '50%', background: color }}
      />
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block' }} />
    </span>
  )
}

interface AiPreviewData {
  category:       string
  category_conf:  number
  priority:       string
  priority_conf:  number
  urgency_score:  number
  est_sla_hours:  number
}

interface AttachmentPreview { name: string; url: string; type: string }

export default function DemoCreateTicket({ workspace_name, expires_in, guest_count, departments }: Props) {
  const {
    transcript, interimTranscript, voiceState, isSupported,
    startListening, stopListening, resetTranscript, errorMessage,
  } = useVoiceTicket()

  const [description,  setDescription]  = useState('')
  const [selectedDept, setSelectedDept] = useState<number | null>(null)
  const [priority,     setPriority]     = useState<Priority | null>(null)
  const [submitting,   setSubmitting]   = useState(false)
  const [secondsLeft,  setSecondsLeft]  = useState(expires_in)

  const [aiPreview, setAiPreview] = useState<AiPreviewData | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [attachments, setAttachments] = useState<File[]>([])
  const [previews,    setPreviews]    = useState<AttachmentPreview[]>([])
  const [showAttachmentModal, setShowAttachmentModal] = useState(false)
  const cameraInputRef  = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef    = useRef<HTMLInputElement>(null)

  const isListening = voiceState === 'listening'

  // Voice transcript flows straight into description
  useEffect(() => {
    if (transcript) setDescription(prev => (prev ? `${prev} ${transcript}` : transcript))
  }, [transcript])

  // AI Preview — same backend endpoint as Tickets/New, reused as-is
  const fetchAiPreview = useCallback(async (text: string) => {
    if (text.trim().length < 10) { setAiPreview(null); return }
    setAiLoading(true)
    try {
      const params = new URLSearchParams({ title: text.slice(0, 60), description: text })
      const res = await fetch(`/tickets/ai_preview?${params.toString()}`, {
        headers: { 'X-CSRF-Token': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '' },
      })
      if (res.ok) setAiPreview(await res.json() as AiPreviewData)
    } catch { /* silent — preview is a bonus, never blocks submission */ } finally { setAiLoading(false) }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => { void fetchAiPreview(description) }, 800)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [description, fetchAiPreview])

  useEffect(() => {
    if (secondsLeft <= 0) return
    const id = setInterval(() => setSecondsLeft(prev => prev - 1), 1000)
    return () => clearInterval(id)
  }, [secondsLeft])

  function formatTime(secs: number): string {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  function handleVoiceToggle() {
    if (isListening) stopListening()
    else { resetTranscript(); startListening() }
  }

  function handleChip(chip: typeof QUICK_CHIPS[number]) {
    setDescription(chip.description)
    const found = findDepartmentByKeyword(departments, chip.department)
    if (found) setSelectedDept(found.id)
  }

  function handleFiles(files: FileList | File[]) {
    const arr = Array.from(files).filter(f => f.size <= 10 * 1024 * 1024)
    if (!arr.length) return
    setAttachments(prev => [...prev, ...arr])
    arr.forEach(file => {
      const url = URL.createObjectURL(file)
      setPreviews(prev => [...prev, { name: file.name, url, type: file.type }])
    })
  }

  function removeAttachment(index: number) {
    setAttachments(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  function handleSubmit() {
    if (!description.trim() || !selectedDept || !priority) return
    setSubmitting(true)
    router.post('/demo/ticket', {
      ticket: {
        title:         description.trim().slice(0, 120),
        description:   description.trim(),
        department_id: selectedDept,
        priority:      priority.toLowerCase(),
        attachments,
      },
    }, {
      forceFormData: true,
      headers: { 'X-CSRF-Token': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '' },
      onError: () => setSubmitting(false),
    })
  }

  if (secondsLeft <= 0) {
    return (
      <div style={{ minHeight: '100vh', background: '#0D1B2A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Inter, system-ui, sans-serif' }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', maxWidth: 320 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Session expired</p>
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6 }}>This demo session has ended. Ask the presenter to start a new one.</p>
        </motion.div>
      </div>
    )
  }

  const canSubmit        = description.trim().length > 0 && selectedDept !== null && priority !== null && !submitting
  const isLowTime        = secondsLeft < 120
  const timerColor       = isLowTime ? '#EF4444' : '#02C39A'
  const selectedDeptName = departments.find(d => d.id === selectedDept)?.name ?? ''
  const priorityColor    = (val: string) =>
    (PRIORITY_META[(val.charAt(0).toUpperCase() + val.slice(1)) as Priority] ?? PRIORITY_META.Low).color

  return (
    <div style={{ minHeight: '100vh', background: '#0D1B2A', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', flexDirection: 'column' }}>

      <div style={{ height: 2, background: 'linear-gradient(90deg,#028090,#02C39A)', flexShrink: 0 }} />

      {/* Header */}
      <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 800, margin: 0, background: 'linear-gradient(135deg,#028090,#02C39A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            VoltDesk AI
          </p>
          <p style={{ fontSize: 11, color: '#475569', margin: '2px 0 0', fontWeight: 500 }}>{workspace_name}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 20, fontWeight: 800, color: timerColor, margin: 0, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
            {formatTime(secondsLeft)}
          </p>
          <p style={{ fontSize: 10, color: '#334155', margin: '2px 0 0', textTransform: 'uppercase' as const, letterSpacing: '0.08em', fontWeight: 600 }}>remaining</p>
        </div>
      </div>

      {/* Status banner */}
      <div style={{ background: 'linear-gradient(135deg,rgba(2,128,144,0.9),rgba(2,110,122,0.9))', padding: '16px 20px', borderBottom: '1px solid rgba(2,195,154,0.2)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <PulseDot color="#02C39A" />
          <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>
            {guest_count} {guest_count === 1 ? 'participant' : 'participants'} online
          </span>
        </div>
        <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: '0 0 2px' }}>Live demo session</p>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', margin: 0, lineHeight: 1.5 }}>
          Submit a ticket — watch AI classify it on screen in real time
        </p>
      </div>

      {/* Form body */}
      <div style={{ flex: 1, padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Quick chips — discreet, no section header, sit right above the input they feed */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {QUICK_CHIPS.map((chip, i) => (
            <motion.button
              key={chip.label}
              type="button"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleChip(chip)}
              style={{
                padding: '5px 12px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)',
                fontSize: 11.5, fontWeight: 500, cursor: 'pointer', background: 'rgba(255,255,255,0.03)', color: '#94A3B8',
                fontFamily: 'Inter, system-ui, sans-serif', transition: 'all 0.15s',
              }}
            >
              {chip.label}
            </motion.button>
          ))}
        </div>

        {/* Voice + description */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>
              Issue description
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                type="button"
                onClick={() => setShowAttachmentModal(true)}
                title="Add attachment"
                style={{ width: 26, height: 26, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
              >
                <IconPaperclip />
              </button>
              <motion.button
                type="button"
                disabled={!isSupported}
                onClick={handleVoiceToggle}
                whileTap={{ scale: 0.92 }}
                title={isSupported ? 'Voice input' : 'Requires Chrome or Edge'}
                style={{
                  width: 26, height: 26, borderRadius: 8, border: 'none',
                  background: isListening ? '#DC2626' : 'linear-gradient(135deg,#028090,#02C39A)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: isSupported ? 'pointer' : 'not-allowed', padding: 0, opacity: isSupported ? 1 : 0.4,
                }}
              >
                {isListening
                  ? <motion.span animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 0.8, repeat: Infinity }} style={{ display: 'flex' }}><IconMic /></motion.span>
                  : <IconMic />}
              </motion.button>
            </div>
          </div>

          <textarea
            value={description}
            onChange={evt => setDescription(evt.target.value)}
            maxLength={300}
            rows={4}
            placeholder="Describe any workplace issue you're experiencing… or tap the mic"
            style={{
              width: '100%', padding: '14px 16px',
              border: `1.5px solid ${description.trim().length > 0 ? '#028090' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 12, fontSize: 15, color: '#0F172A', background: '#fff', resize: 'none', outline: 'none',
              boxSizing: 'border-box' as const, lineHeight: 1.6, fontFamily: 'Inter, system-ui, sans-serif',
              transition: 'border-color 0.2s',
            }}
          />

          {isListening && interimTranscript && (
            <p style={{ fontSize: 12, color: '#02C39A', margin: '6px 0 0', fontStyle: 'italic' }}>{interimTranscript}…</p>
          )}
          {errorMessage && (
            <p style={{ fontSize: 12, color: '#EF4444', margin: '6px 0 0' }}>{errorMessage}</p>
          )}

          <p style={{ fontSize: 11, color: '#1E293B', margin: '6px 0 0', textAlign: 'right' as const, fontVariantNumeric: 'tabular-nums' }}>
            {description.length}/300
          </p>

          {/* Attachment thumbnails */}
          {previews.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {previews.map((p, i) => (
                <div key={i} style={{ position: 'relative', width: 48, height: 48, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {p.type.startsWith('image/')
                    ? <img src={p.url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconFile /></div>}
                  <button type="button" onClick={() => removeAttachment(i)}
                    style={{ position: 'absolute', top: 1, right: 1, width: 15, height: 15, borderRadius: '50%', background: 'rgba(0,0,0,0.65)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                    <IconClose />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Preview — compact horizontal card, reacts directly to the input above */}
        <AnimatePresence>
          {(aiPreview || aiLoading) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ background: 'rgba(2,195,154,0.06)', border: '1px solid rgba(2,195,154,0.18)', borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: aiPreview ? 8 : 0 }}>
                  <PulseDot color="#02C39A" />
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#02C39A', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>
                    AI Preview
                  </span>
                </div>
                {aiPreview && (
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <div>
                      <p style={{ fontSize: 9.5, color: '#475569', margin: 0, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>Category</p>
                      <p style={{ fontSize: 12.5, fontWeight: 600, color: '#fff', margin: '2px 0 0' }}>{aiPreview.category}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: 9.5, color: '#475569', margin: 0, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>Priority</p>
                      <p style={{ fontSize: 12.5, fontWeight: 600, color: priorityColor(aiPreview.priority), margin: '2px 0 0', textTransform: 'capitalize' as const }}>{aiPreview.priority}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: 9.5, color: '#475569', margin: 0, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>Urgency</p>
                      <p style={{ fontSize: 12.5, fontWeight: 700, color: aiPreview.urgency_score >= 70 ? '#EF4444' : '#02C39A', margin: '2px 0 0' }}>{aiPreview.urgency_score}</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Department */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' as const, letterSpacing: '0.1em', display: 'block', marginBottom: 10 }}>
            Department
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {departments.map(dept => {
              const active = selectedDept === dept.id
              const { color: dColor, icon: dIcon } = getDeptStyle(dept.name)
              return (
                <motion.button
                  key={dept.id}
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedDept(dept.id)}
                  style={{
                    padding: '13px 14px', borderRadius: 10,
                    border: `1.5px solid ${active ? dColor : 'rgba(255,255,255,0.07)'}`,
                    background: active ? `${dColor}18` : 'rgba(255,255,255,0.03)',
                    color: active ? dColor : '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Inter, system-ui, sans-serif',
                    transition: 'all 0.15s', textAlign: 'left' as const,
                  }}
                >
                  <span style={{ opacity: active ? 1 : 0.5, display: 'flex' }}>{dIcon}</span>
                  {dept.name}
                  {active && <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: dColor, flexShrink: 0 }} />}
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Priority */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>
              Priority
            </label>
            <span style={{ fontSize: 10, color: '#334155', fontWeight: 500 }}>AI will verify</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {PRIORITIES.map(prio => {
              const active = priority === prio
              const meta   = PRIORITY_META[prio]
              return (
                <motion.button
                  key={prio}
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setPriority(prio)}
                  style={{
                    padding: '12px 6px', borderRadius: 10,
                    border: `1.5px solid ${active ? meta.border : 'rgba(255,255,255,0.07)'}`,
                    background: active ? meta.bg : 'rgba(255,255,255,0.03)',
                    color: active ? meta.color : '#334155', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 6,
                    fontFamily: 'Inter, system-ui, sans-serif', transition: 'all 0.15s',
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: active ? meta.dot : 'rgba(255,255,255,0.15)', display: 'inline-block', transition: 'background 0.15s' }} />
                  {prio}
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Summary */}
        <AnimatePresence>
          {canSubmit && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              style={{ background: 'rgba(2,195,154,0.06)', border: '1px solid rgba(2,195,154,0.18)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}
            >
              <PulseDot color="#02C39A" />
              <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>
                <span style={{ color: '#fff', fontWeight: 600 }}>{selectedDeptName}</span>
                {' · '}
                <span style={{ color: priority ? PRIORITY_META[priority].color : '#94A3B8', fontWeight: 600 }}>{priority}</span>
                {' · Ready to submit'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit button */}
        <motion.button
          type="button"
          disabled={!canSubmit}
          onClick={handleSubmit}
          whileTap={canSubmit ? { scale: 0.98 } : {}}
          style={{
            width: '100%', padding: '17px',
            background: canSubmit ? 'linear-gradient(135deg,#028090,#02C39A)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${canSubmit ? 'transparent' : 'rgba(255,255,255,0.06)'}`,
            borderRadius: 12, fontSize: 15, fontWeight: 700, color: canSubmit ? '#fff' : '#1E293B',
            cursor: canSubmit ? 'pointer' : 'not-allowed', fontFamily: 'Inter, system-ui, sans-serif',
            boxShadow: canSubmit ? '0 8px 24px rgba(2,128,144,0.3)' : 'none', transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          }}
        >
          {submitting ? (
            <>
              <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ display: 'flex' }}>
                <IconSpinner />
              </motion.span>
              Sending to AI…
            </>
          ) : (
            <>
              Submit Ticket
              <IconArrow />
            </>
          )}
        </motion.button>

        <p style={{ textAlign: 'center' as const, fontSize: 11, color: '#1E293B', margin: 0, letterSpacing: '0.02em' }}>
          Read-only demo · No account required
        </p>
      </div>

      {/* Hidden file inputs */}
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
        onChange={e => { if (e.target.files) { handleFiles(e.target.files); setShowAttachmentModal(false) } }} />
      <input ref={galleryInputRef} type="file" multiple accept="image/*" style={{ display: 'none' }}
        onChange={e => { if (e.target.files) { handleFiles(e.target.files); setShowAttachmentModal(false) } }} />
      <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.txt" style={{ display: 'none' }}
        onChange={e => { if (e.target.files) { handleFiles(e.target.files); setShowAttachmentModal(false) } }} />

      {/* Attachment modal — mobile-only options, guest always enters via phone */}
      <AnimatePresence>
        {showAttachmentModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAttachmentModal(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, backdropFilter: 'blur(4px)' }}
            />
            <motion.div
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              style={{
                position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 51,
                background: '#0F172A', borderRadius: '20px 20px 0 0', padding: '20px 20px 28px',
                boxShadow: '0 -8px 32px rgba(0,0,0,0.4)',
              }}
            >
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)', margin: '0 auto 18px' }} />
              <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Add attachment</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'Take a Photo', sub: 'Use your camera', onClick: () => cameraInputRef.current?.click(), gradient: 'linear-gradient(135deg,#028090,#02C39A)', icon: <IconMonitor /> },
                  { label: 'Choose from Gallery', sub: 'Select an existing image', onClick: () => galleryInputRef.current?.click(), gradient: 'linear-gradient(135deg,#7C3AED,#A855F7)', icon: <IconFile /> },
                  { label: 'Upload a File', sub: 'PDF, DOC, TXT up to 10MB', onClick: () => fileInputRef.current?.click(), gradient: 'linear-gradient(135deg,#EA580C,#F97316)', icon: <IconPaperclip color="#fff" /> },
                ].map(opt => (
                  <button key={opt.label} type="button" onClick={opt.onClick}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)', cursor: 'pointer', width: '100%', textAlign: 'left' as const }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: opt.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {opt.icon}
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', margin: 0 }}>{opt.label}</p>
                      <p style={{ fontSize: 11.5, color: '#64748B', margin: '2px 0 0' }}>{opt.sub}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}