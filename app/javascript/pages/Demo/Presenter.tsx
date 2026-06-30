import { useState, useEffect, useRef } from 'react'
import { router } from '@inertiajs/react'
import QRCode from 'qrcode'
import { motion, AnimatePresence } from 'framer-motion'
import { useActionCable } from '@/hooks/useActionCable'

interface LiveTicket {
  id:            number
  ticket_number: string
  title:         string
  department:    string
  priority:      'low' | 'medium' | 'high' | 'critical'
  created_at:    string
}

interface Props {
  token:          string
  workspace_name: string
}

const PRIORITY_COLORS: Record<string, string> = {
  critical: '#EF4444',
  high:     '#F97316',
  medium:   '#EAB308',
  low:      '#6B7280',
}

const PRIORITY_BG: Record<string, string> = {
  critical: 'rgba(239,68,68,0.12)',
  high:     'rgba(249,115,22,0.12)',
  medium:   'rgba(234,179,8,0.12)',
  low:      'rgba(107,114,128,0.12)',
}

const DEPT_COLORS: Record<string, string> = {
  IT:         '#028090',
  HR:         '#8B5CF6',
  Facilities: '#F97316',
  Finance:    '#16A34A',
  Operations: '#2563EB',
  General:    '#6B7280',
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60)   return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60).toString().padStart(2, '0')
  const s = (secs % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function PulseDot({ color = '#028090', size = 10 }: { color?: string; size?: number }) {
  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size, height: size, flexShrink: 0 }}>
      <motion.span
        animate={{ scale: [1, 2.2, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
        style={{ position: 'absolute', width: size, height: size, borderRadius: '50%', background: color }}
      />
      <span style={{ width: size * 0.6, height: size * 0.6, borderRadius: '50%', background: color, display: 'inline-block' }} />
    </span>
  )
}

function AnimatedNumber({ value, style }: { value: number; style?: React.CSSProperties }) {
  const [display, setDisplay] = useState(value)
  const prev = useRef(value)

  useEffect(() => {
    if (value === prev.current) return
    const diff  = value - prev.current
    const steps = Math.min(Math.abs(diff), 10)
    let step    = 0
    const interval = setInterval(() => {
      step++
      setDisplay(Math.round(prev.current + (diff * step) / steps))
      if (step >= steps) { clearInterval(interval); prev.current = value }
    }, 40)
    return () => clearInterval(interval)
  }, [value])

  return <span style={style}>{display}</span>
}

export default function DemoPresenter({ token, workspace_name }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(1800)
  const [guestCount,  setGuestCount]  = useState(0)
  const [tickets,     setTickets]     = useState<LiveTicket[]>([])
  const [qrDataUrl,   setQrDataUrl]   = useState('')
  const [totalCount,  setTotalCount]  = useState(0)
  const [, setTick]                   = useState(0)

  const demoUrl = `${window.location.origin}/demo/${token}`

  useEffect(() => {
    QRCode.toDataURL(demoUrl, {
      width: 360, margin: 2,
      color: { dark: '#0F172A', light: '#FFFFFF' },
    }).then(setQrDataUrl).catch(console.error)
  }, [demoUrl])

  useEffect(() => {
    if (secondsLeft <= 0) return
    const id = setInterval(() => setSecondsLeft(prev => prev - 1), 1000)
    return () => clearInterval(id)
  }, [secondsLeft])

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 10_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    fetch(`/workspace_admin/demo/status?token=${token}`, {
      headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
    })
      .then(res => res.ok ? res.json() : null)
      .then(json => {
        if (!json) return
        if (json.guest_count !== undefined) setGuestCount(json.guest_count)
        if (json.expires_in  !== undefined) setSecondsLeft(json.expires_in)
        if (json.tickets) { setTickets(json.tickets); setTotalCount(json.tickets.length) }
      })
      .catch(console.error)
  }, [token])

  useActionCable(
    { channel: 'DemoChannel', token },
    (data) => {
      if (data.type === 'ticket_created') {
        const ticket = data as unknown as LiveTicket & { type: string }
        setTickets(prev => [ticket, ...prev].slice(0, 12))
        setTotalCount(prev => prev + 1)
      }
      if (data.type === 'guest_joined') {
        const count = data.guest_count
        if (typeof count === 'number') setGuestCount(count)
      }
    }
  )

  function handleEndDemo() {
    if (!confirm('End demo session? All guests will lose access immediately.')) return
    router.delete('/workspace_admin/demo/deactivate', { data: { token } })
  }

  const deptCounts: Record<string, number> = {}
  tickets.forEach(t => { deptCounts[t.department] = (deptCounts[t.department] ?? 0) + 1 })
  const topDept   = Object.entries(deptCounts).sort((a, b) => b[1] - a[1])[0]
  const isLowTime = secondsLeft < 300
  const guestPct  = Math.min((guestCount / 50) * 100, 100)

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0D1B2A',
      color: '#fff',
      fontFamily: 'Inter, system-ui, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Background grid */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `linear-gradient(rgba(2,128,144,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(2,128,144,0.04) 1px, transparent 1px)`,
        backgroundSize: '56px 56px',
      }} />

      {/* Radial glow center */}
      <div style={{
        position: 'absolute', top: '35%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 700, height: 700,
        background: 'radial-gradient(circle, rgba(2,128,144,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Top accent line */}
      <div style={{ height: 3, background: 'linear-gradient(90deg,#028090,#02C39A,#028090)', flexShrink: 0, position: 'relative', zIndex: 1 }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 32px', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'relative', zIndex: 1, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16, fontWeight: 800, background: 'linear-gradient(135deg,#028090,#02C39A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            VoltDesk AI
          </span>
          <span style={{ fontSize: 13, color: '#334155', fontWeight: 500 }}>· {workspace_name}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(2,195,154,0.08)', border: '1px solid rgba(2,195,154,0.2)', borderRadius: 999, padding: '6px 16px' }}>
          <PulseDot color="#02C39A" size={8} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#02C39A', letterSpacing: '0.06em' }}>QR DEMO MODE ACTIVE</span>
        </div>

        <button
          onClick={handleEndDemo}
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, color: '#EF4444', cursor: 'pointer', fontFamily: 'Inter, system-ui, sans-serif' }}
        >
          End Session
        </button>
      </div>

      {/* Main — centered layout */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 40px 24px', position: 'relative', zIndex: 1, gap: 32 }}>

        {/* Top stats row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 48, justifyContent: 'center' }}>

          {/* Timer */}
          <div style={{ textAlign: 'center' }}>
            <motion.p
              animate={isLowTime ? { scale: [1, 1.03, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
              style={{
                fontSize: 72,
                fontWeight: 800,
                color: isLowTime ? '#EF4444' : '#02C39A',
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1,
                margin: 0,
                letterSpacing: '-0.03em',
              }}
            >
              {formatTime(secondsLeft)}
            </motion.p>
            <p style={{ fontSize: 11, color: '#334155', marginTop: 8, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>Session expires in</p>
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 64, background: 'rgba(255,255,255,0.06)' }} />

          {/* Guests */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, justifyContent: 'center' }}>
              <AnimatedNumber
                value={guestCount}
                style={{ fontSize: 72, fontWeight: 800, color: '#fff', lineHeight: 1, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}
              />
              <span style={{ fontSize: 28, color: '#475569', fontWeight: 400 }}>/50</span>
            </div>
            <p style={{ fontSize: 11, color: '#334155', marginTop: 8, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>Guests joined</p>
            <div style={{ width: 140, height: 4, background: '#334155', borderRadius: 999, marginTop: 10, overflow: 'hidden', margin: '10px auto 0' }}>
              <motion.div
                animate={{ width: `${guestPct}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                style={{ height: '100%', background: 'linear-gradient(90deg,#028090,#02C39A)', borderRadius: 999 }}
              />
            </div>
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 64, background: 'rgba(255,255,255,0.06)' }} />

          {/* Tickets */}
          <div style={{ textAlign: 'center' }}>
            <AnimatedNumber
              value={totalCount}
              style={{ fontSize: 72, fontWeight: 800, color: '#028090', lineHeight: 1, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}
            />
            <p style={{ fontSize: 11, color: '#334155', marginTop: 8, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>Tickets submitted</p>
            {topDept && (
              <p style={{ fontSize: 12, color: DEPT_COLORS[topDept[0]] ?? '#94A3B8', marginTop: 4, fontWeight: 600 }}>
                Top: {topDept[0]}
              </p>
            )}
          </div>
        </div>

        {/* QR + feed row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 48, width: '100%', maxWidth: 1100, justifyContent: 'center' }}>

          {/* QR Code */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, flexShrink: 0 }}>
            <motion.div
              animate={{ boxShadow: ['0 0 0 0 rgba(2,195,154,0.2)', '0 0 0 24px rgba(2,195,154,0)', '0 0 0 0 rgba(2,195,154,0)'] }}
              transition={{ duration: 3, repeat: Infinity }}
              style={{ background: '#fff', borderRadius: 24, padding: 18, boxShadow: '0 32px 64px rgba(0,0,0,0.5)' }}
            >
              {qrDataUrl
                ? <img src={qrDataUrl} alt="QR Code" style={{ width: 300, height: 300, display: 'block' }} />
                : <div style={{ width: 300, height: 300, background: '#F1F5F9', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: '#94A3B8', fontSize: 13 }}>Generating…</span>
                  </div>
              }
            </motion.div>

            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#94A3B8', margin: '0 0 4px' }}>Scan with your phone</p>
              <p style={{ fontSize: 11, color: '#475569', fontFamily: 'monospace' }}>
                {demoUrl.replace(/^https?:\/\//, '')}
              </p>
            </div>
          </div>

          {/* Live feed */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <PulseDot color="#028090" size={8} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>Live Ticket Feed</span>
              </div>
              <span style={{ fontSize: 11, color: '#475569' }}>AI classifies each ticket in &lt; 3s</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <AnimatePresence initial={false}>
                {tickets.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px dashed rgba(255,255,255,0.12)',
                      borderRadius: 14,
                      padding: '40px 24px',
                      textAlign: 'center' as const,
                    }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: '50%', border: '1px dashed rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                      <PulseDot color="#1E293B" size={8} />
                    </div>
                    <p style={{ fontSize: 14, color: '#475569', margin: '0 0 4px' }}>Waiting for guests to submit tickets…</p>
                    <p style={{ fontSize: 12, color: '#334155' }}>Scan the QR code with your phone to get started</p>
                  </motion.div>
                )}

                {tickets.map((ticket, idx) => {
                  const isNew  = idx === 0
                  const pColor = PRIORITY_COLORS[ticket.priority] ?? '#6B7280'
                  const pBg    = PRIORITY_BG[ticket.priority] ?? 'rgba(107,114,128,0.12)'
                  const dColor = DEPT_COLORS[ticket.department] ?? '#94A3B8'

                  return (
                    <motion.div
                      key={ticket.id}
                      layout
                      initial={{ opacity: 0, y: -20, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      style={{
                        background: isNew ? 'rgba(2,195,154,0.06)' : 'rgba(255,255,255,0.025)',
                        border: `1px solid ${isNew ? 'rgba(2,195,154,0.25)' : 'rgba(255,255,255,0.05)'}`,
                        borderRadius: 12,
                        padding: '14px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                      }}
                    >
                      <div style={{ flexShrink: 0 }}>
                        {isNew
                          ? <PulseDot color="#02C39A" size={8} />
                          : <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#334155', border: '1px solid #334155', display: 'inline-block' }} />
                        }
                      </div>

                      <span style={{ fontSize: 13, fontWeight: 700, color: '#028090', fontFamily: 'monospace', minWidth: 86, flexShrink: 0 }}>
                        {ticket.ticket_number}
                      </span>

                      <span style={{ fontSize: 14, color: '#CBD5E1', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                        {ticket.title}
                      </span>

                      {isNew && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.3 }}
                          style={{ fontSize: 10, fontWeight: 700, color: '#02C39A', background: 'rgba(2,195,154,0.08)', border: '1px solid rgba(2,195,154,0.2)', padding: '3px 10px', borderRadius: 6, flexShrink: 0, letterSpacing: '0.06em' }}
                        >
                          ✦ AI CLASSIFIED
                        </motion.span>
                      )}

                      <span style={{ fontSize: 12, fontWeight: 600, color: dColor, background: `${dColor}15`, padding: '3px 10px', borderRadius: 6, flexShrink: 0 }}>
                        {ticket.department}
                      </span>

                      <span style={{ fontSize: 12, fontWeight: 700, color: pColor, background: pBg, padding: '3px 10px', borderRadius: 6, flexShrink: 0 }}>
                        {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                      </span>

                      <span style={{ fontSize: 11, color: '#334155', minWidth: 52, textAlign: 'right' as const, flexShrink: 0 }}>
                        {timeAgo(ticket.created_at)}
                      </span>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1E293B; border-radius: 4px; }
      `}</style>
    </div>
  )
}