import { useState } from 'react'
import { router } from '@inertiajs/react'
import AppLayout from '@/components/AppLayout'
import DatePicker from '@/components/DatePicker'

interface LogEntry {
  id: number
  operation: string
  model: string
  provider: string | null
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  duration_ms: number
  confidence_score: number | null
  status: string
  estimated_cost: number
  prompt: string
  response: string
  created_at: string
}

interface Pagination { page: number; per_page: number; total: number }
interface Filters { operation?: string; provider?: string; status?: string; from?: string; to?: string }

interface Props {
  logs: LogEntry[]
  pagination: Pagination
  filters: Filters
  operations: string[]
  providers: string[]
}

const PROVIDER_COLORS: Record<string, string> = {
  openai: '#10B981', anthropic: '#8B5CF6', gemini: '#3B82F6'
}
const OPERATION_COLORS: Record<string, string> = {
  ticket_classification: '#028090', ticket_embedding: '#6366F1',
  response_suggestion: '#F97316', asset_risk_scoring: '#EF4444',
  onboarding_plan: '#8B5CF6', executive_report: '#0EA5E9',
}

export default function AuditLog({ logs, pagination, filters, operations, providers }: Props) {
  const [expanded, setExpanded] = useState<number | null>(null)
  const [localFilters, setLocalFilters] = useState(filters)

  const totalPages = Math.ceil(pagination.total / pagination.per_page)

  function applyFilters(overrides: Partial<Filters> = {}) {
    const f = { ...localFilters, ...overrides }
    router.get('/admin/audit-log', { ...f, page: 1 } as Record<string, string | number | boolean>, { preserveState: true })
  }

  function goToPage(page: number) {
    router.get('/admin/audit-log', { ...localFilters, page } as Record<string, string | number | boolean>, { preserveState: true })
  }

  return (
    <AppLayout title="AI Audit Log">
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#0F172A' }}>AI Audit Log</h1>
            <p className="text-sm mt-1" style={{ color: '#475569' }}>
              Every AI decision tracked and auditable
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.get('/admin/audit-log')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium"
              style={{ borderColor: '#E2E8F0', color: '#475569', background: '#fff' }}
            >
              <RefreshIcon /> Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <select
            value={localFilters.operation || ''}
            onChange={e => { setLocalFilters(f => ({ ...f, operation: e.target.value })); applyFilters({ operation: e.target.value }) }}
            className="px-3 py-2 rounded-xl border text-sm"
            style={{ borderColor: '#E2E8F0', background: '#fff', color: '#475569' }}
          >
            <option value="">All Operations</option>
            {operations.map(op => <option key={op} value={op}>{op.replace(/_/g, ' ')}</option>)}
          </select>

          <select
            value={localFilters.provider || ''}
            onChange={e => { setLocalFilters(f => ({ ...f, provider: e.target.value })); applyFilters({ provider: e.target.value }) }}
            className="px-3 py-2 rounded-xl border text-sm"
            style={{ borderColor: '#E2E8F0', background: '#fff', color: '#475569' }}
          >
            <option value="">All Providers</option>
            {providers.map(p => <option key={p} value={p}>{p}</option>)}
            {!providers.includes('openai') && <option value="openai">openai</option>}
            {!providers.includes('anthropic') && <option value="anthropic">anthropic</option>}
            {!providers.includes('gemini') && <option value="gemini">gemini</option>}
          </select>

          <select
            value={localFilters.status || ''}
            onChange={e => { setLocalFilters(f => ({ ...f, status: e.target.value })); applyFilters({ status: e.target.value }) }}
            className="px-3 py-2 rounded-xl border text-sm"
            style={{ borderColor: '#E2E8F0', background: '#fff', color: '#475569' }}
          >
            <option value="">All Status</option>
            <option value="success">Success</option>
            <option value="error">Error</option>
          </select>

          <DatePicker
            value={localFilters.from || ''}
            onChange={v => { setLocalFilters(f => ({ ...f, from: v })); applyFilters({ from: v }) }}
            placeholder="From"
          />
          <DatePicker
            value={localFilters.to || ''}
            onChange={v => { setLocalFilters(f => ({ ...f, to: v })); applyFilters({ to: v }) }}
            minDate={localFilters.from ? new Date(localFilters.from) : undefined}
            placeholder="To"
          />
        </div>

        {/* Table */}
        <div className="rounded-2xl border overflow-hidden" style={{ background: '#fff', borderColor: '#E2E8F0', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                {['Timestamp', 'Operation', 'Provider / Model', 'Tokens', 'Cost', 'Duration', 'Confidence', 'Status', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#475569' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-sm" style={{ color: '#94A3B8' }}>No logs found</td></tr>
              )}
              {logs.map(log => (
                <>
                  <tr
                    key={log.id}
                    style={{ borderBottom: '1px solid #F1F5F9', background: expanded === log.id ? '#F8FAFC' : '#fff' }}
                  >
                    <td className="px-4 py-3 text-xs" style={{ color: '#475569' }}>{log.created_at}</td>

                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-1 rounded-lg text-xs font-medium"
                        style={{
                          background: `${OPERATION_COLORS[log.operation] || '#6B7280'}18`,
                          color: OPERATION_COLORS[log.operation] || '#6B7280'
                        }}
                      >
                        {log.operation.replace(/_/g, '_')}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: PROVIDER_COLORS[log.provider || ''] || '#94A3B8' }}
                        />
                        <span className="font-mono text-xs" style={{ color: '#0F172A' }}>{log.model}</span>
                      </div>
                      {log.provider && (
                        <span className="text-xs" style={{ color: '#94A3B8' }}>{log.provider}</span>
                      )}
                    </td>

                    <td className="px-4 py-3 font-mono text-xs" style={{ color: '#475569' }}>
                      {log.total_tokens.toLocaleString()}
                    </td>

                    <td className="px-4 py-3 font-mono text-xs font-medium" style={{ color: '#028090' }}>
                      ${log.estimated_cost.toFixed(4)}
                    </td>

                    <td className="px-4 py-3 text-xs" style={{ color: '#475569' }}>
                      {log.duration_ms.toLocaleString()}ms
                    </td>

                    <td className="px-4 py-3">
                      {log.confidence_score !== null ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: '#E2E8F0' }}>
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${(log.confidence_score * 100).toFixed(0)}%`,
                                background: log.confidence_score >= 0.7 ? '#16A34A' : log.confidence_score >= 0.5 ? '#F97316' : '#EF4444'
                              }}
                            />
                          </div>
                          <span className="text-xs font-medium" style={{
                            color: log.confidence_score >= 0.7 ? '#16A34A' : log.confidence_score >= 0.5 ? '#F97316' : '#EF4444'
                          }}>
                            {(log.confidence_score * 100).toFixed(0)}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs" style={{ color: '#94A3B8' }}>—</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          background: log.status === 'success' ? '#F0FDF4' : '#FEF2F2',
                          color:      log.status === 'success' ? '#16A34A' : '#EF4444'
                        }}
                      >
                        {log.status === 'success' ? '● Success' : '● Error'}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <button
                        onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                        className="text-xs px-2 py-1 rounded-lg"
                        style={{ color: '#028090', background: '#F0FDFA' }}
                      >
                        {expanded === log.id ? '▲' : '▼'}
                      </button>
                    </td>
                  </tr>

                  {/* Expanded row */}
                  {expanded === log.id && (
                    <tr key={`${log.id}-expanded`} style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      <td colSpan={9} className="px-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#475569' }}>
                              Prompt
                            </p>
                            <div
                              className="rounded-xl p-3 font-mono text-xs leading-relaxed"
                              style={{ background: '#0F172A', color: '#94A3B8', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                            >
                              {log.prompt || '—'}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#475569' }}>
                              Response
                            </p>
                            <div
                              className="rounded-xl p-3 font-mono text-xs leading-relaxed"
                              style={{ background: '#0F172A', color: '#10B981', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                            >
                              {log.response || '—'}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-6 mt-3 text-xs" style={{ color: '#94A3B8' }}>
                          <span>Prompt tokens: <strong style={{ color: '#475569' }}>{log.prompt_tokens}</strong></span>
                          <span>Completion tokens: <strong style={{ color: '#475569' }}>{log.completion_tokens}</strong></span>
                          <span>Total: <strong style={{ color: '#475569' }}>{log.total_tokens}</strong></span>
                          <span>Provider: <strong style={{ color: PROVIDER_COLORS[log.provider || ''] || '#475569' }}>{log.provider || 'unknown'}</strong></span>
                          <span>Model: <strong style={{ color: '#475569' }}>{log.model}</strong></span>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: '#E2E8F0' }}>
              <span className="text-xs" style={{ color: '#475569' }}>
                Showing {((pagination.page - 1) * pagination.per_page) + 1}–{Math.min(pagination.page * pagination.per_page, pagination.total)} of {pagination.total} entries
              </span>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => goToPage(p)}
                    className="w-8 h-8 rounded-lg text-xs font-medium"
                    style={{
                      background: p === pagination.page ? '#028090' : '#F8FAFC',
                      color:      p === pagination.page ? '#fff' : '#475569',
                      border:     `1px solid ${p === pagination.page ? '#028090' : '#E2E8F0'}`
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </AppLayout>
  )
}

function RefreshIcon() {
  return <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
}
