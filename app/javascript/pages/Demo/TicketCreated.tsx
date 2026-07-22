import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface Props { ticket_number: string }

function IconCheck() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#02C39A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function IconSparkle() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
  )
}

function IconArrowUp() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  )
}

const STEPS = [
  { label: 'Ticket received',       delay: 0.1 },
  { label: 'AI classification',     delay: 0.6 },
  { label: 'Priority assigned',     delay: 1.1 },
  { label: 'Agent routing',         delay: 1.6 },
]

export default function DemoTicketCreated({ ticket_number }: Props) {
  const [visibleSteps, setVisibleSteps] = useState(0)

  useEffect(() => {
    const timers = STEPS.map((step, idx) =>
      setTimeout(() => setVisibleSteps(idx + 1), step.delay * 1000 + 400)
    )
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0D1B2A',
      fontFamily: 'Inter, system-ui, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 24px',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Background grid */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `linear-gradient(rgba(2,128,144,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(2,128,144,0.04) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }} />

      {/* Glow */}
      <div style={{
        position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 400, height: 400,
        background: 'radial-gradient(circle, rgba(2,195,154,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>

        {/* Success icon */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 350, damping: 20, delay: 0.1 }}
          style={{ position: 'relative' }}
        >
          <motion.div
            animate={{ boxShadow: ['0 0 0 0 rgba(2,195,154,0.3)', '0 0 0 20px rgba(2,195,154,0)', '0 0 0 0 rgba(2,195,154,0)'] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'rgba(2,195,154,0.1)',
              border: '1.5px solid rgba(2,195,154,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <IconCheck />
          </motion.div>
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          style={{ textAlign: 'center' }}
        >
          <p style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
            Ticket submitted
          </p>
          <p style={{ fontSize: 13, color: '#475569', margin: 0, lineHeight: 1.6 }}>
            Your ticket is being processed by AI right now
          </p>
        </motion.div>

        {/* Ticket number */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          style={{
            background: 'rgba(2,128,144,0.08)',
            border: '1px solid rgba(2,128,144,0.25)',
            borderRadius: 12,
            padding: '16px 32px',
            textAlign: 'center',
            width: '100%',
          }}
        >
          <p style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' as const, letterSpacing: '0.1em', margin: '0 0 6px' }}>
            Ticket number
          </p>
          <p style={{ fontSize: 28, fontWeight: 800, color: '#028090', fontFamily: 'monospace', margin: 0, letterSpacing: '0.04em' }}>
            {ticket_number}
          </p>
        </motion.div>

        {/* AI pipeline steps */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '20px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          <p style={{ fontSize: 11, fontWeight: 700, color: '#334155', textTransform: 'uppercase' as const, letterSpacing: '0.1em', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#028090' }}><IconSparkle /></span>
            AI Pipeline
          </p>

          {STEPS.map((step, idx) => {
            const done    = visibleSteps > idx
            const active  = visibleSteps === idx

            return (
              <motion.div
                key={step.label}
                initial={{ opacity: 0, x: -8 }}
                animate={done || active ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.3 }}
                style={{ display: 'flex', alignItems: 'center', gap: 12 }}
              >
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  background: done ? 'rgba(2,195,154,0.12)' : 'rgba(255,255,255,0.04)',
                  border: `1.5px solid ${done ? 'rgba(2,195,154,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.3s',
                }}>
                  {done ? (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#02C39A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'inline-block' }} />
                  )}
                </div>
                <span style={{ fontSize: 13, fontWeight: done ? 600 : 400, color: done ? '#E2E8F0' : '#334155', transition: 'all 0.3s' }}>
                  {step.label}
                </span>
                {done && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: '#02C39A', background: 'rgba(2,195,154,0.08)', padding: '2px 8px', borderRadius: 4 }}
                  >
                    Done
                  </motion.span>
                )}
              </motion.div>
            )
          })}
        </motion.div>

        {/* Look up CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.2 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', delay: 2.4 }}
            style={{ color: '#028090' }}
          >
            <IconArrowUp />
          </motion.div>
          <p style={{ fontSize: 13, color: '#475569', textAlign: 'center' as const, margin: 0, lineHeight: 1.6 }}>
            Look at the screen —<br />
            <span style={{ color: '#94A3B8', fontWeight: 600 }}>your ticket just appeared</span>
          </p>
        </motion.div>

        {/* Footer */}
        <p style={{ fontSize: 11, color: '#64748B', margin: 0, textAlign: 'center' as const }}>
          VoltDesk AI · Read-only demo
        </p>
      </div>
    </div>
  )
}