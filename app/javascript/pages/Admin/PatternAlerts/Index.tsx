import { router } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
import AdminLayout from '@/components/AdminLayout'
import { useLocale } from '@/hooks/useLocale'

interface AlertMetadata {
  department_id?: number
  department_name?: string
  zscore?: number
  current_count?: number
  baseline_mean?: number
  baseline_std?: number
}

interface PatternAlert {
  id: number
  alert_type: string
  severity: string
  title: string
  description: string
  metadata: AlertMetadata
  resolved: boolean
  resolved_at: string | null
  created_at: string
}

interface Props {
  alerts: PatternAlert[]
}

const SEVERITY_COLOR: Record<string, string> = {
  critical: '#dc2626',
  high: '#f97316',
  medium: '#eab308',
  low: '#64748b',
}

export default function PatternAlertsIndex({ alerts }: Props) {
  const { t } = useTranslation('admin')
  const { speechLang } = useLocale()

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleString(speechLang, {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    })
  }

  const activeAlerts = alerts.filter((a) => !a.resolved)
  const resolvedAlerts = alerts.filter((a) => a.resolved)

  const resolve = (id: number) => {
    router.patch(`/admin/pattern_alerts/${id}`, {})
  }

  const runNow = () => {
    router.post('/admin/pattern_alerts/run_now', {})
  }

  return (
    <AdminLayout title={t('patternAlerts.pageTitle')}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#0F172A' }}>{t('patternAlerts.header.title')}</h1>
            <p className="text-sm mt-1" style={{ color: '#475569' }}>
              {t('patternAlerts.header.subtitle')}
            </p>
          </div>
          <button
            onClick={runNow}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: '#028090' }}
          >
            {t('patternAlerts.runNow')}
          </button>
        </div>

        <div className="rounded-2xl border p-6" style={{ background: '#fff', borderColor: '#E2E8F0', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <h2 className="text-base font-semibold mb-4" style={{ color: '#0F172A' }}>
            {t('patternAlerts.active', { count: activeAlerts.length })}
          </h2>

          {activeAlerts.length === 0 && (
            <p className="text-sm" style={{ color: '#94A3B8' }}>{t('patternAlerts.noActive')}</p>
          )}

          <div className="space-y-3">
            {activeAlerts.map((alert) => (
              <div key={alert.id} className="rounded-xl border p-4" style={{ borderColor: '#F1F5F9' }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-white text-xs font-bold px-2 py-0.5 rounded-full uppercase"
                        style={{ background: SEVERITY_COLOR[alert.severity] ?? '#64748b' }}
                      >
                        {alert.severity}
                      </span>
                      <span className="text-xs" style={{ color: '#94A3B8' }}>{formatDate(alert.created_at)}</span>
                    </div>
                    <p className="text-sm font-semibold" style={{ color: '#0F172A' }}>{alert.title}</p>
                    <p className="text-sm mt-1" style={{ color: '#475569' }}>{alert.description}</p>
                    {alert.metadata.zscore != null && (
                      <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>
                        {t('patternAlerts.zscoreLine', {
                          zscore: alert.metadata.zscore.toFixed(1),
                          count: alert.metadata.current_count,
                          baseline: alert.metadata.baseline_mean,
                        })}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => resolve(alert.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0"
                    style={{ background: '#F1F5F9', color: '#0F172A' }}
                  >
                    {t('patternAlerts.resolve')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {resolvedAlerts.length > 0 && (
          <div className="rounded-2xl border p-6" style={{ background: '#fff', borderColor: '#E2E8F0', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
            <h2 className="text-base font-semibold mb-4" style={{ color: '#0F172A' }}>
              {t('patternAlerts.resolved', { count: resolvedAlerts.length })}
            </h2>
            <div className="space-y-2">
              {resolvedAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between py-2 border-b text-sm" style={{ borderColor: '#F1F5F9' }}>
                  <span style={{ color: '#475569' }}>{alert.title}</span>
                  <span className="text-xs" style={{ color: '#94A3B8' }}>
                    {alert.resolved_at ? t('patternAlerts.resolvedAt', { date: formatDate(alert.resolved_at) }) : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}