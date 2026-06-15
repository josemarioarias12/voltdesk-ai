import AppLayout from '@/components/AppLayout'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { router } from '@inertiajs/react'

interface RequestsPerHour  { hour: string; count: number }
interface TopEndpoint      { endpoint: string; method: string; count: number }
interface ErrorRate        { endpoint: string; total: number; errors: number; error_rate_pct: number }

interface Metrics {
  requests_per_hour:  RequestsPerHour[]
  top_endpoints:      TopEndpoint[]
  error_rate:         ErrorRate[]
  p95_latency_ms:     number
  total_requests:     number
  total_errors:       number
}

interface Props {
  metrics: Metrics
  period:  string
}

const TEAL  = '#028090'
const MINT  = '#02C39A'
const RED   = '#EF4444'
const SLATE = '#1E293B'
const GRAY  = '#475569'
const LIGHT = '#F8FAFC'
const BORDER = '#E2E8F0'

const METHOD_COLORS: Record<string, string> = {
  GET:    '#3B82F6',
  POST:   '#028090',
  DELETE: '#EF4444',
  PATCH:  '#F59E0B',
}

function KpiCard({ label, value, sub, color = TEAL }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="rounded-2xl border p-5" style={{ background: '#fff', borderColor: BORDER, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
      <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: GRAY }}>{label}</p>
      <p className="text-3xl font-bold" style={{ color }}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: GRAY }}>{sub}</p>}
    </div>
  )
}

export default function ApiDashboardIndex({ metrics, period }: Props) {
  const errorRate = metrics.total_requests > 0
    ? ((metrics.total_errors / metrics.total_requests) * 100).toFixed(1)
    : '0.0'

  function handlePeriod(p: string) {
    router.get('/admin/api_dashboard', { period: p }, { preserveState: true })
  }

  function formatHour(iso: string) {
    return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  }

  const hourlyData = (metrics.requests_per_hour ?? []).map(r => ({
    ...r,
    hour: formatHour(r.hour),
  }))

  return (
    <AppLayout title="API Dashboard">
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: SLATE }}>API Dashboard</h1>
            <p className="text-sm mt-1" style={{ color: GRAY }}>Real-time API usage metrics and performance</p>
          </div>
          <div className="flex gap-2">
            {[['24h', '24 hours'], ['7d', '7 days']].map(([val, label]) => (
              <button
                key={val}
                onClick={() => handlePeriod(val)}
                className="px-4 py-2 rounded-xl text-sm font-medium"
                style={{
                  background:  period === val ? TEAL : LIGHT,
                  color:       period === val ? '#fff' : GRAY,
                  border:      `1px solid ${period === val ? TEAL : BORDER}`,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-4">
          <KpiCard label="Total Requests"  value={metrics.total_requests?.toLocaleString() ?? '0'} sub={`Last ${period === '7d' ? '7 days' : '24 hours'}`} />
          <KpiCard label="Total Errors"    value={metrics.total_errors ?? 0}    color={metrics.total_errors > 0 ? RED : TEAL} sub="Status >= 400" />
          <KpiCard label="Error Rate"      value={`${errorRate}%`}              color={parseFloat(errorRate) > 5 ? RED : TEAL} sub="Errors / total" />
          <KpiCard label="p95 Latency"     value={`${metrics.p95_latency_ms ?? 0}ms`} color={metrics.p95_latency_ms > 300 ? '#F59E0B' : TEAL} sub="95th percentile" />
        </div>

        {/* Requests per hour */}
        <div className="rounded-2xl border p-6" style={{ background: '#fff', borderColor: BORDER, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          <h2 className="text-base font-semibold mb-4" style={{ color: SLATE }}>Requests Over Time</h2>
          {hourlyData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm" style={{ color: GRAY }}>No data for this period</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="hour" tick={{ fontSize: 11, fill: GRAY }} />
                <YAxis tick={{ fontSize: 11, fill: GRAY }} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: `1px solid ${BORDER}`, fontSize: 12 }}
                  formatter={((v: number) => [v, 'Requests']) as never}
                />
                <Line type="monotone" dataKey="count" stroke={TEAL} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top endpoints + Error rates */}
        <div className="grid grid-cols-2 gap-4">

          {/* Top 5 endpoints */}
          <div className="rounded-2xl border p-6" style={{ background: '#fff', borderColor: BORDER, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
            <h2 className="text-base font-semibold mb-4" style={{ color: SLATE }}>Top Endpoints by Volume</h2>
            {(metrics.top_endpoints ?? []).length === 0 ? (
              <div className="h-40 flex items-center justify-center text-sm" style={{ color: GRAY }}>No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={metrics.top_endpoints} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: GRAY }} />
                  <YAxis type="category" dataKey="endpoint" tick={{ fontSize: 10, fill: GRAY }} width={140} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: `1px solid ${BORDER}`, fontSize: 12 }}
                    formatter={((v: number) => [v, 'Requests']) as never}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {(metrics.top_endpoints ?? []).map((entry, i) => (
                      <Cell key={i} fill={METHOD_COLORS[entry.method] ?? MINT} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Error rate by endpoint */}
          <div className="rounded-2xl border p-6" style={{ background: '#fff', borderColor: BORDER, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
            <h2 className="text-base font-semibold mb-4" style={{ color: SLATE }}>Error Rate by Endpoint</h2>
            {(metrics.error_rate ?? []).length === 0 ? (
              <div className="h-40 flex items-center justify-center text-sm" style={{ color: GRAY }}>No errors recorded</div>
            ) : (
              <div className="space-y-3 overflow-y-auto" style={{ maxHeight: 200 }}>
                {metrics.error_rate.map((row, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono truncate" style={{ color: SLATE }}>{row.endpoint}</p>
                      <div className="mt-1 h-1.5 rounded-full" style={{ background: '#F1F5F9' }}>
                        <div
                          className="h-1.5 rounded-full"
                          style={{
                            width: `${Math.min(row.error_rate_pct, 100)}%`,
                            background: row.error_rate_pct > 10 ? RED : row.error_rate_pct > 5 ? '#F59E0B' : MINT,
                          }}
                        />
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold" style={{ color: row.error_rate_pct > 10 ? RED : SLATE }}>
                        {row.error_rate_pct}%
                      </p>
                      <p className="text-xs" style={{ color: GRAY }}>{row.errors}/{row.total}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </AppLayout>
  )
}