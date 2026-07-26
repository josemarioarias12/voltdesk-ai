import { useState, useEffect, useCallback, useRef } from 'react'
import { router, useForm } from '@inertiajs/react'
import AppLayout from '@/components/AppLayout'
import { CARD, LABEL, INPUT, SLATE, NAVY, TEAL, DANGER } from '@/styles/tokens'

interface Props {
  leave_types: string[]
}

interface PolicyPreview {
  business_days: number
  min_notice_days: number | null
  max_concurrent: number | null
  current_concurrent_count: number | null
}

const LEAVE_TYPE_CONFIG: Record<string, { label: string; color: string; border: string; Icon: (props: { color?: string }) => React.ReactElement }> = {
  vacation:   { label: 'Vacation',   color: '#2563EB', border: '#BFDBFE', Icon: PalmIcon },
  sick_leave: { label: 'Sick Leave', color: '#EA580C', border: '#FED7AA', Icon: ThermometerIcon },
  personal:   { label: 'Personal',   color: '#7C3AED', border: '#DDD6FE', Icon: UserIcon },
  maternity:  { label: 'Maternity',  color: '#DB2777', border: '#FBCFE8', Icon: HeartIcon },
  paternity:  { label: 'Paternity',  color: '#16A34A', border: '#BBF7D0', Icon: UsersIcon },
  other:      { label: 'Other',      color: SLATE[600], border: 'rgba(15,23,42,0.14)', Icon: DocumentIcon },
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function PalmIcon({ color = 'currentColor' }: { color?: string }) {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 22v-9M12 13c-3-4-8-4-10-1 3 2 7 1 10 1zm0 0c3-4 8-4 10-1-3 2-7 1-10 1zm0 0c-1-3 0-6 2-8m-2 8c1-3 0-6-2-8" />
    </svg>
  )
}

function ThermometerIcon({ color = 'currentColor' }: { color?: string }) {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 4a2 2 0 10-4 0v10.5a4 4 0 104 0V4z" />
    </svg>
  )
}

function UserIcon({ color = 'currentColor' }: { color?: string }) {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <circle cx="12" cy="8" r="4" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  )
}

function HeartIcon({ color = 'currentColor' }: { color?: string }) {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-7-4.5-9.5-9C.5 8 2 4 6 4c2.2 0 3.7 1.3 6 3.5C14.3 5.3 15.8 4 18 4c4 0 5.5 4 3.5 8-2.5 4.5-9.5 9-9.5 9z" />
    </svg>
  )
}

function UsersIcon({ color = 'currentColor' }: { color?: string }) {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <circle cx="9" cy="8" r="3" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 20c0-3 3-5 7-5s7 2 7 5M16 8a3 3 0 110-6M17 15c3 .3 5 2 5 5" />
    </svg>
  )
}

function DocumentIcon({ color = 'currentColor' }: { color?: string }) {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 2v6h6M9 13h6M9 17h6" />
    </svg>
  )
}

function CheckIcon({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

function ClockIcon({ size = 14, color = TEAL }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <circle cx="12" cy="12" r="9" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3" />
    </svg>
  )
}

function InfoIcon({ size = 14, color = SLATE[500] }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <circle cx="12" cy="12" r="9" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-4m0-4h.01" />
    </svg>
  )
}

function AlertIcon({ size = 14, color = DANGER }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  )
}

function BackIcon({ size = 16, color = SLATE[600] }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m0 0l7 7m-7-7l7-7" />
    </svg>
  )
}

function BellIcon({ size = 14, color = SLATE[400] }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  )
}

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

export default function LeaveRequestsNew({ leave_types }: Props) {
  const { data, setData, post, processing, errors } = useForm({
    leave_type:    '',
    start_date:    '',
    end_date:      '',
    reason:        '',
    coverage_plan: '',
  })

  const [preview, setPreview]   = useState<PolicyPreview | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const windowWidth  = useWindowWidth()
  const isMobile     = windowWidth < 640

  const fetchPreview = useCallback(async (leaveType: string, startDate: string, endDate: string) => {
    if (!leaveType || !startDate || !endDate) { setPreview(null); return }
    setPreviewLoading(true)
    try {
      const params = new URLSearchParams({ leave_type: leaveType, start_date: startDate, end_date: endDate })
      const res = await fetch(`/hr/leave_requests/policy_preview?${params.toString()}`)
      if (res.ok) setPreview(await res.json() as PolicyPreview)
      else setPreview(null)
    } catch { setPreview(null) } finally { setPreviewLoading(false) }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      void fetchPreview(data.leave_type, data.start_date, data.end_date)
    }, 500)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [data.leave_type, data.start_date, data.end_date, fetchPreview])

  const [locked, setLocked] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (locked) return
    setLocked(true)
    post('/hr/leave_requests', { onError: () => setLocked(false) })
  }

  const canSubmit = !processing && !locked && !!data.leave_type && !!data.start_date && !!data.end_date

  const noticeWarning = preview?.min_notice_days != null && data.start_date
    ? (() => {
        const daysUntilStart = Math.floor((new Date(data.start_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        return daysUntilStart < preview.min_notice_days
      })()
    : false

  const capReached = preview?.max_concurrent != null && preview.current_concurrent_count != null
    ? preview.current_concurrent_count >= preview.max_concurrent
    : false

  return (
    <AppLayout title="Request Time Off">
      <div style={{ maxWidth: 700 }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <button
            onClick={() => router.get('/hr/leave_requests')}
            style={{ background: 'none', border: 'none', color: SLATE[600], cursor: 'pointer', fontSize: 14, padding: 0, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <BackIcon /> Leave Requests
          </button>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: NAVY, letterSpacing: '-0.02em', margin: '0 0 4px' }}>Request Time Off</h1>
          <p style={{ color: SLATE[600], fontSize: 13, margin: 0 }}>Submit a leave request for approval</p>
        </div>

        <form onSubmit={handleSubmit} style={{ ...CARD, padding: 28 }}>
          {/* Leave type */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ ...LABEL, fontSize: 14, textTransform: 'none', letterSpacing: 0, color: NAVY, marginBottom: 12 }}>
              Leave Type <span style={{ color: DANGER }}>*</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: 10 }}>
              {leave_types.map(type => {
                const cfg = LEAVE_TYPE_CONFIG[type]
                if (!cfg) return null
                const selected = data.leave_type === type
                const Icon = cfg.Icon
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setData('leave_type', type)}
                    style={{
                      padding: '16px 12px', borderRadius: 12, cursor: 'pointer',
                      border: selected ? `2px solid ${cfg.color}` : '1px solid rgba(15,23,42,0.14)',
                      background: selected ? `${cfg.border}40` : '#fff',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                      transition: 'all 150ms ease', position: 'relative',
                    }}
                  >
                    <Icon color={selected ? cfg.color : SLATE[500]} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: selected ? cfg.color : SLATE[600] }}>{cfg.label}</span>
                    {selected && (
                      <span style={{ position: 'absolute', top: 8, right: 8 }}>
                        <CheckIcon size={14} color={cfg.color} />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            {errors.leave_type && <p style={{ fontSize: 12, color: DANGER, marginTop: 8 }}>{errors.leave_type}</p>}
          </div>

          {/* Date range */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ ...LABEL, fontSize: 14, textTransform: 'none', letterSpacing: 0, color: NAVY, marginBottom: 12 }}>
              Date Range <span style={{ color: DANGER }}>*</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr auto 1fr', gap: 12, alignItems: 'end' }}>
              <div>
                <label style={LABEL}>Start Date</label>
                <input type="date" value={data.start_date} onChange={e => setData('start_date', e.target.value)} style={INPUT} />
              </div>
              {!isMobile && <span style={{ color: SLATE[400], fontSize: 18, paddingBottom: 9 }}>→</span>}
              <div>
                <label style={LABEL}>End Date</label>
                <input type="date" value={data.end_date} onChange={e => setData('end_date', e.target.value)} style={INPUT} />
              </div>
            </div>
            {(errors.start_date || errors.end_date) && (
              <p style={{ fontSize: 12, color: DANGER, marginTop: 8 }}>{errors.start_date || errors.end_date}</p>
            )}

            {/* Policy preview */}
            {data.start_date && data.end_date && data.leave_type && (
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {previewLoading && (
                  <p style={{ fontSize: 12, color: SLATE[400], margin: 0 }}>Checking availability…</p>
                )}
                {!previewLoading && preview && (
                  <>
                    <div style={{ padding: '10px 14px', borderRadius: 10, background: '#F0FDFA', border: '1px solid #99F6E4', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <ClockIcon />
                      <span style={{ fontSize: 13, fontWeight: 600, color: TEAL }}>
                        {preview.business_days} business {preview.business_days === 1 ? 'day' : 'days'}
                      </span>
                    </div>
                    {preview.min_notice_days != null && (
                      <div style={{ padding: '10px 14px', borderRadius: 10, background: noticeWarning ? '#FEF2F2' : SLATE[50], border: noticeWarning ? '1px solid #FCA5A5' : '1px solid rgba(15,23,42,0.08)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        {noticeWarning ? <AlertIcon /> : <InfoIcon />}
                        <span style={{ fontSize: 13, color: noticeWarning ? DANGER : SLATE[600] }}>
                          {noticeWarning
                            ? `This leave type requires at least ${preview.min_notice_days} days advance notice`
                            : `Requires ${preview.min_notice_days} days advance notice — you're within range`}
                        </span>
                      </div>
                    )}
                    {preview.max_concurrent != null && (
                      <div style={{ padding: '10px 14px', borderRadius: 10, background: capReached ? '#FEF2F2' : SLATE[50], border: capReached ? '1px solid #FCA5A5' : '1px solid rgba(15,23,42,0.08)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        {capReached ? <AlertIcon /> : <InfoIcon />}
                        <span style={{ fontSize: 13, color: capReached ? DANGER : SLATE[600] }}>
                          {capReached
                            ? `Your department has reached its limit of ${preview.max_concurrent} concurrent requests`
                            : `${preview.current_concurrent_count} of ${preview.max_concurrent} department slots used`}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Reason */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ ...LABEL, fontSize: 14, textTransform: 'none', letterSpacing: 0, color: NAVY, marginBottom: 8 }}>
              Reason <span style={{ fontSize: 12, fontWeight: 400, color: SLATE[400] }}>Optional</span>
            </label>
            <textarea
              value={data.reason}
              onChange={e => setData('reason', e.target.value)}
              placeholder="Briefly describe the reason for your leave request"
              rows={3}
              style={{ ...INPUT, resize: 'vertical' }}
            />
          </div>

          {/* Coverage plan */}
          <div style={{ marginBottom: 28 }}>
            <label style={{ ...LABEL, fontSize: 14, textTransform: 'none', letterSpacing: 0, color: NAVY, marginBottom: 8 }}>
              Coverage Plan <span style={{ fontSize: 12, fontWeight: 400, color: SLATE[400] }}>Optional</span>
            </label>
            <input
              type="text"
              value={data.coverage_plan}
              onChange={e => setData('coverage_plan', e.target.value)}
              placeholder="Who will cover your responsibilities?"
              style={INPUT}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              width: '100%', padding: 13, borderRadius: 10,
              background: canSubmit ? TEAL : SLATE[400],
              color: '#fff', border: 'none', fontSize: 15, fontWeight: 600,
              cursor: canSubmit ? 'pointer' : 'not-allowed',
            }}
          >
            {processing ? 'Submitting…' : 'Submit Request'}
          </button>
          <p style={{ textAlign: 'center', fontSize: 13, color: SLATE[400], margin: '12px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <BellIcon /> Your manager will be notified immediately
          </p>
          <p style={{ textAlign: 'center', margin: '8px 0 0' }}>
            <button type="button" onClick={() => router.get('/hr/leave_requests')} style={{ background: 'none', border: 'none', color: SLATE[400], fontSize: 13, cursor: 'pointer' }}>
              Cancel
            </button>
          </p>
        </form>
      </div>
    </AppLayout>
  )
}
