import { useState, useEffect } from 'react'
import { router } from '@inertiajs/react'
import { motion, AnimatePresence } from 'framer-motion'

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
  Low:      { color: '#6B7280', bg: 'rgba(107,114,128,0.08)',  border: 'rgba(107,114,128,0.4)',  dot: '#6B7280' },
  Medium:   { color: '#CA8A04', bg: 'rgba(202,138,4,0.08)',    border: 'rgba(202,138,4,0.4)',    dot: '#EAB308' },
  High:     { color: '#EA580C', bg: 'rgba(234,88,12,0.08)',    border: 'rgba(234,88,12,0.4)',    dot: '#F97316' },
  Critical: { color: '#DC2626', bg: 'rgba(220,38,38,0.08)',    border: 'rgba(220,38,38,0.4)',    dot: '#EF4444' },
}

const DEPT_COLORS: Record<string, string> = {
  IT:         '#028090',
  HR:         '#8B5CF6',
  Facilities: '#F97316',
  Finance:    '#16A34A',
  Operations: '#2563EB',
  General:    '#6B7280',
}

function IconMonitor() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
    </svg>
  )
}

function IconUsers() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}

function IconBuilding() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )
}

function IconDollar() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  )
}

function IconSettings() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
    </svg>
  )
}

function IconFile() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
    </svg>
  )
}

function IconArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  )
}

function IconSpinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  )
}

const DEPT_ICONS: Record<string, React.ReactNode> = {
  IT:         <IconMonitor />,
  HR:         <IconUsers />,
  Facilities: <IconBuilding />,
  Finance:    <IconDollar />,
  Operations: <IconSettings />,
  General:    <IconFile />,
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

export default function DemoCreateTicket({ workspace_name, expires_in, guest_count, departments }: Props) {
  const [description,  setDescription]  = useState('')
  const [selectedDept, setSelectedDept] = useState<number | null>(null)
  const [priority,     setPriority]     = useState<Priority | null>(null)
  const [submitting,   setSubmitting]   = useState(false)
  const [secondsLeft,  setSecondsLeft]  = useState(expires_in)

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

  function handleSubmit() {
    if (!description.trim() || !selectedDept || !priority) return
    setSubmitting(true)
    router.post('/demo/ticket', {
      ticket: {
        title:         description.trim().slice(0, 120),
        description:   description.trim(),
        department_id: selectedDept,
        priority:      priority.toLowerCase(),
      },
    })
  }

  if (secondsLeft <= 0) {
    return (
      <div style={{ minHeight: '100vh', background: '#0D1B2A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Inter, system-ui, sans-serif' }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', maxWidth: 320 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
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

  return (
    <div style={{ minHeight: '100vh', background: '#0D1B2A', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* Top accent line */}
      <div style={{ height: 2, background: 'linear-gradient(90deg,#028090,#02C39A)', flexShrink: 0 }} />

      {/* Header */}
      <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 800, margin: 0, background: 'linear-gradient(135deg,#028090,#02C39A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            PulseDesk AI
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
      <div style={{ flex: 1, padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Description */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' as const, letterSpacing: '0.1em', display: 'block', marginBottom: 10 }}>
            Issue description
          </label>
          <textarea
            value={description}
            onChange={evt => setDescription(evt.target.value)}
            maxLength={300}
            rows={4}
            placeholder="Describe any workplace issue you're experiencing…"
            style={{
              width: '100%',
              padding: '14px 16px',
              border: `1.5px solid ${description.trim().length > 0 ? '#028090' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 12,
              fontSize: 15,
              color: '#0F172A',
              background: '#fff',
              resize: 'none',
              outline: 'none',
              boxSizing: 'border-box' as const,
              lineHeight: 1.6,
              fontFamily: 'Inter, system-ui, sans-serif',
              transition: 'border-color 0.2s',
            }}
          />
          <p style={{ fontSize: 11, color: '#1E293B', margin: '6px 0 0', textAlign: 'right' as const, fontVariantNumeric: 'tabular-nums' }}>
            {description.length}/300
          </p>
        </div>

        {/* Department */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' as const, letterSpacing: '0.1em', display: 'block', marginBottom: 10 }}>
            Department
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {departments.map(dept => {
              const active  = selectedDept === dept.id
              const dColor  = DEPT_COLORS[dept.name] ?? '#6B7280'
              const dIcon   = DEPT_ICONS[dept.name] ?? <IconFile />
              return (
                <motion.button
                  key={dept.id}
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedDept(dept.id)}
                  style={{
                    padding: '13px 14px',
                    borderRadius: 10,
                    border: `1.5px solid ${active ? dColor : 'rgba(255,255,255,0.07)'}`,
                    background: active ? `${dColor}18` : 'rgba(255,255,255,0.03)',
                    color: active ? dColor : '#475569',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    fontFamily: 'Inter, system-ui, sans-serif',
                    transition: 'all 0.15s',
                    textAlign: 'left' as const,
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
                    padding: '12px 6px',
                    borderRadius: 10,
                    border: `1.5px solid ${active ? meta.border : 'rgba(255,255,255,0.07)'}`,
                    background: active ? meta.bg : 'rgba(255,255,255,0.03)',
                    color: active ? meta.color : '#334155',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column' as const,
                    alignItems: 'center',
                    gap: 6,
                    fontFamily: 'Inter, system-ui, sans-serif',
                    transition: 'all 0.15s',
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
            width: '100%',
            padding: '17px',
            background: canSubmit ? 'linear-gradient(135deg,#028090,#02C39A)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${canSubmit ? 'transparent' : 'rgba(255,255,255,0.06)'}`,
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 700,
            color: canSubmit ? '#fff' : '#1E293B',
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            fontFamily: 'Inter, system-ui, sans-serif',
            boxShadow: canSubmit ? '0 8px 24px rgba(2,128,144,0.3)' : 'none',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
          }}
        >
          {submitting ? (
            <>
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{ display: 'flex' }}
              >
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
    </div>
  )
}