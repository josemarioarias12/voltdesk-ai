import { useEffect, useRef, useState } from 'react'
import { router } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
import { Bot, AlertTriangle } from 'lucide-react'
import AppLayout from '@/components/AppLayout'
import { useLocale } from '@/hooks/useLocale'
import { useActionCable } from '@/hooks/useActionCable'
import { CARD, NAVY, SLATE, TEAL } from '@/styles/tokens'
import type { TFunction } from 'i18next'

interface RiskFactor {
  value: number | null
  normalized: number
  impact: 'low' | 'medium' | 'high'
  label: string
  workspace_avg?: number
}

interface RiskAssessment {
  score: number
  risk_level: string
  calculated_at: string
  recommendation: string
  factors: {
    incidents:   RiskFactor
    maintenance: RiskFactor
    warranty:    RiskFactor
    age:         RiskFactor
  }
}

interface Incident {
  id: number
  title: string
  severity: string
  status: string
  created_at: string
  resolved_at: string | null
}

interface AssetDetail {
  id: number
  asset_number: string
  name: string
  model_spec: string | null
  serial_number: string | null
  asset_type: string
  status: string
  risk_score: number
  purchase_date: string | null
  purchase_price: number | null
  warranty_expires_at: string | null
  days_until_warranty: number | null
  last_maintenance_at: string | null
  days_since_maintenance: number | null
  condition_at_assignment: string | null
  assigned_at: string | null
  notes: string | null
  assigned_to: { id: number; name: string } | null
  department: { id: number; name: string } | null
  risk_assessment: RiskAssessment | null
  incidents: Incident[]
}

interface Props { asset: AssetDetail }

const IMPACT_COLOR: Record<string, string> = {
  high:   '#EF4444',
  medium: '#F97316',
  low:    '#16A34A',
}

const SEVERITY_STYLE: Record<string, { bg: string; color: string }> = {
  low:      { bg: '#F0FDF4', color: '#15803D' },
  medium:   { bg: '#FFF7ED', color: '#C2410C' },
  high:     { bg: '#FEF2F2', color: '#DC2626' },
  critical: { bg: '#FEF2F2', color: '#7F1D1D' },
}

export default function AssetsShow({ asset }: Props) {
  const { t } = useTranslation(['assets'])
  const { speechLang } = useLocale()
  const ra     = asset.risk_assessment
  const isHigh = asset.risk_score > 70

  useActionCable({ channel: 'AssetsChannel', asset_id: asset.id }, () => {
    router.reload({ only: ['asset'] })
  })

  const [confirmModal, setConfirmModal] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!confirmModal) return

    const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, [tabindex]:not([tabindex="-1"])'
    )
    focusable?.[0]?.focus()

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') { setConfirmModal(false); return }
      if (e.key !== 'Tab' || !focusable || focusable.length === 0) return

      const first = focusable[0]
      const last  = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [confirmModal])

  function scheduleMaintenanceToggle() {
    setConfirmModal(true)
  }

  function confirmToggle() {
    const goingToMaintenance = asset.status !== 'in_maintenance'
    router.patch(`/inventory/${asset.id}`, { asset: { status: goingToMaintenance ? 'in_maintenance' : 'active' } }, { preserveScroll: true })
    setConfirmModal(false)
  }
  const warrantyUrgent = asset.days_until_warranty !== null && asset.days_until_warranty <= 30

  return (
    <AppLayout title={asset.name}>
      {confirmModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 16 }}
          onClick={() => setConfirmModal(false)}
        >
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="maintenance-modal-title"
            onClick={e => e.stopPropagation()}
            style={{ ...CARD, padding: 28, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
          >
            <h2 id="maintenance-modal-title" style={{ fontSize: 18, fontWeight: 700, color: NAVY, margin: '0 0 6px' }}>
              {asset.status === 'in_maintenance'
                ? t('assets:show.quickActions.markActive')
                : t('assets:show.quickActions.scheduleMaintenance')}
            </h2>
            <p style={{ fontSize: 14, color: SLATE[600], margin: '0 0 20px' }}>
              {asset.status === 'in_maintenance'
                ? t('assets:show.quickActions.confirmMarkActive')
                : t('assets:show.quickActions.confirmScheduleMaintenance')}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setConfirmModal(false)}
                style={{ flex: 1, padding: 11, borderRadius: 10, background: 'transparent', border: '1px solid rgba(15,23,42,0.14)', fontSize: 14, fontWeight: 600, color: SLATE[600], cursor: 'pointer' }}
              >
                {t('assets:show.quickActions.cancel')}
              </button>
              <button
                onClick={confirmToggle}
                style={{ flex: 1, padding: 11, borderRadius: 10, background: TEAL, border: 'none', fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer' }}
              >
                {t('assets:show.quickActions.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        .asset-columns { grid-template-columns: 60% 1fr; }
        @media (max-width: 900px) {
          .asset-columns { grid-template-columns: 1fr; }
        }
      `}</style>
      <div style={{ maxWidth: '1100px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <button onClick={() => router.visit('/inventory')} style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '14px', cursor: 'pointer', padding: 0 }}>← {t('assets:show.back')}</button>
              <span style={{ color: '#E2E8F0' }}>/</span>
              <span style={{ fontSize: '14px', color: '#475569' }}>{asset.asset_number}</span>
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#0F172A', margin: '0 0 6px' }}>{asset.name} — {asset.asset_number}</h1>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <StatusBadge status={asset.status} t={t} />
              {asset.department && <span style={{ fontSize: '13px', color: '#94A3B8' }}>· {asset.department.name}</span>}
            </div>
          </div>
        </div>

        <div className="asset-columns" style={{ display: 'grid', gap: '24px' }}>
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Asset info */}
            <Card title={t('assets:show.assetInformation')}>
              <InfoGrid items={[
                { label: t('assets:show.info.serialNumber'),        value: <span style={{ fontFamily: 'monospace' }}>{asset.serial_number ?? '—'}</span> },
                { label: t('assets:show.info.model'),                value: asset.model_spec ?? '—' },
                { label: t('assets:show.info.purchaseDate'),        value: asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString(speechLang, { month: 'short', day: 'numeric', year: 'numeric' }) : '—' },
                { label: t('assets:show.info.assignedTo'),          value: asset.assigned_to?.name ?? t('assets:show.info.unassigned') },
                { label: t('assets:show.info.assignmentDate'),      value: asset.assigned_at ? new Date(asset.assigned_at).toLocaleDateString(speechLang, { month: 'short', day: 'numeric', year: 'numeric' }) : '—' },
                { label: t('assets:show.info.conditionAtAssignment'), value: asset.condition_at_assignment ?? '—' },
              ]} />
            </Card>

            {/* Risk Score */}
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '56px', fontWeight: '800', color: isHigh ? '#EF4444' : asset.risk_score > 40 ? '#F97316' : '#16A34A', lineHeight: 1 }}>{asset.risk_score}</span>
                  <span style={{ fontSize: '20px', color: '#94A3B8', fontWeight: 400 }}>/100</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: isHigh ? '#EF4444': '#F97316', margin: '0 0 2px' }}>
                    {isHigh ? t('assets:show.riskLevel.high') : asset.risk_score > 40 ? t('assets:show.riskLevel.medium') : t('assets:show.riskLevel.low')}
                  </p>
                  <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>{t('assets:show.riskScoreLabel')}</p>
                </div>
              </div>

              {/* XAI Panel — content generated by GPT-4o, intentionally left untranslated (see session decision) */}
              {ra && (
                <div style={{ border: '1px solid #E2E8F0', borderRadius: '12px', overflow:'hidden' }}>
                  <div style={{ background: '#028090', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Bot size={14} color="#fff" />
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{t('assets:show.xai.poweredByGpt')}</span>
                  </div>
                  <div style={{ padding: '16px' }}>
                    <p style={{ fontSize: '12px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, margin: '0 0 12px' }}>{t('assets:show.xai.riskFactors')}</p>
                    {[
                      { key: 'incidents',   data: ra.factors.incidents },
                      { key: 'maintenance', data: ra.factors.maintenance },
                      { key: 'warranty',    data: ra.factors.warranty },
                      { key: 'age',         data: ra.factors.age },
                    ].map(({ key, data }) => (
                      <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems:'center', padding: '8px 0', borderBottom: '1px solid #F8FAFC' }}>
                        <span style={{ fontSize: '13px', color: '#475569' }}>{data.label}</span>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: IMPACT_COLOR[data.impact],padding: '2px 8px', borderRadius: '999px', background: IMPACT_COLOR[data.impact] + '15', textTransform: 'uppercase'}}>
                          {data.impact} impact
                        </span>
                      </div>
                    ))}
                    <div style={{ marginTop: '14px', padding: '12px', background: '#F8FAFC', borderRadius: '10px' }}>
                      <p style={{ fontSize: '13px', color: '#475569', margin: 0, lineHeight: '1.6' }}>
                        <strong style={{ color: '#0F172A' }}>{t('assets:show.xai.recommendation')}</strong>{ra.recommendation}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Warranty */}
            {asset.warranty_expires_at && (
              <Card title={t('assets:show.warranty.title')}>
                {warrantyUrgent && (
                  <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '10px 14px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={14} color="#DC2626" />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#DC2626' }}>{t('assets:show.warranty.expiringSoon')}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <p style={{ fontSize: '13px', color: '#94A3B8', margin: '0 0 2px' }}>{t('assets:show.warranty.expires')}</p>
                    <p style={{ fontSize: '16px', fontWeight: 600, color: warrantyUrgent ?'#DC2626' : '#0F172A', margin: 0 }}>
                      {new Date(asset.warranty_expires_at).toLocaleDateString(speechLang, { month: 'long', day: 'numeric', year: 'numeric' })}
                      {asset.days_until_warranty !== null && (
                        <span style={{ fontSize: '13px', color: warrantyUrgent ? '#DC2626' : '#94A3B8', marginLeft: '8px' }}>
                          {t('assets:show.warranty.days', { count: asset.days_until_warranty })}
                        </span>
                      )}
                    </p>
                  </div>
                  {warrantyUrgent && (
                    <button style={{ padding: '8px 16px', borderRadius: '10px', background: '#EF4444', color: '#fff', fontWeight: 600, fontSize: '13px', border: 'none', cursor: 'pointer' }}>
                      {t('assets:show.warranty.renewWarranty')}
                    </button>
                  )}
                </div>
              </Card>
            )}
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Incident History */}
            <Card title={t('assets:show.incidentHistory', { count: asset.incidents.length })}>
              {asset.incidents.length === 0
                ? <p style={{ fontSize: '13px', color: '#94A3B8', textAlign: 'center', padding: '16px 0', margin: 0 }}>{t('assets:show.noIncidents')}</p>
                : asset.incidents.slice(0, 5).map(inc => (
                  <div key={inc.id} style={{ padding: '10px 0', borderBottom: '1px solid #F8FAFC' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', color: '#0F172A', fontWeight: 500 }}>{inc.title}</span>
                      <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px', background: SEVERITY_STYLE[inc.severity]?.bg, color: SEVERITY_STYLE[inc.severity]?.color, textTransform: 'capitalize', whiteSpace: 'nowrap', marginLeft: '8px' }}>
                        {inc.severity}
                      </span>
                    </div>
                    <p style={{ fontSize: '11px', color: '#94A3B8', margin: 0 }}>
                      {new Date(inc.created_at).toLocaleDateString(speechLang, { month: 'short', day: 'numeric', year: 'numeric' })}
                      {inc.resolved_at && ` · ${t('assets:show.resolved')}`}
                    </p>
                  </div>
                ))
              }
            </Card>

            {/* Quick Actions */}
            <Card title={t('assets:show.quickActions.title')}>
              {[
                { label: t('assets:show.quickActions.reportIncident'), color: '#EF4444', bg: '#FEF2F2' },
                {
                  label: asset.status === 'in_maintenance'
                    ? t('assets:show.quickActions.markActive')
                    : t('assets:show.quickActions.scheduleMaintenance'),
                  color: '#F97316', bg: '#FFF7ED', onClick: scheduleMaintenanceToggle,
                },
                { label: t('assets:show.quickActions.reassignAsset'), color: '#028090', bg: '#F0FDFA' },
                { label: t('assets:show.quickActions.retireAsset'),   color: '#475569', bg: '#F8FAFC' },
              ].map(({ label, color, bg, onClick }) => (
                <button key={label} onClick={onClick} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${color}20`, background: bg, color, fontSize: '13px', fontWeight: 600, cursor: 'pointer', marginBottom: '8px' }}>
                  {label}
                </button>
              ))}
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
      {title && <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A', margin: '0 0 16px' }}>{title}</h2>}
      {children}
    </div>
  )
}

function StatusBadge({ status, t }: { status: string; t: TFunction<'assets'> }) {
  const style = { active: { bg: '#F0FDF4', color: '#15803D' }, in_maintenance: { bg: '#FFF7ED', color: '#C2410C' }, retired: { bg: '#F8FAFC', color: '#475569' }, lost: { bg: '#FEF2F2', color: '#DC2626' } } as Record<string,{ bg: string; color: string }>
  const s = style[status] ?? { bg: '#F8FAFC', color: '#475569' }
  return <span style={{ fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: '999px', background: s.bg, color: s.color }}>{t(`assets:status.${status}`, status)}</span>
}

function InfoGrid({ items }: { items: { label: string; value: React.ReactNode }[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px 24px' }}>
      {items.map(({ label, value }) => (
        <div key={label}>
          <p style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, margin: '0 0 2px' }}>{label}</p>
          <p style={{ fontSize: '14px', color: '#0F172A', margin: 0, fontWeight: 500 }}>{value}</p>
        </div>
      ))}
    </div>
  )
}