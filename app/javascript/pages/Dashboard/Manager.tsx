import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { router } from '@inertiajs/react'
import ErrorBoundary from '@/components/ErrorBoundary'

interface KPI {
  open_tickets: number
  sla_compliance: number
  avg_resolution_hours: number
  critical_unassigned: number
}
interface HeatmapCell { dow: number; hour: number; count: number }
interface Agent {
  id: number; name: string; open: number; resolved: number
  sla_met_pct: number; avg_time_hrs: number
}
interface AtRiskTicket {
  id: number; ticket_number: string; title: string
  priority: string; status: string; due_at: string | null
  sla_breach_probability: number | null; assigned_to: string | null; department: string | null
}
interface ManagerMetrics {
  kpis: KPI
  ticket_volume_30d: { date: string; count: number }[]
  tickets_by_category: { category: string; count: number }[]
  heatmap: HeatmapCell[]
  agent_performance: Agent[]
  tickets_at_risk: AtRiskTicket[]
  tickets_breached: AtRiskTicket[]
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

function riskColor(prob: number): string {
  if (prob >= 0.90) return '#EF4444'
  if (prob >= 0.80) return '#F97316'
  return '#EAB308'
}

function priorityBadge(priority: string): React.CSSProperties {
  const colors: Record<string, string> = {
    critical: '#FEE2E2', high: '#FEF3C7', medium: '#DBEAFE', low: '#F0FDF4'
  }
  return {
    background: colors[priority] ?? '#F1F5F9',
    color: '#1E293B', fontSize: '11px', fontWeight: 700,
    padding: '2px 8px', borderRadius: '6px', textTransform: 'uppercase' as const
  }
}

export default function ManagerDashboard({ metrics }: Props) {
  const maxHeat = Math.max(...metrics.heatmap.map(c => c.count), 1)

  return (
    <ErrorBoundary section="Manager Dashboard">
      <div style={{ maxWidth: '1100px' }}>

        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0F172A', margin: '0 0 4px' }}>Team Dashboard</h1>
          <p style={{ color: '#475569', fontSize: '14px', margin: 0 }}>
            Operations · Week of {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <KpiCard label="Open Tickets"        value={metrics.kpis.open_tickets}         color="#028090" />
          <KpiCard label="SLA Compliance"      value={`${metrics.kpis.sla_compliance}%`} color={metrics.kpis.sla_compliance >= 90 ? '#16A34A' : '#F97316'} />
          <KpiCard label="Avg Resolution"      value={`${metrics.kpis.avg_resolution_hours}h`} color="#028090" />
          <KpiCard label="Critical Unassigned" value={metrics.kpis.critical_unassigned}  color={metrics.kpis.critical_unassigned > 0 ? '#EF4444' : '#16A34A'} />
          <KpiCard label="At-Risk Tickets"     value={metrics.tickets_at_risk.length}    color={metrics.tickets_at_risk.length > 0 ? '#F97316' : '#16A34A'} />
          <KpiCard label="SLA Breached"        value={metrics.tickets_breached.length}   color={metrics.tickets_breached.length > 0 ? '#EF4444' : '#16A34A'} />
        </div>

        {/* Tickets at Risk */}
        {metrics.tickets_at_risk.length > 0 && (
          <div style={{ ...card, marginBottom: '24px', borderLeft: '4px solid #F97316' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#F97316', animation: 'pulse 2s infinite' }} />
              <h2 style={{ ...cardTitle, margin: 0 }}>Tickets at Risk — Predicted SLA Breach</h2>
              <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#94A3B8' }}>
                AI predicted · P(breach) ≥ 70%
              </span>
            </div>
            <AtRiskTable tickets={metrics.tickets_at_risk} showProbability />
          </div>
        )}

        {/* Tickets Breached */}
        {metrics.tickets_breached.length > 0 && (
          <div style={{ ...card, marginBottom: '24px', borderLeft: '4px solid #EF4444' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#EF4444' }} />
              <h2 style={{ ...cardTitle, margin: 0 }}>SLA Breached</h2>
              <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#EF4444', fontWeight: 600 }}>
                {metrics.tickets_breached.length} ticket{metrics.tickets_breached.length !== 1 ? 's' : ''} past deadline
              </span>
            </div>
            <AtRiskTable tickets={metrics.tickets_breached} showProbability={false} />
          </div>
        )}

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '24px' }}>
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
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse' }}>
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

      </div>
    </ErrorBoundary>
  )
}

function AtRiskTable({ tickets, showProbability }: { tickets: AtRiskTicket[]; showProbability: boolean }) {
  const headers = showProbability
    ? ['Ticket', 'Title', 'Priority', 'Department', 'Assigned To', 'Due At', 'P(Breach)']
    : ['Ticket', 'Title', 'Priority', 'Department', 'Assigned To', 'Breached At']

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {headers.map(h => (
              <th key={h} style={{ textAlign: 'left', fontSize: '12px', color: '#94A3B8', fontWeight: 600, padding: '8px 12px', borderBottom: '1px solid #F1F5F9', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tickets.map(tkt => (
            <tr key={tkt.id} onClick={() => router.visit(`/tickets/${tkt.id}`)}
              style={{ borderBottom: '1px solid #F8FAFC', cursor: 'pointer', transition: 'background 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <td style={{ padding: '12px', fontSize: '13px', color: '#028090', fontWeight: 600 }}>{tkt.ticket_number}</td>
              <td style={{ padding: '12px', fontSize: '13px', color: '#0F172A', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tkt.title}</td>
              <td style={{ padding: '12px' }}><span style={priorityBadge(tkt.priority)}>{tkt.priority}</span></td>
              <td style={{ padding: '12px', fontSize: '13px', color: '#475569' }}>{tkt.department ?? '—'}</td>
              <td style={{ padding: '12px', fontSize: '13px', color: '#475569' }}>{tkt.assigned_to ?? 'Unassigned'}</td>
              <td style={{ padding: '12px', fontSize: '13px', color: '#475569' }}>
                {tkt.due_at ? new Date(tkt.due_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
              </td>
              {showProbability && (
                <td style={{ padding: '12px' }}>
                  {tkt.sla_breach_probability != null ? (
                    <span style={{ fontSize: '13px', fontWeight: 700, color: riskColor(tkt.sla_breach_probability) }}>
                      {(tkt.sla_breach_probability * 100).toFixed(1)}%
                    </span>
                  ) : '—'}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
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