import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface KPI {
  open_tickets: number
  sla_compliance: number
  avg_resolution_hours: number
  critical_unassigned: number
}

interface HeatmapCell {
  dow: number
  hour: number
  count: number
}

interface Agent {
  id: number
  name: string
  open: number
  resolved: number
  sla_met_pct: number
  avg_time_hrs: number
}

interface ManagerMetrics {
  kpis: KPI
  ticket_volume_30d: { date: string; count: number }[]
  tickets_by_category: { category: string; count: number }[]
  heatmap: HeatmapCell[]
  agent_performance: Agent[]
}

interface Props { metrics: ManagerMetrics }

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function heatColor(count: number, max: number): string {
  if (count === 0) return '#F8FAFC'
  const ratio = count / max
  if (ratio > 0.75) return '#EF4444'
  if (ratio > 0.5)  return '#026E7A'
  if (ratio > 0.25) return '#028090'
  return '#B2E0E5'
}

export default function ManagerDashboard({ metrics }: Props) {
  const maxHeat = Math.max(...metrics.heatmap.map(c => c.count), 1)

  return (
    <div style={{ maxWidth: '1100px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0F172A', margin: '0 0 4px' }}>Team Dashboard</h1>
        <p style={{ color: '#475569', fontSize: '14px', margin: 0 }}>
          Operations · Week of {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <KpiCard label="Open Tickets"       value={metrics.kpis.open_tickets}          color="#028090" />
        <KpiCard label="SLA Compliance"     value={`${metrics.kpis.sla_compliance}%`}  color={metrics.kpis.sla_compliance >= 90 ? '#16A34A' : '#F97316'} />
        <KpiCard label="Avg Resolution"     value={`${metrics.kpis.avg_resolution_hours}h`} color="#028090" />
        <KpiCard label="Critical Unassigned" value={metrics.kpis.critical_unassigned}  color={metrics.kpis.critical_unassigned > 0 ? '#EF4444' : '#16A34A'} />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '55% 1fr', gap: '20px', marginBottom: '24px' }}>
        <div style={card}>
          <h2 style={cardTitle}>Ticket Volume — Last 30 Days</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={metrics.ticket_volume_30d}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} interval={6} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} />
              <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '13px' }} />
              <Line type="monotone" dataKey="count" stroke="#028090" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={card}>
          <h2 style={cardTitle}>By Category</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={metrics.tickets_by_category} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94A3B8' }} />
              <YAxis type="category" dataKey="category" tick={{ fontSize: 11, fill: '#94A3B8' }} width={70} />
              <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '13px' }} />
              <Bar dataKey="count" fill="#028090" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Heatmap */}
      <div style={{ ...card, marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={cardTitle}>Operational Load — Last 7 Days</h2>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {[['#F8FAFC', 'None'], ['#B2E0E5', 'Low'], ['#028090', 'High'], ['#EF4444', 'Critical']].map(([bg, label]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: bg, border: '1px solid #E2E8F0' }} />
                <span style={{ fontSize: '11px', color: '#94A3B8' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '32px repeat(7, 1fr)', gap: '2px' }}>
          <div />
          {DAYS.map(d => (
            <div key={d} style={{ fontSize: '11px', color: '#94A3B8', textAlign: 'center', paddingBottom: '4px', fontWeight: 600 }}>{d}</div>
          ))}
          {Array.from({ length: 24 }, (_, hour) => (
            <>
              <div key={`h${hour}`} style={{ fontSize: '10px', color: '#CBD5E1', textAlign: 'right', paddingRight: '4px', lineHeight: '14px' }}>
                {hour === 0 ? '12a' : hour < 12 ? `${hour}a` : hour === 12 ? '12p' : `${hour - 12}p`}
              </div>
              {DAYS.map((_, dow) => {
                const cell = metrics.heatmap.find(c => c.dow === dow && c.hour === hour)
                const count = cell?.count ?? 0
                return (
                  <div key={`${dow}-${hour}`} title={`${DAYS[dow]} ${hour}:00 — ${count} tickets`}
                    style={{ height: '14px', borderRadius: '2px', background: heatColor(count, maxHeat) }} />
                )
              })}
            </>
          ))}
        </div>
      </div>

      {/* Agent Performance */}
      <div style={card}>
        <h2 style={{ ...cardTitle, marginBottom: '16px' }}>Agent Performance</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Agent', 'Open', 'Resolved', 'SLA Met %', 'Avg Time'].map(h => (
                <th key={h} style={{ textAlign: 'left', fontSize: '12px', color: '#94A3B8', fontWeight: 600, padding: '8px 12px', borderBottom: '1px solid #F1F5F9', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.agent_performance.slice(0, 5).map(agent => (
              <tr key={agent.id} style={{ borderBottom: '1px solid #F8FAFC' }}>
                <td style={{ padding: '12px', fontSize: '14px', color: '#0F172A', fontWeight: 500 }}>{agent.name}</td>
                <td style={{ padding: '12px', fontSize: '14px', color: '#0F172A' }}>{agent.open}</td>
                <td style={{ padding: '12px', fontSize: '14px', color: '#0F172A' }}>{agent.resolved}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: agent.sla_met_pct >= 90 ? '#16A34A' : agent.sla_met_pct >= 75 ? '#F97316' : '#EF4444' }}>
                    {agent.sla_met_pct}%
                  </span>
                </td>
                <td style={{ padding: '12px', fontSize: '14px', color: '#0F172A' }}>{agent.avg_time_hrs}h</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function KpiCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={card}>
      <p style={{ fontSize: '12px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px', fontWeight: 600 }}>{label}</p>
      <p style={{ fontSize: '28px', fontWeight: '700', color, margin: 0 }}>{value}</p>
    </div>
  )
}

const card: React.CSSProperties = {
  background: '#fff', borderRadius: '16px', padding: '20px',
  border: '1px solid #E2E8F0', boxShadow: '0 4px 24px rgba(0,0,0,0.08)'
}
const cardTitle: React.CSSProperties = {
  fontSize: '15px', fontWeight: '700', color: '#0F172A', margin: '0 0 4px'
}
