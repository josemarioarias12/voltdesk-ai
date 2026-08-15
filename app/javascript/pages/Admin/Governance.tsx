import { useState } from 'react'
import { router } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
import AdminLayout from '@/components/AdminLayout'
import { useActionCable } from '@/hooks/useActionCable'

interface Suggestion {
  id: number
  suggestion_type: 'pricing_update' | 'model_deprecation'
  status: 'pending_approval' | 'approved' | 'rejected' | 'applied'
  provider: string
  model: string
  result: Record<string, string | number | boolean | null>
  reviewed_by: string | null
  reviewed_at: string | null
  applied_at: string | null
  created_at: string
}

interface Filters { suggestion_type?: string; status?: string }

interface Props {
  suggestions: Suggestion[]
  filters: Filters
}

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  pending_approval: { bg: '#FFF7ED', fg: '#EA580C' },
  approved: { bg: '#F0FDF4', fg: '#16A34A' },
  rejected: { bg: '#FEF2F2', fg: '#EF4444' },
  applied: { bg: '#F0FDFA', fg: '#028090' },
}

function formatPrice(value: string | number | boolean | null | undefined): string {
  const num = Number(value)
  if (Number.isNaN(num)) return '—'
  return `$${num.toFixed(6).replace(/0+$/, '').replace(/\.$/, '')}`
}

export default function Governance({ suggestions, filters }: Props) {
  const { t } = useTranslation('admin')
  const [localFilters, setLocalFilters] = useState(filters)
  const [historyOpen, setHistoryOpen] = useState(false)

  useActionCable({ channel: 'GovernanceChannel' }, () => {
    router.reload({ only: ['suggestions'] })
  })

  function applyFilters(overrides: Partial<Filters> = {}) {
    const f = { ...localFilters, ...overrides }
    router.get('/admin/governance', f as Record<string, string>, { preserveState: true })
  }

  function approve(id: number) {
    router.patch(`/admin/governance/${id}/approve`, {}, { preserveScroll: true })
  }

  function reject(id: number) {
    router.patch(`/admin/governance/${id}/reject`, {}, { preserveScroll: true })
  }

  function markApplied(id: number) {
    router.patch(`/admin/governance/${id}/mark_applied`, {}, { preserveScroll: true })
  }

  function syncNow(checkType: string) {
    router.post('/admin/governance/sync_now', { check_type: [checkType] }, { preserveScroll: true })
  }

  const pending = suggestions.filter(s => s.status === 'pending_approval')
  const history = suggestions.filter(s => s.status !== 'pending_approval')
  const appliedCount = suggestions.filter(s => s.status === 'applied').length
  const rejectedCount = suggestions.filter(s => s.status === 'rejected').length

  function renderDetails(s: Suggestion) {
    if (s.suggestion_type !== 'pricing_update') {
      return (
        <span>
          {t('governance.notFoundInSource', { source: s.result.source })}
          {s.result.verify_url && (
            <>
              {' · '}
              <a
                href={String(s.result.verify_url)}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#028090', textDecoration: 'underline' }}
              >
                {t('governance.verifySource')}
              </a>
            </>
          )}
        </span>
      )
    }
    return (
      <div className="space-y-1">
        <div>
          <span style={{ color: '#EF4444', textDecoration: 'line-through' }}>
            {formatPrice(s.result.current_input)}
          </span>
          {' → '}
          <span style={{ color: '#16A34A', fontWeight: 600 }}>
            {formatPrice(s.result.fetched_input)}
          </span>
          <span style={{ color: '#94A3B8' }}> {t('governance.diff.input')}</span>
        </div>
        <div>
          <span style={{ color: '#EF4444', textDecoration: 'line-through' }}>
            {formatPrice(s.result.current_output)}
          </span>
          {' → '}
          <span style={{ color: '#16A34A', fontWeight: 600 }}>
            {formatPrice(s.result.fetched_output)}
          </span>
          <span style={{ color: '#94A3B8' }}> {t('governance.diff.output')}</span>
        </div>
        {s.result.verify_url && (
          <a
            href={String(s.result.verify_url)}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#028090', textDecoration: 'underline', fontSize: '11px' }}
          >
            {t('governance.verifySource')}
          </a>
        )}
      </div>
    )
  }

  function renderRow(s: Suggestion) {
    return (
      <tr key={s.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
        <td className="px-4 py-3 text-xs font-medium" style={{ color: '#475569' }}>
          {s.suggestion_type === 'pricing_update' ? t('governance.filters.pricingUpdate') : t('governance.filters.modelDeprecation')}
        </td>

        <td className="px-4 py-3">
          <span className="font-mono text-xs" style={{ color: '#0F172A' }}>{s.provider}/{s.model}</span>
        </td>

        <td className="px-4 py-3 text-xs" style={{ color: '#475569' }}>
          {renderDetails(s)}
        </td>

        <td className="px-4 py-3">
          <span
            className="px-2 py-1 rounded-full text-xs font-medium"
            style={{ background: STATUS_COLORS[s.status].bg, color: STATUS_COLORS[s.status].fg }}
          >
            {t(`governance.status.${s.status}`)}
          </span>
        </td>

        <td className="px-4 py-3 text-xs" style={{ color: '#94A3B8' }}>
          {s.reviewed_by || '—'}
        </td>

        <td className="px-4 py-3">
          <div className="flex gap-2">
            {s.status === 'pending_approval' && (
              <>
                <button onClick={() => approve(s.id)} className="text-xs px-2 py-1 rounded-lg font-medium" style={{ color: '#16A34A', background: '#F0FDF4' }}>
                  {t('governance.approve')}
                </button>
                <button onClick={() => reject(s.id)} className="text-xs px-2 py-1 rounded-lg font-medium" style={{ color: '#EF4444', background: '#FEF2F2' }}>
                  {t('governance.reject')}
                </button>
              </>
            )}
            {s.status === 'approved' && (
              <button onClick={() => markApplied(s.id)} className="text-xs px-2 py-1 rounded-lg font-medium" style={{ color: '#028090', background: '#F0FDFA' }}>
                {t('governance.markApplied')}
              </button>
            )}
          </div>
        </td>
      </tr>
    )
  }

  const headers = [
    t('governance.table.type'),
    t('governance.table.model'),
    t('governance.table.details'),
    t('governance.table.status'),
    t('governance.table.reviewedBy'),
    ''
  ]

  return (
    <AdminLayout title={t('governance.pageTitle')}>
      <div className="space-y-6">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#0F172A' }}>{t('governance.header.title')}</h1>
            <p className="text-sm mt-1" style={{ color: '#475569' }}>
              {t('governance.header.subtitle')}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => syncNow('pricing')}
              className="px-4 py-2 rounded-xl border text-sm font-medium"
              style={{ borderColor: '#E2E8F0', color: '#475569', background: '#fff' }}
            >
              {t('governance.syncPricing')}
            </button>
            <button
              onClick={() => syncNow('deprecation')}
              className="px-4 py-2 rounded-xl border text-sm font-medium"
              style={{ borderColor: '#E2E8F0', color: '#475569', background: '#fff' }}
            >
              {t('governance.syncDeprecation')}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-2xl border p-4" style={{ background: '#fff', borderColor: '#E2E8F0' }}>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#EA580C' }}>
              {t('governance.kpi.pending')}
            </p>
            <p className="text-2xl font-bold mt-1" style={{ color: '#0F172A' }}>{pending.length}</p>
          </div>
          <div className="rounded-2xl border p-4" style={{ background: '#fff', borderColor: '#E2E8F0' }}>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#028090' }}>
              {t('governance.kpi.applied')}
            </p>
            <p className="text-2xl font-bold mt-1" style={{ color: '#0F172A' }}>{appliedCount}</p>
          </div>
          <div className="rounded-2xl border p-4" style={{ background: '#fff', borderColor: '#E2E8F0' }}>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#EF4444' }}>
              {t('governance.kpi.rejected')}
            </p>
            <p className="text-2xl font-bold mt-1" style={{ color: '#0F172A' }}>{rejectedCount}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            value={localFilters.suggestion_type || ''}
            onChange={e => { setLocalFilters(f => ({ ...f, suggestion_type: e.target.value })); applyFilters({ suggestion_type: e.target.value }) }}
            className="px-3 py-2 rounded-xl border text-sm"
            style={{ borderColor: '#E2E8F0', background: '#fff', color: '#475569' }}
          >
            <option value="">{t('governance.filters.allTypes')}</option>
            <option value="pricing_update">{t('governance.filters.pricingUpdate')}</option>
            <option value="model_deprecation">{t('governance.filters.modelDeprecation')}</option>
          </select>

          <select
            value={localFilters.status || ''}
            onChange={e => { setLocalFilters(f => ({ ...f, status: e.target.value })); applyFilters({ status: e.target.value }) }}
            className="px-3 py-2 rounded-xl border text-sm"
            style={{ borderColor: '#E2E8F0', background: '#fff', color: '#475569' }}
          >
            <option value="">{t('governance.filters.allStatus')}</option>
            <option value="pending_approval">{t('governance.filters.statusPendingApproval')}</option>
            <option value="approved">{t('governance.filters.statusApproved')}</option>
            <option value="rejected">{t('governance.filters.statusRejected')}</option>
            <option value="applied">{t('governance.filters.statusApplied')}</option>
          </select>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: '#475569' }}>
              {t('governance.sections.pendingReview')}
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: '#FFF7ED', color: '#EA580C' }}>
              {pending.length}
            </span>
          </div>
          <div className="rounded-2xl border overflow-hidden" style={{ background: '#fff', borderColor: '#E2E8F0', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  {headers.map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#475569' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pending.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-sm" style={{ color: '#94A3B8' }}>{t('governance.table.empty')}</td></tr>
                )}
                {pending.map(renderRow)}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <button
            onClick={() => setHistoryOpen(o => !o)}
            className="flex items-center gap-2 mb-2"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: '#475569' }}>
              {t('governance.sections.history')}
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: '#F1F5F9', color: '#475569' }}>
              {history.length}
            </span>
            <span style={{ color: '#94A3B8', fontSize: '12px' }}>{historyOpen ? '▲' : '▼'}</span>
          </button>
          {historyOpen && (
            <div className="rounded-2xl border overflow-hidden" style={{ background: '#fff', borderColor: '#E2E8F0', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    {headers.map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#475569' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-12 text-center text-sm" style={{ color: '#94A3B8' }}>{t('governance.table.empty')}</td></tr>
                  )}
                  {history.map(renderRow)}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  )
}