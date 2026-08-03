import { useState } from 'react'
import { router } from '@inertiajs/react'
import AppLayout from '@/components/AppLayout'

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

export default function Governance({ suggestions, filters }: Props) {
  const [localFilters, setLocalFilters] = useState(filters)

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

  return (
    <AppLayout title="Model Governance">
      <div className="space-y-6">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#0F172A' }}>Model Governance</h1>
            <p className="text-sm mt-1" style={{ color: '#475569' }}>
              Pricing and deprecation checks across configured AI models
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => syncNow('pricing')}
              className="px-4 py-2 rounded-xl border text-sm font-medium"
              style={{ borderColor: '#E2E8F0', color: '#475569', background: '#fff' }}
            >
              Sync Pricing
            </button>
            <button
              onClick={() => syncNow('deprecation')}
              className="px-4 py-2 rounded-xl border text-sm font-medium"
              style={{ borderColor: '#E2E8F0', color: '#475569', background: '#fff' }}
            >
              Sync Deprecation
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            value={localFilters.suggestion_type || ''}
            onChange={e => { setLocalFilters(f => ({ ...f, suggestion_type: e.target.value })); applyFilters({ suggestion_type: e.target.value }) }}
            className="px-3 py-2 rounded-xl border text-sm"
            style={{ borderColor: '#E2E8F0', background: '#fff', color: '#475569' }}
          >
            <option value="">All Types</option>
            <option value="pricing_update">Pricing Update</option>
            <option value="model_deprecation">Model Deprecation</option>
          </select>

          <select
            value={localFilters.status || ''}
            onChange={e => { setLocalFilters(f => ({ ...f, status: e.target.value })); applyFilters({ status: e.target.value }) }}
            className="px-3 py-2 rounded-xl border text-sm"
            style={{ borderColor: '#E2E8F0', background: '#fff', color: '#475569' }}
          >
            <option value="">All Status</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="applied">Applied</option>
          </select>
        </div>

        <div className="rounded-2xl border overflow-hidden" style={{ background: '#fff', borderColor: '#E2E8F0', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                {['Type', 'Model', 'Details', 'Status', 'Reviewed By', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#475569' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {suggestions.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-sm" style={{ color: '#94A3B8' }}>No suggestions found</td></tr>
              )}
              {suggestions.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td className="px-4 py-3 text-xs font-medium" style={{ color: '#475569' }}>
                    {s.suggestion_type === 'pricing_update' ? 'Pricing Update' : 'Model Deprecation'}
                  </td>

                  <td className="px-4 py-3">
                    <span className="font-mono text-xs" style={{ color: '#0F172A' }}>{s.provider}/{s.model}</span>
                  </td>

                  <td className="px-4 py-3 text-xs" style={{ color: '#475569' }}>
                    {s.suggestion_type === 'pricing_update' ? (
                      <>
                        ${s.result.current_input} / ${s.result.current_output} → ${s.result.fetched_input} / ${s.result.fetched_output}
                      </>
                    ) : (
                      <>Not found in {s.result.source}'s live model list</>
                    )}
                    {s.result.verify_url && (
                      <>
                        {' · '}
                        <a
                          href={String(s.result.verify_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#028090', textDecoration: 'underline' }}
                        >
                          Verify source
                        </a>
                      </>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{ background: STATUS_COLORS[s.status].bg, color: STATUS_COLORS[s.status].fg }}
                    >
                      {s.status.replace(/_/g, ' ')}
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
                            Approve
                          </button>
                          <button onClick={() => reject(s.id)} className="text-xs px-2 py-1 rounded-lg font-medium" style={{ color: '#EF4444', background: '#FEF2F2' }}>
                            Reject
                          </button>
                        </>
                      )}
                      {s.status === 'approved' && (
                        <button onClick={() => markApplied(s.id)} className="text-xs px-2 py-1 rounded-lg font-medium" style={{ color: '#028090', background: '#F0FDFA' }}>
                          Mark Applied
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </AppLayout>
  )
}