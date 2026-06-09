import { useState, useEffect } from 'react'
import { router } from '@inertiajs/react'
import { motion } from 'framer-motion'

interface Department { id: number; name: string }

interface Props {
  workspace_name: string
  expires_in:     number
  guest_count:    number
  departments:    Department[]
}

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'] as const
type Priority = typeof PRIORITIES[number]

const PRIORITY_STYLES: Record<Priority, { color: string; bg: string }> = {
  Low:      { color: '#6B7280', bg: '#F1F5F9' },
  Medium:   { color: '#CA8A04', bg: '#FEF9C3' },
  High:     { color: '#EA580C', bg: '#FFF7ED' },
  Critical: { color: '#DC2626', bg: '#FEF2F2' },
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
    if (!description.trim() || !selectedDept) return
    setSubmitting(true)
    router.post('/demo/ticket', {
      ticket: {
        title:         description.trim().slice(0, 120),
        description:   description.trim(),
        department_id: selectedDept,
        priority:      priority?.toLowerCase() ?? 'medium',
      },
    }, { onFinish: () => setSubmitting(false) })
  }

  if (secondsLeft <= 0) {
    return (
      <div style={{ minHeight: '100vh', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 32, textAlign: 'center' as const, maxWidth: 320, width: '100%' }}>
          <p style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>Demo finalizada</p>
          <p style={{ fontSize: 14, color: '#475569' }}>Gracias por participar.</p>
        </div>
      </div>
    )
  }

  const canSubmit = description.trim().length > 0 && selectedDept !== null && !submitting

  return (
    <div style={{ minHeight: '100vh', background: '#0F172A', fontFamily: 'system-ui, sans-serif' }}>

      <div style={{ background: '#0F172A', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0 }}>PulseDesk AI Demo</p>
        <p style={{ fontSize: 13, color: '#028090', margin: '2px 0 0' }}>
          Guest Session · <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatTime(secondsLeft)}</span> remaining
        </p>
      </div>

      <div style={{ background: 'linear-gradient(135deg,#028090,#026E7A)', padding: '18px 20px' }}>
        <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>You're in live demo mode</p>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', margin: 0 }}>Create a ticket and watch it get classified by AI in real time</p>
      </div>

      <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        <textarea
          value={description}
          onChange={evt => setDescription(evt.target.value)}
          rows={5}
          placeholder={'Describe any workplace issue...\nExample: The printer on floor 3 is not working'}
          style={{ width: '100%', padding: '14px 16px', border: '1px solid #1E293B', borderRadius: 12, fontSize: 16, color: '#0F172A', background: '#fff', resize: 'none', outline: 'none', boxSizing: 'border-box', lineHeight: 1.6 }}
        />

        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#94A3B8', marginBottom: 12 }}>Department</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 10 }}>
            {departments.map(dept => {
              const active = selectedDept === dept.id
              return (
                <button key={dept.id} type="button" onClick={() => setSelectedDept(dept.id)}
                  style={{ padding: '12px 8px', borderRadius: 10, border: `2px solid ${active ? '#028090' : '#1E293B'}`, background: active ? '#028090' : 'transparent', color: active ? '#fff' : '#94A3B8', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
                  {dept.name}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#94A3B8', marginBottom: 12 }}>Priority</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {PRIORITIES.map(prio => {
              const active = priority === prio
              const pStyles = PRIORITY_STYLES[prio]
              return (
                <button key={prio} type="button" onClick={() => setPriority(prio)}
                  style={{ flex: 1, padding: '12px 4px', borderRadius: 10, border: `2px solid ${active ? pStyles.color : '#1E293B'}`, background: active ? pStyles.bg : 'transparent', color: active ? pStyles.color : '#94A3B8', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
                  {prio}
                </button>
              )
            })}
          </div>
          <p style={{ fontSize: 12, color: '#475569', marginTop: 8 }}>⚡ AI will adjust this</p>
        </div>

        <div>
          <motion.button
            type="button"
            disabled={!canSubmit}
            onClick={handleSubmit}
            whileTap={{ scale: 0.97 }}
            style={{ width: '100%', padding: '18px', background: canSubmit ? '#028090' : '#1E293B', border: 'none', borderRadius: 12, fontSize: 17, fontWeight: 700, color: canSubmit ? '#fff' : '#475569', cursor: canSubmit ? 'pointer' : 'not-allowed', transition: 'background 0.2s' }}>
            {submitting ? 'Sending…' : 'Submit Ticket →'}
          </motion.button>
          <p style={{ textAlign: 'center' as const, fontSize: 12, color: '#475569', marginTop: 8 }}>Watch AI classify it in seconds</p>
        </div>

        <p style={{ textAlign: 'center' as const, fontSize: 12, color: '#334155' }}>Read-only demo — no account required</p>
      </div>
    </div>
  )
}
