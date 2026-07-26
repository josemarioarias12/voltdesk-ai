import { useState, useEffect } from 'react'
import { router, useForm } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
import AppLayout from '@/components/AppLayout'
import { CARD, LABEL, INPUT, SLATE, NAVY, TEAL, DANGER } from '@/styles/tokens'

interface Department {
  id: number
  name: string
}

interface Props {
  departments: Department[]
}

function BackIcon({ size = 16, color = SLATE[600] }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m0 0l7 7m-7-7l7-7" />
    </svg>
  )
}

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
  const { t } = useTranslation(['hr', 'common'])
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
    <AppLayout title={t('hr:climateSurveys.new.title')}>
      <div style={{ maxWidth: 600 }}>
        <div style={{ marginBottom: 24 }}>
          <button
            onClick={() => router.get('/hr/climate_surveys')}
            style={{ background: 'none', border: 'none', color: SLATE[600], cursor: 'pointer', fontSize: 14, padding: 0, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <BackIcon /> {t('hr:climateSurveys.new.back')}
          </button>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: NAVY, letterSpacing: '-0.02em', margin: '0 0 4px' }}>{t('hr:climateSurveys.new.title')}</h1>
          <p style={{ color: SLATE[600], fontSize: 13, margin: 0 }}>{t('hr:climateSurveys.new.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} style={{ ...CARD, padding: isMobile ? 20 : 28 }}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ ...LABEL, fontSize: 14, textTransform: 'none', letterSpacing: 0, color: NAVY }}>
              {t('hr:climateSurveys.new.titleLabel')} <span style={{ color: DANGER }}>*</span>
            </label>
            <input
              type="text"
              value={data.title}
              onChange={e => setData('title', e.target.value)}
              placeholder={t('hr:climateSurveys.new.titlePlaceholder')}
              style={INPUT}
            />
            {errors.title && <p style={{ fontSize: 12, color: DANGER, marginTop: 4 }}>{errors.title}</p>}
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ ...LABEL, fontSize: 14, textTransform: 'none', letterSpacing: 0, color: NAVY }}>
              {t('hr:climateSurveys.new.descriptionLabel')} <span style={{ fontSize: 12, fontWeight: 400, color: SLATE[400] }}>{t('hr:climateSurveys.new.optional')}</span>
            </label>
            <textarea
              value={data.description}
              onChange={e => setData('description', e.target.value)}
              placeholder={t('hr:climateSurveys.new.descriptionPlaceholder')}
              rows={3}
              style={{ ...INPUT, resize: 'vertical' }}
            />
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={{ ...LABEL, fontSize: 14, textTransform: 'none', letterSpacing: 0, color: NAVY }}>
              {t('hr:climateSurveys.new.scopeLabel')} <span style={{ fontSize: 12, fontWeight: 400, color: SLATE[400] }}>{t('hr:climateSurveys.new.optional')}</span>
            </label>
            <select
              value={data.department_id}
              onChange={e => setData('department_id', e.target.value)}
              style={{ ...INPUT, cursor: 'pointer' }}
            >
              <option value="">{t('hr:climateSurveys.new.companyWide')}</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{t('hr:climateSurveys.new.deptOnly', { name: dept.name })}</option>
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
            {processing ? t('hr:climateSurveys.new.submitting') : t('hr:climateSurveys.new.submit')}
          </button>
          <p style={{ textAlign: 'center', fontSize: 13, color: SLATE[400], margin: '12px 0 0' }}>
            {t('hr:climateSurveys.new.reviewHint')}
          </p>
        </form>
      </div>
    </AppLayout>
  )
}
