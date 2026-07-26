import { useState, useEffect } from 'react'
import { router, useForm } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
import AppLayout from '@/components/AppLayout'
import { CARD, LABEL, INPUT, SLATE, NAVY, TEAL } from '@/styles/tokens'

interface SurveyInfo {
  id: number
  title: string
  description: string | null
}

interface Props {
  survey: SurveyInfo
}

function LockIcon({ size = 16, color = TEAL }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <rect x="4" y="10" width="16" height="10" rx="2" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10V7a4 4 0 118 0v3" />
    </svg>
  )
}

function StarIcon({ size = 24, filled, color = '#F59E0B' }: { size?: number; filled: boolean; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={color} strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
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

function ScoreSelector({ value, onChange, labels }: { value: number; onChange: (n: number) => void; labels: [string, string] }) {
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-label={`${n} out of 5`}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
          >
            <StarIcon filled={n <= value} />
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: SLATE[400] }}>
        <span>{labels[0]}</span>
        <span>{labels[1]}</span>
      </div>
    </div>
  )
}

export default function ClimateSurveysRespond({ survey }: Props) {
  const { t } = useTranslation(['hr', 'common'])
  const { data, setData, post, processing, errors } = useForm({
    rating: 0,
    recommend_score: 0,
    feedback: '',
  })

  const [locked, setLocked] = useState(false)
  const windowWidth = useWindowWidth()
  const isMobile     = windowWidth < 640

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (locked) return
    setLocked(true)
    post(`/hr/climate_survey_responses?climate_survey_id=${survey.id}`, { onError: () => setLocked(false) })
  }

  const canSubmit = !processing && !locked && data.rating > 0 && data.recommend_score > 0

  return (
    <AppLayout title={survey.title}>
      <div style={{ maxWidth: 600 }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: NAVY, letterSpacing: '-0.02em', margin: '0 0 4px' }}>{survey.title}</h1>
          {survey.description && <p style={{ color: SLATE[600], fontSize: 13, margin: 0 }}>{survey.description}</p>}
        </div>

        <div style={{ ...CARD, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, background: '#F0FDFA', border: '1px solid #99F6E4' }}>
          <LockIcon />
          <p style={{ fontSize: 13, color: TEAL, margin: 0, fontWeight: 500 }}>
            {t('hr:climateSurveys.respond.anonymityNotice')}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ ...CARD, padding: isMobile ? 20 : 28 }}>
          <div style={{ marginBottom: 24 }}>
            <label style={{ ...LABEL, fontSize: 14, textTransform: 'none', letterSpacing: 0, color: NAVY, marginBottom: 10 }}>
              {t('hr:climateSurveys.respond.satisfactionQuestion')}
            </label>
            <ScoreSelector
              value={data.rating}
              onChange={n => setData('rating', n)}
              labels={[t('hr:climateSurveys.respond.satisfactionLow'), t('hr:climateSurveys.respond.satisfactionHigh')]}
            />
            {errors.rating && <p style={{ fontSize: 12, color: '#DC2626', marginTop: 6 }}>{errors.rating}</p>}
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ ...LABEL, fontSize: 14, textTransform: 'none', letterSpacing: 0, color: NAVY, marginBottom: 10 }}>
              {t('hr:climateSurveys.respond.recommendQuestion')}
            </label>
            <ScoreSelector
              value={data.recommend_score}
              onChange={n => setData('recommend_score', n)}
              labels={[t('hr:climateSurveys.respond.recommendLow'), t('hr:climateSurveys.respond.recommendHigh')]}
            />
            {errors.recommend_score && <p style={{ fontSize: 12, color: '#DC2626', marginTop: 6 }}>{errors.recommend_score}</p>}
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={{ ...LABEL, fontSize: 14, textTransform: 'none', letterSpacing: 0, color: NAVY }}>
              {t('hr:climateSurveys.respond.feedbackQuestion')} <span style={{ fontSize: 12, fontWeight: 400, color: SLATE[400] }}>{t('hr:climateSurveys.respond.optional')}</span>
            </label>
            <textarea
              value={data.feedback}
              onChange={e => setData('feedback', e.target.value)}
              placeholder={t('hr:climateSurveys.respond.feedbackPlaceholder')}
              rows={4}
              style={{ ...INPUT, resize: 'vertical' }}
            />
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
            {processing ? t('hr:climateSurveys.respond.submitting') : t('hr:climateSurveys.respond.submit')}
          </button>
          <p style={{ textAlign: 'center', margin: '12px 0 0' }}>
            <button type="button" onClick={() => router.get('/dashboard')} style={{ background: 'none', border: 'none', color: SLATE[400], fontSize: 13, cursor: 'pointer' }}>
              {t('hr:climateSurveys.respond.skip')}
            </button>
          </p>
        </form>
      </div>
    </AppLayout>
  )
}
