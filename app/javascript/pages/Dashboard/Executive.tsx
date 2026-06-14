import { useState } from 'react'
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import ErrorBoundary from '@/components/ErrorBoundary'

interface TrendWeek {
  week_label: string
  total_tickets: number
  resolved_tickets: number
  sla_compliance_pct: number
  sla_breaches: number
  avg_resolution_hrs: number
}

interface Bottleneck {
  department: string
  open_tickets: number
  avg_resolution_hrs: number
  sla_breaches: number
  estimated_cost_hours: number
}

interface ExecutiveMetrics {
  kpis: {
    total_tickets_week: number
    sla_compliance: number
    avg_resolution_hours: number
    ai_operations_cost: number
  }
  ticket_volume_30d: { date: string; count: number }[]
  tickets_by_department: { department: string; count: number }[]
  latest_ai_report: {
    generated_at: string
    content: string
    metrics?: {
      risk_score?: number
      at_risk_tickets?: number
      anomaly_alerts?: number
      top_bottlenecks?: Bottleneck[]
    }
    trend_data?: TrendWeek[]
  } | null
}

interface Props { metrics: ExecutiveMetrics }

const DEPT_COLORS = ['#028090', '#0EA5E9', '#F97316', '#6B7280', '#8B5CF6']

// Parse ## Section headers from GPT-4o v2 report
function parseSections(content: string): Record<string, string> {
  const sections: Record<string, string> = {}
  const parts = content.split(/^##\s+/m)
  parts.forEach((part) => {
    const lines   = part.trim().split('\n')
    const heading = lines[0]?.trim().toLowerCase() ?? ''
    const body    = lines.slice(1).join('\n').trim()
    if (heading) sections[heading] = body
  })
  return sections
}

function riskColor(score: number): string {
  if (score >= 70) return '#EF4444'
  if (score >= 40) return '#F97316'
  return '#16A34A'
}

function riskLabel(score: number): string {
  if (score >= 70) return 'High Risk'
  if (score >= 40) return 'Medium Risk'
  return 'Low Risk'
}

export default function ExecutiveDashboard({ metrics }: Props) {
  const [expandedSection, setExpandedSection] = useState<string | null>('executive summary')
  const totalTickets = metrics.tickets_by_department.reduce((sum, dept) => sum + dept.count, 0)
  const pieData      = metrics.tickets_by_department.map((dept) => ({
    name:  dept.department,
    value: dept.count,
    pct:   totalTickets > 0 ? ((dept.count / totalTickets) * 100).toFixed(0) : '0'
  }))

  const report    = metrics.latest_ai_report
  const sections  = report ? parseSections(report.content) : {}
  const riskScore = report?.metrics?.risk_score ?? 0
  const trendData = report?.trend_data ?? []
  const bottlenecks = report?.metrics?.top_bottlenecks ?? []

  const REPORT_SECTIONS = [
    { key: 'executive summary',          icon: '📋', label: 'Executive Summary',          alert: false },
    { key: 'trend analysis (last 4 weeks)', icon: '📈', label: 'Trend Analysis (4 Weeks)', alert: false },
    { key: 'top 3 bottlenecks & estimated cost', icon: '🔴', label: 'Top Bottlenecks & Cost', alert: true },
    { key: 'next week risk forecast',    icon: '🔮', label: 'Next Week Risk Forecast',     alert: false },
  ]

  return (
    <ErrorBoundary section="Executive Dashboard">
      <div style={{ maxWidth: '1200px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0F172A', margin: '0 0 4px' }}>Executive Dashboard</h1>
            <p style={{ color: '#475569', fontSize: '14px', margin: 0 }}>
              Week of {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button style={btnSecondary}><CalendarIcon /> Last 30 days</button>
            <button style={btnSecondary}><DownloadIcon /> Export</button>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <KpiCard label="Total Tickets"     value={metrics.kpis.total_tickets_week}               color="#028090" icon={<TicketsIcon />} />
          <KpiCard label="SLA Compliance"    value={`${metrics.kpis.sla_compliance}%`}             color={metrics.kpis.sla_compliance >= 90 ? '#16A34A' : '#F97316'} icon={<ShieldIcon />} />
          <KpiCard label="Avg Resolution"    value={`${metrics.kpis.avg_resolution_hours}h`}       color="#028090" icon={<ClockIcon />} />
          <KpiCard label="AI Ops Cost"       value={`$${metrics.kpis.ai_operations_cost.toFixed(2)}`} color="#6B7280" icon={<GearIcon />} />
          <KpiCard label="At-Risk Tickets"   value={report?.metrics?.at_risk_tickets ?? '—'}       color="#F97316" icon={<WarningIcon />} />
          <KpiCard label="Workspace Risk"    value={riskScore > 0 ? `${riskScore}/100` : '—'}      color={riskColor(riskScore)} icon={<RadarIcon />} />
        </div>

        {/* Risk score bar */}
        {riskScore > 0 && (
          <div style={{ ...card, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div>
              <p style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>Workspace Risk Score</p>
              <p style={{ fontSize: '28px', fontWeight: 700, color: riskColor(riskScore), margin: 0 }}>{riskScore}/100</p>
              <p style={{ fontSize: '12px', fontWeight: 600, color: riskColor(riskScore), margin: '4px 0 0' }}>{riskLabel(riskScore)}</p>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ height: '12px', borderRadius: '6px', background: '#F1F5F9', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${riskScore}%`, background: riskColor(riskScore), borderRadius: '6px', transition: 'width 0.6s ease' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                <span style={{ fontSize: '11px', color: '#94A3B8' }}>0 — Low</span>
                <span style={{ fontSize: '11px', color: '#94A3B8' }}>40 — Medium</span>
                <span style={{ fontSize: '11px', color: '#94A3B8' }}>70+ — High</span>
              </div>
            </div>
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
            <h2 style={cardTitle}>Tickets by Department</h2>
            <p style={{ fontSize: '12px', color: '#94A3B8', margin: '0 0 12px' }}>{totalTickets} total this week</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <ResponsiveContainer width={130} height={130}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={38} outerRadius={58} dataKey="value" startAngle={90} endAngle={-270}>
                    {pieData.map((_, idx) => <Cell key={idx} fill={DEPT_COLORS[idx % DEPT_COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1 }}>
                {pieData.map((dept, idx) => (
                  <div key={dept.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: DEPT_COLORS[idx % DEPT_COLORS.length] }} />
                      <span style={{ fontSize: '12px', color: '#475569' }}>{dept.name}</span>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A' }}>{dept.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 4-week trend table */}
        {trendData.length > 0 && (
          <div style={{ ...card, marginBottom: '24px' }}>
            <h2 style={{ ...cardTitle, marginBottom: '16px' }}>4-Week Trend</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
                <thead>
                  <tr>
                    {['Period', 'Tickets', 'Resolved', 'SLA %', 'Breaches', 'Avg Hours'].map((h) => (
                      <th key={h} style={{ textAlign: 'left', fontSize: '11px', color: '#94A3B8', fontWeight: 600, padding: '8px 12px', borderBottom: '1px solid #F1F5F9', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {trendData.map((week) => (
                    <tr key={week.week_label} style={{ borderBottom: '1px solid #F8FAFC' }}>
                      <td style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>{week.week_label}</td>
                      <td style={{ padding: '10px 12px', fontSize: '13px', color: '#475569' }}>{week.total_tickets}</td>
                      <td style={{ padding: '10px 12px', fontSize: '13px', color: '#475569' }}>{week.resolved_tickets}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: week.sla_compliance_pct >= 90 ? '#16A34A' : week.sla_compliance_pct >= 75 ? '#F97316' : '#EF4444' }}>
                          {week.sla_compliance_pct}%
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: '13px', color: week.sla_breaches > 0 ? '#EF4444' : '#475569', fontWeight: week.sla_breaches > 0 ? 600 : 400 }}>{week.sla_breaches}</td>
                      <td style={{ padding: '10px 12px', fontSize: '13px', color: '#475569' }}>{week.avg_resolution_hrs}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Top bottlenecks */}
        {bottlenecks.length > 0 && (
          <div style={{ ...card, marginBottom: '24px' }}>
            <h2 style={{ ...cardTitle, marginBottom: '4px' }}>Top Bottlenecks</h2>
            <p style={{ fontSize: '12px', color: '#94A3B8', margin: '0 0 16px' }}>Departments with highest unproductive person-hours</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
              {bottlenecks.map((dept, idx) => (
                <div key={dept.department} style={{ padding: '16px', borderRadius: '12px', background: '#FFF7ED', border: '1px solid #FED7AA' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '16px', fontWeight: 700, color: '#C2410C' }}>#{idx + 1}</span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>{dept.department}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <Stat label="Open"     value={String(dept.open_tickets)} />
                    <Stat label="Breaches" value={String(dept.sla_breaches)} danger={dept.sla_breaches > 0} />
                    <Stat label="Avg Hrs"  value={`${dept.avg_resolution_hrs}h`} />
                    <Stat label="Cost Hrs" value={`${dept.estimated_cost_hours}h`} danger />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Executive Report — expandable sections */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#028090', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <AiIcon />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0F172A', margin: 0 }}>AI Intelligence Briefing v2</h2>
              <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>
                Generated by GPT-4o · {report ? new Date(report.generated_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Not yet generated'}
              </p>
            </div>
            <span style={{ marginLeft: 'auto', padding: '6px 12px', borderRadius: '8px', background: '#F0FDFA', color: '#028090', fontSize: '12px', fontWeight: 600 }}>
              GPT-4o · Every Monday 7am
            </span>
          </div>

          {report ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {REPORT_SECTIONS.map((sec) => {
                const isOpen  = expandedSection === sec.key
                const content = sections[sec.key] ?? ''
                return (
                  <div key={sec.key} style={{ borderRadius: '12px', border: `1px solid ${sec.alert ? '#FED7AA' : '#E2E8F0'}`, overflow: 'hidden' }}>
                    <button
                      onClick={() => setExpandedSection(isOpen ? null : sec.key)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', background: sec.alert ? '#FFF7ED' : '#F8FAFC', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                      <span style={{ fontSize: '16px' }}>{sec.icon}</span>
                      <span style={{ flex: 1, fontSize: '14px', fontWeight: 600, color: sec.alert ? '#C2410C' : '#0F172A' }}>{sec.label}</span>
                      <span style={{ fontSize: '12px', color: '#94A3B8', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
                    </button>
                    {isOpen && (
                      <div style={{ padding: '16px', background: '#fff', borderTop: `1px solid ${sec.alert ? '#FED7AA' : '#E2E8F0'}` }}>
                        <p style={{ fontSize: '13px', color: '#475569', margin: 0, lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                          {content || 'No content available for this section.'}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ padding: '32px', textAlign: 'center', background: '#F8FAFC', borderRadius: '12px' }}>
              <p style={{ color: '#94A3B8', fontSize: '14px', margin: 0 }}>No AI report generated yet. Reports are created every Monday at 7:00 AM.</p>
            </div>
          )}
        </div>

      </div>
    </ErrorBoundary>
  )
}

function Stat({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div>
      <p style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', margin: '0 0 2px' }}>{label}</p>
      <p style={{ fontSize: '13px', fontWeight: 700, color: danger ? '#EF4444' : '#0F172A', margin: 0 }}>{value}</p>
    </div>
  )
}

function KpiCard({ label, value, color, icon }: { label: string; value: string | number; color: string; icon: React.ReactNode }) {
  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <p style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, fontWeight: 600 }}>{label}</p>
        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F0FDFA', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#028090' }}>{icon}</div>
      </div>
      <p style={{ fontSize: '28px', fontWeight: '700', color, margin: 0 }}>{value}</p>
    </div>
  )
}

const card: React.CSSProperties      = { background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', marginBottom: '0' }
const cardTitle: React.CSSProperties = { fontSize: '15px', fontWeight: '700', color: '#0F172A', margin: 0 }
const btnSecondary: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#fff', fontSize: '13px', color: '#475569', cursor: 'pointer', fontWeight: 500 }

function TicketsIcon()  { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3H8L2 7h20l-6-4z"/></svg> }
function ShieldIcon()   { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> }
function ClockIcon()    { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> }
function GearIcon()     { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93A10 10 0 0 0 4.93 19.07M19.07 19.07A10 10 0 0 0 4.93 4.93"/></svg> }
function WarningIcon()  { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> }
function RadarIcon()    { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="2"/><path d="M12 2a10 10 0 0 1 10 10"/><path d="M12 6a6 6 0 0 1 6 6"/></svg> }
function AiIcon()       { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> }
function CalendarIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> }
function DownloadIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> }