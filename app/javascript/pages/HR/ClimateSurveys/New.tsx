import { useState, useEffect } from 'react'
import { router, useForm } from '@inertiajs/react'
import AppLayout from '@/components/AppLayout'
import { CARD, LABEL, INPUT, SLATE, NAVY, TEAL, DANGER } from '@/styles/tokens'

interface Department {
  id: number
  name: string
}

interface Props {
  departments: Department[]
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function BackIcon({ size = 16, color = SLATE[600] }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m0 0l7 7m-7-7l7-7" />
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

export default function ClimateSurveysNew({ departments }: Props) {
  const { data, setData, post, processing, errors } = useForm({
    title:         '',
    description:   '',
    department_id: '',
  })

  const [locked, setLocked] = useState(false)
  const windowWidth = useWindowWidth()
  const isMobile     = windowWidth < 640

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (locked) return
    setLocked(true)
    post('/hr/climate_surveys', { onError: () => setLocked(false) })
  }

  const canSubmit = !processing && !locked && !!data.title.trim()

  return (
    <AppLayout title="New Climate Survey">
      <div style={{ maxWidth: 600 }}>
        <div style={{ marginBottom: 24 }}>
          <button
            onClick={() => router.get('/hr/climate_surveys')}
            style={{ background: 'none', border: 'none', color: SLATE[600], cursor: 'pointer', fontSize: 14, padding: 0, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <BackIcon /> Climate Surveys
          </button>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: NAVY, letterSpacing: '-0.02em', margin: '0 0 4px' }}>New Climate Survey</h1>
          <p style={{ color: SLATE[600], fontSize: 13, margin: 0 }}>Employee responses are always anonymous</p>
        </div>

        <form onSubmit={handleSubmit} style={{ ...CARD, padding: isMobile ? 20 : 28 }}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ ...LABEL, fontSize: 14, textTransform: 'none', letterSpacing: 0, color: NAVY }}>
              Title <span style={{ color: DANGER }}>*</span>
            </label>
            <input
              type="text"
              value={data.title}
              onChange={e => setData('title', e.target.value)}
              placeholder="Q1 2026 Employee Satisfaction"
              style={INPUT}
            />
            {errors.title && <p style={{ fontSize: 12, color: DANGER, marginTop: 4 }}>{errors.title}</p>}
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ ...LABEL, fontSize: 14, textTransform: 'none', letterSpacing: 0, color: NAVY }}>
              Description <span style={{ fontSize: 12, fontWeight: 400, color: SLATE[400] }}>Optional</span>
            </label>
            <textarea
              value={data.description}
              onChange={e => setData('description', e.target.value)}
              placeholder="What this survey is about and why it matters"
              rows={3}
              style={{ ...INPUT, resize: 'vertical' }}
            />
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={{ ...LABEL, fontSize: 14, textTransform: 'none', letterSpacing: 0, color: NAVY }}>
              Scope <span style={{ fontSize: 12, fontWeight: 400, color: SLATE[400] }}>Optional</span>
            </label>
            <select
              value={data.department_id}
              onChange={e => setData('department_id', e.target.value)}
              style={{ ...INPUT, cursor: 'pointer' }}
            >
              <option value="">Company-wide</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name} only</option>
              ))}
            </select>
          </div>

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
            {processing ? 'Creating…' : 'Create Survey (Draft)'}
          </button>
          <p style={{ textAlign: 'center', fontSize: 13, color: SLATE[400], margin: '12px 0 0' }}>
            You'll be able to review it before publishing
          </p>
        </form>
      </div>
    </AppLayout>
  )
}
