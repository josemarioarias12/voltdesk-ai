import { useState, useEffect, useRef, useCallback } from 'react'
import { router, useForm } from '@inertiajs/react'
import { motion, AnimatePresence } from 'framer-motion'
import type { TicketsNewProps, TicketPriority } from '@/types/tickets'
import { useVoiceTicket } from '@/hooks/useVoiceTicket'
import { useLocale } from '@/hooks/useLocale'
import { useTranslation } from 'react-i18next'
import { useDepartmentName } from '@/hooks/useDepartmentName'
import AppLayout from '@/components/AppLayout'

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
  border: '1px solid rgba(15,23,42,0.18)',
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
  { id: 'vpnIssue', department: 'IT' },
  { id: 'hardwareRequest', department: 'IT' },
  { id: 'accessRequest', department: 'IT' },
  { id: 'printerIssue', department: 'IT' },
  { id: 'softwareLicense', department: 'IT' },
] as const

const PRIORITY_OPTIONS: Array<{ value: TicketPriority; color: string; bg: string }> = [
  { value: 'low', color: '#6B7280', bg: '#F1F5F9' },
  { value: 'medium', color: '#CA8A04', bg: '#FEF9C3' },
  { value: 'high', color: '#EA580C', bg: '#FFF7ED' },
  { value: 'critical', color: '#DC2626', bg: '#FEF2F2' },
]

const STATUS_COLORS: Record<string, string> = {
  open: '#16A34A',
  in_progress: '#2563EB',
  resolved: '#9333EA',
  pending: '#CA8A04',
  closed: '#64748B',
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
  category: string
  category_conf: number
  priority: TicketPriority
  priority_conf: number
  urgency_score: number
  est_sla_hours: number
  suggested_title?: string
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function TicketsNew({ departments, recent_tickets }: TicketsNewProps) {
  const { locale, speechLang, toggleLocale } = useLocale()
  const { t } = useTranslation('tickets')
  const departmentName = useDepartmentName()
  const { transcript, interimTranscript, voiceState, isSupported, startListening, stopListening, resetTranscript, errorMessage } = useVoiceTicket(speechLang)

  const { data, setData, post, processing, errors } = useForm({
    title:         '',
    description:   '',
    department_id: '',
    priority:      '' as TicketPriority | '',
    source:        'web' as 'web' | 'voice',
    attachments:   [] as File[],
  })

  const [dragOver,         setDragOver]          = useState(false)
  const [previews,         setPreviews]           = useState<Array<{ name: string; url: string; type: string }>>([])
  const fileInputRef    = useRef<HTMLInputElement>(null)
  const cameraInputRef  = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const [showAttachmentModal, setShowAttachmentModal] = useState(false)
  const [selectedDept, setSelectedDept] = useState<string | null>(null)
  const [aiPreview, setAiPreview] = useState<AiPreviewData | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Voice → description (AI Preview will suggest a title from it)
  useEffect(() => {
    if (transcript) { setData('description', transcript); setData('source', 'voice') }
  }, [transcript])

  // AI Preview debounce
  const fetchAiPreview = useCallback(async (title: string, description: string) => {
    if (title.trim().length < 6 && description.trim().length < 10) { setAiPreview(null); return }
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
    setData('title', t(`new.templates.items.${tmpl.id}.title`))
    const found = departments.find(d => d.name.toLowerCase() === tmpl.department.toLowerCase())
    if (found) { setData('department_id', String(found.id)); setSelectedDept(found.name) }
  }

  function handleDeptQuick(dept: { id: number; name: string }) {
    setSelectedDept(dept.name)
    setData('department_id', String(dept.id))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    post('/tickets', {
      forceFormData: true,
      headers: {
        'X-CSRF-Token': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '',
      },
    })
  }

  function handleFiles(files: FileList | File[]) {
    const arr = Array.from(files).filter(f => f.size <= 10 * 1024 * 1024)
    if (!arr.length) return
    setData('attachments', [...data.attachments, ...arr])
    arr.forEach(file => {
      const url = URL.createObjectURL(file)
      setPreviews(prev => [...prev, { name: file.name, url, type: file.type }])
    })
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files)
  }

  function handlePaste(e: React.ClipboardEvent) {
    const items = Array.from(e.clipboardData.items)
    const imageFiles = items
      .filter(item => item.kind === 'file' && item.type.startsWith('image/'))
      .map(item => item.getAsFile())
      .filter((f): f is File => f !== null)
    if (imageFiles.length) handleFiles(imageFiles)
  }

  function removeAttachment(index: number) {
    const newFiles = data.attachments.filter((_, i) => i !== index)
    const newPreviews = previews.filter((_, i) => i !== index)
    setData('attachments', newFiles)
    setPreviews(newPreviews)
  }

  const isListening = voiceState === 'listening'
  const canSubmit = !processing && !!data.title && !!data.department_id
  const priorityMeta = PRIORITY_OPTIONS.find(p => p.value === data.priority)
  const windowWidth  = useWindowWidth()
  const isMobile     = windowWidth < 768
  const isTablet     = windowWidth < 1024

  const priorityColor = (val: string) => PRIORITY_OPTIONS.find(p => p.value === val)?.color ?? '#64748B'

  return (
    <AppLayout title={t('new.header.eyebrow')}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <p style={LABEL}>{t('new.header.eyebrow')}</p>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: NAVY, letterSpacing: '-0.02em', marginBottom: 4 }}>
          {t('new.header.title')}
        </h1>
        <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.75 }}>
          {t('new.header.subtitle')}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexDirection: isMobile ? 'column' : 'row' }}>

        {/* ── Left column ─────────────────────────────────────────────────── */}
        <div style={{ flex: 1, minWidth: 0 }}>


          {/* Voice panel */}
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}>
                <div style={{ background: 'linear-gradient(135deg, #028090, #026E7A)', borderRadius: 12, marginBottom: 12, padding: isMobile ? '24px 16px' : '32px 24px', textAlign: 'center' }}>
                  <button onClick={handleVoiceToggle} disabled={!isSupported} type="button"
                    style={{
                      width: 56, height: 56, borderRadius: '50%', border: 'none',
                      background: isListening ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.2)',
                      cursor: isSupported ? 'pointer' : 'not-allowed',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 14px',
                      transition: 'all 200ms ease',
                    }}>
                    <MicIcon size={24} color="rgba(255,255,255,0.95)" />
                  </button>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 4 }}>
                    {isListening ? t('new.voice.listening') : t('new.voice.prompt')}
                  </p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
                    {t('new.voice.privacy')}
                  </p>
                  {!isSupported && (
                    <p style={{ fontSize: 12, color: '#EA580C', marginTop: 8, background: '#FFF7ED', padding: '4px 12px', borderRadius: 20, display: 'inline-block' }}>
                      {t('new.voice.unsupported')}
                    </p>
                  )}

                  {/* Transcript box */}
                  <div style={{ marginTop: 16, background: 'rgba(255,255,255,0.12)', borderRadius: 8, padding: '10px 14px', minHeight: 40, textAlign: 'left' }}>
                    {data.title || interimTranscript
                      ? <p style={{ fontSize: 13, color: '#fff' }}>{data.title || interimTranscript}</p>
                      : <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', fontStyle: 'italic' }}>{t('new.voice.placeholder')}</p>
                    }
                  </div>
                </div>

                {errorMessage && (
                  <div style={{ marginBottom: 12, padding: '9px 14px', background: '#FEF2F2', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, fontSize: 13, color: '#DC2626' }}>
                    {errorMessage}
                  </div>
                )}
              </motion.div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(15,23,42,0.06)' }} />
            <span style={{ fontSize: 11, color: '#94A3B8', letterSpacing: '0.06em' }}>{t('new.divider')}</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(15,23,42,0.06)' }} />
          </div>

          {/* Quick templates */}
          <div style={{ marginBottom: 24 }}>
            <p style={LABEL}>{t('new.templates.label')}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {QUICK_TEMPLATES.map((tmpl, i) => (
                <motion.button key={t(`new.templates.items.${tmpl.id}.label`)} type="button" onClick={() => handleTemplate(tmpl)}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{
                    padding: '5px 14px', borderRadius: 20, border: '1px solid rgba(15,23,42,0.18)',
                    fontSize: 12, fontWeight: 500, cursor: 'pointer', background: '#fff', color: '#475569',
                    transition: 'all 120ms ease',
                  }}
                  onMouseEnter={e => { const b = e.currentTarget; b.style.borderColor = TEAL; b.style.color = TEAL; b.style.background = 'rgba(2,128,144,0.04)' }}
                  onMouseLeave={e => { const b = e.currentTarget; b.style.borderColor = 'rgba(15,23,42,0.12)'; b.style.color = '#475569'; b.style.background = '#fff' }}>
                  {t(`new.templates.items.${tmpl.id}.label`)}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Title */}
<div>
  <label style={LABEL}>{t('new.form.titleLabel')} <span style={{ color: '#EF4444' }}>*</span></label>
  <div style={{ position: 'relative' }}>
    <input type="text" value={data.title}
      onChange={e => setData('title', e.target.value)}
      placeholder={t('new.form.titlePlaceholder')}
      required style={{ ...INPUT, paddingRight: aiPreview?.suggested_title && !data.title ? 52 : undefined, textOverflow: 'ellipsis', overflow: 'hidden' }}
      onFocus={e => { e.target.style.borderColor = TEAL }}
      onBlur={e => { e.target.style.borderColor = 'rgba(15,23,42,0.12)' }}
    />
    {aiPreview?.suggested_title && !data.title && (
      <button
        type="button"
        onClick={() => setData('title', aiPreview.suggested_title!)}
        title={t('new.form.generateTitle')}
        style={{
          position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
          width: 28, height: 28, borderRadius: 6, border: '1px solid rgba(2,128,144,0.25)',
          background: 'rgba(2,128,144,0.07)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="#028090" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    )}
  </div>
  {errors.title && <p style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>{errors.title}</p>}
</div>

            {/* Description */}
            <div>
              <label style={LABEL}>{t('new.form.descriptionLabel')}</label>
              <textarea value={data.description}
                onChange={e => setData('description', e.target.value)}
                placeholder={t('new.form.descriptionPlaceholder')}
                rows={4}
                style={{ ...INPUT, resize: 'none', lineHeight: 1.75 }}
                onFocus={e => { e.target.style.borderColor = TEAL }}
                onBlur={e => { e.target.style.borderColor = 'rgba(15,23,42,0.12)' }}
              />
            </div>

            {/* Department + Priority */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>

              {/* Department */}
              <div>
                <label style={LABEL}>{t('new.form.departmentLabel')} <span style={{ color: '#EF4444' }}>*</span></label>
                <select value={data.department_id}
                  onChange={e => setData('department_id', e.target.value)}
                  required style={INPUT}
                  onFocus={e => { e.target.style.borderColor = TEAL }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(15,23,42,0.12)' }}>
                  <option value="">{t('new.form.departmentPlaceholder')}</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{departmentName(d.name)}</option>)}
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
                      {departmentName(d.name)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority */}
              <div>
                <label style={LABEL}>{t('new.form.priorityLabel')}</label>
                <select value={data.priority}
                  onChange={e => setData('priority', e.target.value as TicketPriority)}
                  style={INPUT}
                  onFocus={e => { e.target.style.borderColor = TEAL }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(15,23,42,0.12)' }}>
                  <option value="">{t('new.form.priorityPlaceholder')}</option>
                  {PRIORITY_OPTIONS.map(p => <option key={p.value} value={p.value}>{t(`priority.${p.value}`)}</option>)}
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
                      {t(`priority.${p.value}`)}
                    </button>
                  ))}
                </div>
                <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 6 }}>{t('new.form.priorityHelper')}</p>
              </div>
            </div>

          {/* Attachments */}
            <div onPaste={handlePaste}>
              <label style={LABEL}>{t('new.form.attachmentsLabel')}</label>

              {/* Hidden inputs */}
              <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.txt"
                style={{ display: 'none' }}
                onChange={e => { if (e.target.files) { handleFiles(e.target.files); setShowAttachmentModal(false) } }} />
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment"
                style={{ display: 'none' }}
                onChange={e => { if (e.target.files) { handleFiles(e.target.files); setShowAttachmentModal(false) } }} />
              <input ref={galleryInputRef} type="file" multiple accept="image/*"
                style={{ display: 'none' }}
                onChange={e => { if (e.target.files) { handleFiles(e.target.files); setShowAttachmentModal(false) } }} />

              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => setShowAttachmentModal(true)}
                style={{
                  border: `2px dashed ${dragOver ? TEAL : 'rgba(15,23,42,0.10)'}`,
                  borderRadius: 8, padding: '18px 24px', textAlign: 'center',
                  background: dragOver ? 'rgba(2,128,144,0.04)' : '#FAFAFA',
                  cursor: 'pointer', transition: 'all 120ms ease',
                }}>
                <svg width="22" height="22" fill="none" stroke={dragOver ? TEAL : '#CBD5E1'} viewBox="0 0 24 24" style={{ marginBottom: 8 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p style={{ fontSize: 13, color: '#64748B', marginBottom: 2 }}>
                  {t('new.form.dropzone')}<span style={{ color: TEAL, fontWeight: 600 }}>{t('new.form.dropzoneAction')}</span>
                </p>
                <p style={{ fontSize: 11, color: '#CBD5E1' }}>{t('new.form.dropzoneHint')}</p>
              </div>

              {/* Previews */}
              {previews.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                  {previews.map((p, i) => (
                    <div key={i} style={{ position: 'relative', width: 72, height: 72, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(15,23,42,0.10)' }}>
                      {p.type.startsWith('image/') ? (
                        <img src={p.url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 4 }}>
                          <svg width="20" height="20" fill="none" stroke="#64748B" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span style={{ fontSize: 9, color: '#64748B', textAlign: 'center', padding: '0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 64 }}>{p.name.slice(0, 10)}</span>
                        </div>
                      )}
                      <button type="button" onClick={e => { e.stopPropagation(); removeAttachment(i) }}
                        style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: '50%', background: 'rgba(15,23,42,0.6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="#fff" strokeWidth="1.5">
                          <path d="M1 1l6 6M7 1L1 7" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Attachment Modal */}
            <AnimatePresence>
              {showAttachmentModal && (
                <>
                  {/* Backdrop */}
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setShowAttachmentModal(false)}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(13,27,42,0.5)', zIndex: 50, backdropFilter: 'blur(4px)' }} />

                  {/* Modal */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    style={{
                      position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                      zIndex: 51, background: '#fff', borderRadius: 16, width: 340,
                      boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08)',
                      overflow: 'hidden',
                    }}>

                    {/* Modal header */}
                    <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ fontSize: 10.5, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 2 }}>{t('new.attachmentModal.eyebrow')}</p>
                          <p style={{ fontSize: 16, fontWeight: 700, color: NAVY, letterSpacing: '-0.02em' }}>{t('new.attachmentModal.title')}</p>
                        </div>
                        <button type="button" onClick={() => setShowAttachmentModal(false)}
                          style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: '#F1F5F9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#64748B" strokeWidth="2">
                            <path d="M1 1l10 10M11 1L1 11" strokeLinecap="round" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Options */}
                    <div style={{ padding: '12px 16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>

                     {isMobile ? (
                        <>
                          {/* Mobile: Take Photo */}
                          <button type="button" onClick={() => cameraInputRef.current?.click()}
                            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12, border: '1px solid rgba(15,23,42,0.08)', background: '#fff', cursor: 'pointer', transition: 'all 120ms ease', textAlign: 'left', width: '100%' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#F0FDFA'; e.currentTarget.style.borderColor = TEAL }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'rgba(15,23,42,0.08)' }}>
                            <div style={{ width: 42, height: 42, borderRadius: 10, background: 'linear-gradient(135deg, #028090, #02C39A)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <svg width="20" height="20" fill="none" stroke="#fff" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </div>
                            <div>
                              <p style={{ fontSize: 14, fontWeight: 600, color: NAVY, marginBottom: 2 }}>{t('new.attachmentModal.takePhoto.title')}</p>
                              <p style={{ fontSize: 12, color: '#94A3B8' }}>{t('new.attachmentModal.takePhoto.description')}</p>
                            </div>
                          </button>

                          {/* Mobile: Gallery */}
                          <button type="button" onClick={() => galleryInputRef.current?.click()}
                            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12, border: '1px solid rgba(15,23,42,0.08)', background: '#fff', cursor: 'pointer', transition: 'all 120ms ease', textAlign: 'left', width: '100%' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#F0FDFA'; e.currentTarget.style.borderColor = TEAL }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'rgba(15,23,42,0.08)' }}>
                            <div style={{ width: 42, height: 42, borderRadius: 10, background: 'linear-gradient(135deg, #7C3AED, #A855F7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <svg width="20" height="20" fill="none" stroke="#fff" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div>
                              <p style={{ fontSize: 14, fontWeight: 600, color: NAVY, marginBottom: 2 }}>{t('new.attachmentModal.chooseGallery.title')}</p>
                              <p style={{ fontSize: 12, color: '#94A3B8' }}>{t('new.attachmentModal.chooseGallery.description')}</p>
                            </div>
                          </button>

                          {/* Mobile: Upload File */}
                          <button type="button" onClick={() => fileInputRef.current?.click()}
                            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12, border: '1px solid rgba(15,23,42,0.08)', background: '#fff', cursor: 'pointer', transition: 'all 120ms ease', textAlign: 'left', width: '100%' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#F0FDFA'; e.currentTarget.style.borderColor = TEAL }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'rgba(15,23,42,0.08)' }}>
                            <div style={{ width: 42, height: 42, borderRadius: 10, background: 'linear-gradient(135deg, #EA580C, #F97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <svg width="20" height="20" fill="none" stroke="#fff" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                              </svg>
                            </div>
                            <div>
                              <p style={{ fontSize: 14, fontWeight: 600, color: NAVY, marginBottom: 2 }}>{t('new.attachmentModal.uploadFileMobile.title')}</p>
                              <p style={{ fontSize: 12, color: '#94A3B8' }}>{t('new.attachmentModal.uploadFileMobile.description')}</p>
                            </div>
                          </button>
                        </>
                      ) : (
                        <>
                          {/* Desktop: Upload Files */}
                          <button type="button" onClick={() => fileInputRef.current?.click()}
                            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12, border: '1px solid rgba(15,23,42,0.08)', background: '#fff', cursor: 'pointer', transition: 'all 120ms ease', textAlign: 'left', width: '100%' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#F0FDFA'; e.currentTarget.style.borderColor = TEAL }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'rgba(15,23,42,0.08)' }}>
                            <div style={{ width: 42, height: 42, borderRadius: 10, background: 'linear-gradient(135deg, #028090, #02C39A)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <svg width="20" height="20" fill="none" stroke="#fff" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                            </div>
                            <div>
                              <p style={{ fontSize: 14, fontWeight: 600, color: NAVY, marginBottom: 2 }}>{t('new.attachmentModal.uploadFiles.title')}</p>
                              <p style={{ fontSize: 12, color: '#94A3B8' }}>{t('new.attachmentModal.uploadFiles.description')}</p>
                            </div>
                          </button>

                          {/* Desktop: Upload Image */}
                          <button type="button" onClick={() => galleryInputRef.current?.click()}
                            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12, border: '1px solid rgba(15,23,42,0.08)', background: '#fff', cursor: 'pointer', transition: 'all 120ms ease', textAlign: 'left', width: '100%' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#F0FDFA'; e.currentTarget.style.borderColor = TEAL }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'rgba(15,23,42,0.08)' }}>
                            <div style={{ width: 42, height: 42, borderRadius: 10, background: 'linear-gradient(135deg, #7C3AED, #A855F7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <svg width="20" height="20" fill="none" stroke="#fff" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div>
                              <p style={{ fontSize: 14, fontWeight: 600, color: NAVY, marginBottom: 2 }}>{t('new.attachmentModal.uploadImage.title')}</p>
                              <p style={{ fontSize: 12, color: '#94A3B8' }}>{t('new.attachmentModal.uploadImage.description')}</p>
                            </div>
                          </button>

                        </>
                      )}

                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button type="submit" disabled={!canSubmit}
              whileHover={canSubmit ? { scale: 1.008 } : {}}
              whileTap={canSubmit ? { scale: 0.995 } : {}}
              style={{
                width: '100%', padding: '13px 24px',
                background: canSubmit
                  ? `linear-gradient(135deg, ${TEAL}, #026E7A)`
                  : 'linear-gradient(135deg, #F1F5F9, #E8EEF4)',
                border: canSubmit ? 'none' : `1.5px solid rgba(2,128,144,0.20)`,
                borderRadius: 8, fontSize: 14, fontWeight: 600,
                color: canSubmit ? '#fff' : '#94A3B8',
                cursor: canSubmit ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 200ms ease',
                boxShadow: canSubmit
                  ? '0 4px 12px rgba(2,128,144,0.30), 0 1px 3px rgba(0,0,0,0.08)'
                  : 'inset 0 1px 2px rgba(0,0,0,0.04)',
                letterSpacing: canSubmit ? '-0.01em' : '0',
              }}>
              <BoltIcon size={15} color={canSubmit ? '#fff' : '#B8C4CE'} />
              {processing ? t('new.form.submitting') : t('new.form.submit')}
            </motion.button>

            <div style={{ textAlign: 'center' }}>
              <button type="button" onClick={() => router.get('/tickets')}
                style={{ background: 'none', border: 'none', fontSize: 13, color: '#94A3B8', cursor: 'pointer' }}>
                {t('new.form.cancel')}
              </button>
            </div>
          </form>
        </div>

        {/* ── Right sidebar — single #FAFAFA surface ───────────────────────── */}
        <div style={{ width: isMobile ? '100%' : isTablet ? 220 : 264, flexShrink: 0, background: '#FAFAFA', borderRadius: 12, border: '1px solid rgba(15,23,42,0.07)', overflow: 'hidden', order: isMobile ? -1 : 0 }}>

          {/* AI PREVIEW */}
          <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
              <div style={{ position: 'relative', width: 8, height: 8 }}>
                <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: MINT, opacity: aiLoading ? 1 : 0.9 }} />
                {aiLoading && (
                  <span style={{ position: 'absolute', inset: -2, borderRadius: '50%', border: `2px solid ${MINT}`, animation: 'ping 1s cubic-bezier(0,0,0.2,1) infinite', opacity: 0.4 }} />
                )}
              </div>
              <p style={{ fontSize: 10.5, fontWeight: 700, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.09em' }}>
                {t('new.aiPreview.eyebrow')}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {aiPreview ? (
                <motion.div key="preview-data"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}>

                  {/* Category */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 12, color: '#64748B' }}>{t('new.aiPreview.category')}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 10px', borderRadius: 20, background: 'rgba(2,128,144,0.10)', color: TEAL }}>
                      {aiPreview.category} · {aiPreview.category_conf}%
                    </span>
                  </div>

                  {/* Priority */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 12, color: '#64748B' }}>{t('new.aiPreview.priority')}</span>
                    <span style={{
                      fontSize: 12, fontWeight: 600, padding: '2px 10px', borderRadius: 20,
                      background: PRIORITY_OPTIONS.find(p => p.value === aiPreview.priority)?.bg ?? '#F1F5F9',
                      color: priorityColor(aiPreview.priority)
                    }}>
                      {t(`priority.${aiPreview.priority}`)} · {aiPreview.priority_conf}%
                    </span>
                  </div>

                  {/* Est. SLA */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 12, color: '#64748B' }}>{t('new.aiPreview.estSla')}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: NAVY }}>
                      {aiPreview.est_sla_hours < 24
  ? t('new.aiPreview.hour', { count: aiPreview.est_sla_hours })
  : t('new.aiPreview.day', { count: aiPreview.est_sla_hours / 24 })}
                    </span>
                  </div>

                  {/* Urgency bar */}
                  <div style={{ marginBottom: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 12, color: '#64748B' }}>{t('new.aiPreview.urgency')}</span>
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

                  <p style={{ fontSize: 11, color: '#CBD5E1', marginTop: 10 }}>{t('new.aiPreview.hint')}</p>
                </motion.div>
              ) : (
                <motion.div key="preview-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <p style={{ fontSize: 12, color: '#94A3B8', lineHeight: 1.6 }}>
                    {t('new.aiPreview.empty')}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* AI WILL DETECT */}
          <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
            <p style={{ ...LABEL, marginBottom: 10 }}>{t('new.aiWillDetect.label')}</p>
            {[
              t('new.aiWillDetect.items.categoryRouting'),
              t('new.aiWillDetect.items.urgencyScore'),
              t('new.aiWillDetect.items.similarTickets'),
              t('new.aiWillDetect.items.suggestedResponse'),
              t('new.aiWillDetect.items.slaDeadline'),
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
              <p style={{ ...LABEL, marginBottom: 10 }}>{t('new.recentTickets')}</p>
              {recent_tickets.map(ticket => (
                <button key={ticket.id} type="button" onClick={() => router.get(`/tickets/${ticket.id}`)}
                  style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '7px 6px', borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', marginBottom: 2, transition: 'background 120ms ease', textAlign: 'left' }}
                  onMouseEnter={e => { (e.currentTarget).style.background = 'rgba(15,23,42,0.04)' }}
                  onMouseLeave={e => { (e.currentTarget).style.background = 'none' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: TEAL, fontFamily: 'monospace', marginBottom: 2 }}>{ticket.ticket_number}</p>
                    <p style={{ fontSize: 11, color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ticket.title}</p>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, color: STATUS_COLORS[ticket.status] ?? '#94A3B8', textTransform: 'capitalize', flexShrink: 0, marginLeft: 6, marginTop: 1 }}>
                    {t(`status.${ticket.status}`, { defaultValue: ticket.status.replace(/_/g, ' ') })}
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