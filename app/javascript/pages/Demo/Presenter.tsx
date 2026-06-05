import { useState, useEffect } from 'react'
import { router } from '@inertiajs/react'
import QRCode from 'qrcode'

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

export default function DemoPresenter({ token, workspace_name }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(1800)
  const [guestCount,  setGuestCount]  = useState(0)
  const [tickets,     setTickets]     = useState<LiveTicket[]>([])
  const [qrDataUrl,   setQrDataUrl]   = useState('')
  const [, setTick]                   = useState(0)

  const demoUrl = `${window.location.origin}/demo/${token}`

  useEffect(() => {
    QRCode.toDataURL(demoUrl, {
      width: 280,
      margin: 2,
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
    const poll = async () => {
      try {
        const res = await fetch(`/workspace/demo/status?token=${token}`, {
          headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        })
        if (!res.ok) return
        const json = await res.json()
        if (json.guest_count !== undefined) setGuestCount(json.guest_count)
        if (json.expires_in  !== undefined) setSecondsLeft(json.expires_in)
        if (json.tickets)                   setTickets(json.tickets)
      } catch { /* silent */ }
    }
    poll()
    const id = setInterval(poll, 5_000)
    return () => clearInterval(id)
  }, [token])

  function formatTime(secs: number): string {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  function handleEndDemo() {
    if (!confirm('End demo session? All guests will lose access immediately.')) return
    router.delete('/workspace/demo/deactivate', { data: { token } })
  }

  const guestPct = Math.min((guestCount / 50) * 100, 100)

  return (
    <div style={{ minHeight: '100vh', background: '#0F172A', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 24px', fontFamily: 'system-ui, sans-serif' }}>

      {/* Status pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(2,128,144,0.15)', border: '1px solid rgba(2,128,144,0.4)', borderRadius: 999, padding: '6px 18px', marginBottom: 40 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#028090', display: 'inline-block', animation: 'pulse 2s infinite' }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#028090' }}>QR Demo Mode Active</span>
      </div>

      {/* Main row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 64, marginBottom: 48, width: '100%', maxWidth: 900, justifyContent: 'center' }}>

        {/* Timer */}
        <div style={{ textAlign: 'center', minWidth: 160 }}>
          <p style={{ fontSize: 72, fontWeight: 800, color: secondsLeft < 300 ? '#EF4444' : '#028090', fontVariantNumeric: 'tabular-nums', lineHeight: 1, margin: 0 }}>
            {formatTime(secondsLeft)}
          </p>
          <p style={{ fontSize: 14, color: '#94A3B8', marginTop: 8 }}>Session expires in</p>
        </div>

        {/* QR */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 16, boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 24px 48px rgba(0,0,0,0.4)' }}>
            {qrDataUrl
              ? <img src={qrDataUrl} alt="QR Code" style={{ width: 248, height: 248, display: 'block' }} />
              : <div style={{ width: 248, height: 248, background: '#F1F5F9', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#94A3B8', fontSize: 13 }}>Generating…</span>
                </div>
            }
          </div>
          <p style={{ fontSize: 13, color: '#94A3B8', fontFamily: 'monospace' }}>
            {demoUrl.replace(/^https?:\/\//, '')}
          </p>
        </div>

        {/* Guest counter */}
        <div style={{ textAlign: 'center', minWidth: 160 }}>
          <p style={{ fontSize: 72, fontWeight: 800, color: '#fff', lineHeight: 1, margin: 0 }}>
            {guestCount}
            <span style={{ fontSize: 32, color: '#94A3B8', fontWeight: 400 }}> / 50</span>
          </p>
          <p style={{ fontSize: 14, color: '#94A3B8', marginTop: 8 }}>guests joined</p>
          <div style={{ width: 160, height: 4, background: '#1E293B', borderRadius: 999, marginTop: 12, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${guestPct}%`, background: '#028090', borderRadius: 999, transition: 'width 0.5s ease' }} />
          </div>
        </div>
      </div>

      {/* Live feed */}
      <div style={{ width: '100%', maxWidth: 820 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#028090', display: 'inline-block', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>Live Tickets Feed</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tickets.length === 0 && (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '20px 24px', textAlign: 'center' as const, color: '#475569', fontSize: 14 }}>
              Waiting for guests to submit tickets…
            </div>
          )}
          {tickets.map((ticket, idx) => {
            const isNew = idx === 0
            return (
              <div key={ticket.id} style={{ background: isNew ? 'rgba(2,128,144,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isNew ? 'rgba(2,128,144,0.25)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 12, padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: isNew ? '#028090' : '#1E293B', border: isNew ? 'none' : '1px solid #334155', flexShrink: 0 }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: '#028090', minWidth: 90, fontFamily: 'monospace' }}>{ticket.ticket_number}</span>
                <span style={{ fontSize: 14, color: '#E2E8F0', flex: 1 }}>{ticket.title}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: DEPT_COLORS[ticket.department] ?? '#94A3B8', background: 'rgba(255,255,255,0.05)', padding: '3px 10px', borderRadius: 6 }}>
                  {ticket.department}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: PRIORITY_COLORS[ticket.priority], background: `${PRIORITY_COLORS[ticket.priority]}18`, padding: '3px 10px', borderRadius: 6 }}>
                  {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                </span>
                <span style={{ fontSize: 12, color: '#475569', minWidth: 60, textAlign: 'right' as const }}>
                  {timeAgo(ticket.created_at)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* End demo */}
      <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <button onClick={handleEndDemo} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#EF4444', border: 'none', borderRadius: 12, padding: '14px 32px', fontSize: 15, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <circle cx="12" cy="12" r="10" />
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          </svg>
          End Demo Session
        </button>
        <p style={{ fontSize: 12, color: '#475569' }}>All guest sessions will be terminated</p>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  )
}
