import { useState, useEffect } from 'react'
import { router } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
import AppLayout from '@/components/AppLayout'
import EmptyState from '@/components/EmptyState'
import { ClimateSurveySummary } from '@/types'
import { CARD, LABEL, TH_STYLE, BADGE, SLATE, NAVY, TEAL, WARNING, WARNING_BG, SUCCESS, SUCCESS_BG } from '@/styles/tokens'

interface Props {
  surveys: ClimateSurveySummary[]
}

function PlusIcon({ size = 16, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m-7-7h14" />
    </svg>
  )
}

function UsersIcon({ size = 13, color = SLATE[400] }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <circle cx="9" cy="8" r="3" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 20c0-3 3-5 7-5s7 2 7 5M16 8a3 3 0 110-6M17 15c3 .3 5 2 5 5" />
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

function ParticipationBar({ count, total, label }: { count: number; total: number; label: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <UsersIcon />
        <span style={{ fontSize: 12, color: SLATE[600] }}>{label}</span>
      </div>
      <div style={{ width: '100%', height: 6, borderRadius: 3, background: SLATE[50], overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: TEAL, borderRadius: 3 }} />
      </div>
    </div>
  )
}

export default function ClimateSurveysIndex({ surveys }: Props) {
  const { t } = useTranslation(['hr', 'common'])
  const windowWidth = useWindowWidth()
  const isMobile     = windowWidth < 768

  const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
    draft:  { bg: SLATE[50], color: SLATE[600], label: t('hr:status.draft') },
    active: { bg: SUCCESS_BG, color: SUCCESS, label: t('hr:status.active') },
    closed: { bg: WARNING_BG, color: WARNING, label: t('hr:status.closed') },
  }

  function participationLabel(count: number, total: number) {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0
    return t('hr:climateSurveys.index.responded', { count, total, pct })
  }

  return (
    <AppLayout title={t('hr:climateSurveys.index.title')}>
      <div style={{ maxWidth: 1000 }}>
        <div style={{ display: 'flex', alignItems: isMobile ? 'stretch' : 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 16 : 0 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: NAVY, letterSpacing: '-0.02em', margin: '0 0 4px' }}>{t('hr:climateSurveys.index.title')}</h1>
            <p style={{ color: SLATE[600], fontSize: 13, margin: 0 }}>{t('hr:climateSurveys.index.subtitle')}</p>
          </div>
          <button
            onClick={() => router.get('/hr/climate_surveys/new')}
            style={{ background: TEAL, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
          >
            <PlusIcon /> {t('hr:climateSurveys.index.newSurvey')}
          </button>
        </div>

        {surveys.length === 0 ? (
          <div style={CARD}>
            <EmptyState
              title={t('hr:climateSurveys.index.empty.title')}
              description={t('hr:climateSurveys.index.empty.description')}
            />
          </div>
        ) : isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {surveys.map(survey => {
              const status = STATUS_STYLES[survey.status] ?? STATUS_STYLES.draft
              return (
                <div
                  key={survey.id}
                  onClick={() => router.get(`/hr/climate_surveys/${survey.id}`)}
                  style={{ ...CARD, padding: 16, cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: NAVY, margin: 0 }}>{survey.title}</p>
                    <span style={{ ...BADGE, color: status.color, background: status.bg }}>{status.label}</span>
                  </div>
                  <p style={{ fontSize: 12, color: SLATE[400], margin: '0 0 10px' }}>{survey.department ?? t('hr:climateSurveys.index.companyWide')}</p>
                  <ParticipationBar count={survey.participation_count} total={survey.eligible_count} label={participationLabel(survey.participation_count, survey.eligible_count)} />
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{ ...CARD, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', minWidth: 700, borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: SLATE[50], borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
                    {[
                      t('hr:climateSurveys.index.table.survey'),
                      t('hr:climateSurveys.index.table.scope'),
                      t('hr:climateSurveys.index.table.status'),
                      t('hr:climateSurveys.index.table.participation'),
                      t('hr:climateSurveys.index.table.created'),
                    ].map(col => (
                      <th key={col} style={TH_STYLE}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {surveys.map((survey, i) => {
                    const status = STATUS_STYLES[survey.status] ?? STATUS_STYLES.draft
                    return (
                      <tr
                        key={survey.id}
                        onClick={() => router.get(`/hr/climate_surveys/${survey.id}`)}
                        style={{ cursor: 'pointer', borderBottom: i < surveys.length - 1 ? '1px solid rgba(15,23,42,0.04)' : 'none' }}
                      >
                        <td style={{ padding: '14px 16px' }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: NAVY, margin: 0 }}>{survey.title}</p>
                          <p style={{ fontSize: 12, color: SLATE[400], margin: 0 }}>{t('hr:climateSurveys.index.table.by', { name: survey.created_by })}</p>
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: 13, color: SLATE[600] }}>
                          {survey.department ?? t('hr:climateSurveys.index.companyWide')}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ ...BADGE, color: status.color, background: status.bg }}>{status.label}</span>
                        </td>
                        <td style={{ padding: '14px 16px', minWidth: 160 }}>
                          <ParticipationBar count={survey.participation_count} total={survey.eligible_count} label={participationLabel(survey.participation_count, survey.eligible_count)} />
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: 13, color: SLATE[600] }}>
                          {new Date(survey.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
