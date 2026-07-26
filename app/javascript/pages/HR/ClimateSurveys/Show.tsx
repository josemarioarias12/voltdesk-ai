import { useState, useEffect } from 'react'
import { router } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
import AppLayout from '@/components/AppLayout'
import { ClimateSurveyDetail } from '@/types'
import { CARD, LABEL, BADGE, SLATE, NAVY, TEAL, DANGER, WARNING, WARNING_BG, SUCCESS, SUCCESS_BG } from '@/styles/tokens'

interface Props {
  survey: ClimateSurveyDetail
}

function BackIcon({ size = 16, color = SLATE[600] }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m0 0l7 7m-7-7l7-7" />
    </svg>
  )
}

function StarIcon({ size = 18, color = TEAL }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}

function ThumbsUpIcon({ size = 18, color = TEAL }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 22V11m0 11h10.28a2 2 0 002-1.7l1.1-7A2 2 0 0018.39 12H14V5a2 2 0 00-2-2h-.16a1 1 0 00-.95.68L7 11" />
    </svg>
  )
}

function UsersIcon({ size = 18, color = TEAL }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <circle cx="9" cy="8" r="3" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 20c0-3 3-5 7-5s7 2 7 5M16 8a3 3 0 110-6M17 15c3 .3 5 2 5 5" />
    </svg>
  )
}

function SparkleIcon({ size = 15, color = TEAL }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  )
}

function LockIcon({ size = 16, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <rect x="4" y="10" width="16" height="10" rx="2" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10V7a4 4 0 118 0v3" />
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

function MetricCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div style={{ ...CARD, padding: '20px 24px' }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: '#F0FDFA', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
        {icon}
      </div>
      <p style={{ fontSize: 11, fontWeight: 600, color: SLATE[400], textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>{label}</p>
      <p style={{ fontSize: 30, fontWeight: 700, color: NAVY, margin: '0 0 2px' }}>{value}</p>
      <p style={{ fontSize: 12, color: SLATE[600], margin: 0 }}>{sub}</p>
    </div>
  )
}

export default function ClimateSurveysShow({ survey }: Props) {
  const { t } = useTranslation(['hr', 'common'])
  const [closing, setClosing] = useState(false)
  const [activating, setActivating] = useState(false)
  const windowWidth = useWindowWidth()
  const isMobile     = windowWidth < 768

  const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
    draft:  { bg: SLATE[50], color: SLATE[600], label: t('hr:status.draft') },
    active: { bg: SUCCESS_BG, color: SUCCESS, label: t('hr:status.active') },
    closed: { bg: WARNING_BG, color: WARNING, label: t('hr:status.closed') },
  }

  const SENTIMENT_STYLES: Record<string, { bg: string; color: string; label: string }> = {
    positive: { bg: SUCCESS_BG, color: SUCCESS, label: t('hr:climateSurveys.show.sentiment.positive') },
    negative: { bg: '#FEF2F2', color: DANGER, label: t('hr:climateSurveys.show.sentiment.negative') },
    mixed:    { bg: '#FFFBEB', color: WARNING, label: t('hr:climateSurveys.show.sentiment.mixed') },
  }

  const status = STATUS_STYLES[survey.status] ?? STATUS_STYLES.draft
  const participationPct = survey.eligible_count > 0
    ? Math.round((survey.participation_count / survey.eligible_count) * 100)
    : 0

  function handleClose() {
    setClosing(true)
    router.post(`/hr/climate_surveys/${survey.id}/close`, {}, { onFinish: () => setClosing(false) })
  }

  function handleActivate() {
    setActivating(true)
    router.post(`/hr/climate_surveys/${survey.id}/activate`, {}, { onFinish: () => setActivating(false) })
  }

  return (
    <AppLayout title={survey.title}>
      <div style={{ maxWidth: 900 }}>
        <div style={{ display: 'flex', alignItems: isMobile ? 'stretch' : 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 12 : 0 }}>
          <div>
            <button
              onClick={() => router.get('/hr/climate_surveys')}
              style={{ background: 'none', border: 'none', color: SLATE[600], cursor: 'pointer', fontSize: 14, padding: 0, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <BackIcon /> {t('hr:climateSurveys.show.back')}
            </button>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: NAVY, letterSpacing: '-0.02em', margin: '0 0 4px' }}>{survey.title}</h1>
            <p style={{ color: SLATE[600], fontSize: 13, margin: 0 }}>
              {survey.department ?? t('hr:climateSurveys.show.companyWide')} · {t('hr:climateSurveys.show.by', { name: survey.created_by })}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, alignSelf: isMobile ? 'flex-start' : undefined }}>
            <span style={{ ...BADGE, fontSize: 13, padding: '6px 14px', color: status.color, background: status.bg }}>{status.label}</span>
            {survey.can_activate && (
              <button
                onClick={handleActivate}
                disabled={activating}
                style={{ background: SUCCESS, color: '#fff', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                {activating ? t('hr:climateSurveys.show.activating') : t('hr:climateSurveys.show.activateSurvey')}
              </button>
            )}
            {survey.can_close && (
              <button
                onClick={handleClose}
                disabled={closing}
                style={{ background: WARNING, color: '#fff', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                {closing ? t('hr:climateSurveys.show.closing') : t('hr:climateSurveys.show.closeSurvey')}
              </button>
            )}
          </div>
        </div>

        {survey.description && (
          <div style={{ ...CARD, padding: 20, marginBottom: 20 }}>
            <p style={{ fontSize: 14, color: SLATE[600], margin: 0 }}>{survey.description}</p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          <MetricCard
            icon={<UsersIcon />}
            label={t('hr:climateSurveys.show.participation')}
            value={`${participationPct}%`}
            sub={t('hr:climateSurveys.show.responded', { count: survey.participation_count, total: survey.eligible_count })}
          />
          <MetricCard
            icon={<StarIcon />}
            label={t('hr:climateSurveys.show.avgSatisfaction')}
            value={survey.average_rating != null ? `${survey.average_rating} / 5` : '—'}
            sub={t('hr:climateSurveys.show.satisfactionSub')}
          />
          <MetricCard
            icon={<ThumbsUpIcon />}
            label={t('hr:climateSurveys.show.avgRecommend')}
            value={survey.average_recommend_score != null ? `${survey.average_recommend_score} / 5` : '—'}
            sub={t('hr:climateSurveys.show.recommendSub')}
          />
        </div>

        <div style={{ ...CARD, padding: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: NAVY, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <SparkleIcon /> {t('hr:climateSurveys.show.detectedThemes')}
          </h2>

          {survey.status !== 'closed' ? (
            <div style={{ padding: '16px', background: SLATE[50], borderRadius: 10, textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: SLATE[400], margin: 0 }}>
                {t('hr:climateSurveys.show.notClosedYet')}
              </p>
            </div>
          ) : survey.ai_themes.length === 0 ? (
            <div style={{ padding: '16px', background: SLATE[50], borderRadius: 10, textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: SLATE[400], margin: 0 }}>
                {t('hr:climateSurveys.show.noThemes')}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {survey.ai_themes.map((theme, i) => {
                const sentimentStyle = SENTIMENT_STYLES[theme.sentiment] ?? SENTIMENT_STYLES.mixed
                return (
                  <div key={i} style={{ padding: 16, borderRadius: 10, border: '1px solid rgba(15,23,42,0.08)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: NAVY, margin: 0 }}>{theme.theme}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ ...BADGE, color: sentimentStyle.color, background: sentimentStyle.bg }}>{sentimentStyle.label}</span>
                        <span style={{ fontSize: 12, color: SLATE[400] }}>{t('hr:climateSurveys.show.mentions', { count: theme.mentions })}</span>
                      </div>
                    </div>
                    <p style={{ fontSize: 13, color: SLATE[600], fontStyle: 'italic', margin: 0 }}>&ldquo;{theme.example_quote}&rdquo;</p>
                  </div>
                )
              })}
            </div>
          )}

          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: SLATE[50], borderRadius: 8 }}>
            <LockIcon color={SLATE[400]} />
            <p style={{ fontSize: 12, color: SLATE[400], margin: 0 }}>
              {t('hr:climateSurveys.show.anonymityNotice')}
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
