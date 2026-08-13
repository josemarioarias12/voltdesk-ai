import { useState } from 'react'
import { Head, router } from '@inertiajs/react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import AdminLayout from '@/components/AdminLayout'
import { useActionCable } from '@/hooks/useActionCable'
import { useLocale } from '@/hooks/useLocale'
interface Pattern {
  from: string
  to: string
  count: number
}
interface TrendPoint {
  week: string
  count: number
}
interface Suggestion {
  summary: string
  suggested_prompt_addition: string
  correction_patterns: { from: string; to: string; count: number; pct: number }[]
  confidence: number
  generated_at: string
  applied_at?: string
}
interface Props {
  total_corrections: number
  corrections_last_30_days: number
  top_patterns: Pattern[]
  learning_suggestion: Suggestion | null
  threshold: number
  correction_rate_trend: TrendPoint[]
}
function KpiCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div
      className="p-5"
      style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
    >
      <p className="text-xs uppercase tracking-wide" style={{ color: '#94A3B8' }}>{label}</p>
      <p className="text-3xl font-bold mt-1" style={{ color: '#0F172A' }}>{value}</p>
    </div>
  )
}
export default function LearningIndex({
  total_corrections,
  corrections_last_30_days,
  top_patterns,
  learning_suggestion: initialSuggestion,
  threshold,
  correction_rate_trend,
}: Props) {
  const { t } = useTranslation('admin')
  const { speechLang } = useLocale()
  const [suggestion, setSuggestion] = useState<Suggestion | null>(initialSuggestion)
  const workspaceId = (window as unknown as { workspaceId?: number }).workspaceId ?? 0
  const progress = Math.min((total_corrections / threshold) * 100, 100)
  useActionCable(
    { channel: `workspace_admin:${workspaceId}` },
    (data: Record<string, unknown>) => {
      if (data.event !== 'learning_suggestion_ready') return
      toast.success(t('learning.newSuggestionToast'))
      router.reload({ only: ['learning_suggestion'] })
    }
  )
  function handleApply() {
    router.post('/admin/learning/apply', {}, {
      onSuccess: () => router.reload()
    })
  }
  function handleDismiss() {
    router.post('/admin/learning/dismiss', {}, {
      onSuccess: () => setSuggestion(null)
    })
  }
  return (
    <AdminLayout title={t('learning.pageTitle')}>
      <Head title={t('learning.pageTitle')} />
      <div className="max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#0F172A' }}>{t('learning.header.title')}</h1>
          <p className="mt-1 text-sm" style={{ color: '#475569' }}>
            {t('learning.header.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label={t('learning.kpi.totalCorrections')} value={total_corrections} />
          <KpiCard label={t('learning.kpi.last30Days')} value={corrections_last_30_days} />
          <KpiCard label={t('learning.kpi.patternsDetected')} value={top_patterns.length} />
          <KpiCard label={t('learning.kpi.threshold')} value={`${total_corrections}/${threshold}`} />
        </div>

        {total_corrections < threshold && (
          <div
            className="p-5"
            style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
          >
            <div className="flex justify-between text-sm mb-2" style={{ color: '#475569' }}>
              <span>{t('learning.progress.label')}</span>
              <span>{t('learning.progress.corrections', { current: total_corrections, threshold })}</span>
            </div>
            <div className="w-full rounded-full h-3" style={{ background: '#F1F5F9' }}>
              <div
                className="h-3 rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, background: '#028090' }}
              />
            </div>
            <p className="text-xs mt-2" style={{ color: '#94A3B8' }}>
              {t('learning.progress.helper')}
            </p>
          </div>
        )}

        <div
          className="p-5"
          style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
        >
          <h2 className="font-semibold mb-4" style={{ color: '#0F172A' }}>{t('learning.trendChart')}</h2>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={correction_rate_trend}>
              <XAxis dataKey="week" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#028090" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {top_patterns.length > 0 && (
          <div
            className="overflow-x-auto"
            style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
          >
            <div className="px-5 py-4" style={{ borderBottom: '1px solid #F1F5F9' }}>
              <h2 className="font-semibold" style={{ color: '#0F172A' }}>{t('learning.patternsTable.title')}</h2>
            </div>
            <table className="w-full text-sm" style={{ minWidth: '420px' }}>
              <thead style={{ background: '#F8FAFC' }}>
                <tr>
                  <th className="text-left px-4 py-3 font-medium" style={{ color: '#475569' }}>{t('learning.patternsTable.from')}</th>
                  <th className="text-left px-4 py-3 font-medium" style={{ color: '#475569' }}></th>
                  <th className="text-left px-4 py-3 font-medium" style={{ color: '#475569' }}>{t('learning.patternsTable.to')}</th>
                  <th className="text-left px-4 py-3 font-medium" style={{ color: '#475569' }}>{t('learning.patternsTable.count')}</th>
                </tr>
              </thead>
              <tbody>
                {top_patterns.map((pattern, idx) => (
                  <tr key={idx} style={{ borderTop: '1px solid #F1F5F9' }}>
                    <td className="px-4 py-3" style={{ color: '#0F172A' }}>{pattern.from}</td>
                    <td className="px-4 py-3" style={{ color: '#94A3B8' }}>→</td>
                    <td className="px-4 py-3 font-medium" style={{ color: '#028090' }}>{pattern.to}</td>
                    <td className="px-4 py-3" style={{ color: '#475569' }}>{pattern.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {suggestion ? (
          <div
            className="p-5 space-y-4"
            style={{ background: '#fff', border: '1px solid #99F6E4', borderRadius: '12px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold" style={{ color: '#0F172A' }}>{t('learning.suggestion.title')}</h2>
              <span
                className="text-xs px-2 py-1 rounded"
                style={{ background: '#F0FDFA', color: '#028090', border: '1px solid #99F6E4' }}
              >
                {t('learning.suggestion.generated', { date: new Date(suggestion.generated_at).toLocaleDateString(speechLang) })}
              </span>
            </div>
            <p className="text-sm" style={{ color: '#475569' }}>{suggestion.summary}</p>
            <div className="p-4 rounded-lg" style={{ background: '#0D1B2A' }}>
              <pre className="text-xs whitespace-pre-wrap font-mono" style={{ color: '#02C39A' }}>
                {suggestion.suggested_prompt_addition}
              </pre>
            </div>
            {suggestion.applied_at ? (
              <p className="text-sm font-medium" style={{ color: '#16A34A' }}>
                {t('learning.suggestion.applied', { date: new Date(suggestion.applied_at).toLocaleDateString(speechLang) })}
              </p>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={handleApply}
                  className="px-4 py-2 text-sm rounded-lg transition-opacity"
                  style={{ background: '#028090', color: '#fff' }}
                >
                  {t('learning.suggestion.apply')}
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-4 py-2 text-sm rounded-lg transition-opacity"
                  style={{ background: '#F8FAFC', color: '#475569' }}
                >
                  {t('learning.suggestion.dismiss')}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div
            className="p-10 text-center"
            style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
          >
            <p className="text-sm" style={{ color: '#94A3B8' }}>
              {t('learning.empty', { threshold })}
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
