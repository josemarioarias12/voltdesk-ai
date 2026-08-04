import AdminLayout from '@/components/AdminLayout'
import { IconBolt } from '@/components/Icons'

interface Stats {
  total_operations: number
  total_cost_usd: number
  avg_confidence: number
  avg_latency_ms: number
  success_rate: number
  operations_by_type: Record<string, number>
  provider_breakdown: Record<string, number>
}

const PROVIDER_COLORS: Record<string, string> = {
  openai: '#10B981', anthropic: '#8B5CF6', gemini: '#3B82F6'
}

export default function AdminOverview({ stats }: { stats: Stats }) {
  return (
    <AdminLayout title="Admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#0F172A' }}>Admin Control Center</h1>
          <p className="text-sm mt-1" style={{ color: '#475569' }}>AI operations overview for this workspace</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Total Operations', value: stats.total_operations.toLocaleString(), sub: 'all time' },
            { label: 'Total AI Cost', value: `$${stats.total_cost_usd.toFixed(4)}`, sub: 'estimated' },
            { label: 'Avg Confidence', value: `${(stats.avg_confidence * 100).toFixed(0)}%`, sub: 'classification' },
            { label: 'Avg Latency', value: `${stats.avg_latency_ms}ms`, sub: 'per operation' },
            { label: 'Success Rate', value: `${stats.success_rate}%`, sub: 'all operations' },
          ].map(({ label, value, sub }) => (
            <div key={label} className="rounded-2xl border p-4" style={{ background: '#fff', borderColor: '#E2E8F0', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
              <p className="text-xs uppercase tracking-wide font-semibold" style={{ color:'#94A3B8' }}>{label}</p>
              <p className="text-2xl font-bold mt-1" style={{ color: '#0F172A' }}>{value}</p>
              <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>{sub}</p>
            </div>
          ))}
        </div>

        {/* Provider Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border p-6" style={{ background: '#fff', borderColor: '#E2E8F0', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
            <h2 className="text-base font-semibold mb-4" style={{ color: '#0F172A' }}>Provider Usage</h2>
            {Object.keys(PROVIDER_COLORS).map(p => {
              const count = stats.provider_breakdown[p] || 0
              const total = Object.values(stats.provider_breakdown).reduce((a, b) => a + b, 0) || 1
              const pct = ((count / total) * 100).toFixed(0)
              return (
                <div key={p} className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium capitalize" style={{ color: '#0F172A' }}>{p}</span>
                    <span style={{ color: '#475569' }}>{count} ops · {pct}%</span>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: '#F1F5F9' }}>
                    <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: PROVIDER_COLORS[p] }} />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="rounded-2xl border p-6" style={{ background: '#fff', borderColor: '#E2E8F0', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
            <h2 className="text-base font-semibold mb-4" style={{ color: '#0F172A' }}>Operations by Type</h2>
            {Object.entries(stats.operations_by_type).map(([op, count]) => (
              <div key={op} className="flex justify-between py-2 border-b text-sm" style={{ borderColor: '#F1F5F9' }}>
                <span style={{ color: '#475569' }}>{op.replace(/_/g, ' ')}</span>
                <span className="font-medium" style={{ color: '#0F172A' }}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* QR Demo Mode */}
        <div className='rounded-2xl border p-6' style={{ background: '#fff', borderColor: '#E2E8F0', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 className='text-base font-semibold' style={{ color: '#0F172A' }}>QR Demo Mode</h2>
              <p className='text-sm mt-1' style={{ color: '#475569' }}>Activate a 30-minute guest session for live presentations</p>
            </div>
            <form method='post' action='/workspace_admin/demo/activate'>
              <input type='hidden' name='authenticity_token' value={document.querySelector('meta[name=csrf-token]')?.getAttribute('content') ?? ''} />
              <button type='submit'
                style={{ background: '#028090', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IconBolt size={16} color="#fff" />
                Activate Demo Mode
              </button>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
