import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import ErrorBoundary from '@/components/ErrorBoundary'
interface ExecutiveMetrics {
  kpis: {
    total_tickets_week: number
    sla_compliance: number
    avg_resolution_hours: number
    ai_operations_cost: number
  }
  ticket_volume_30d: { date: string; count: number }[]
  tickets_by_department: { department: string; count: number }[]
  latest_ai_report: { generated_at: string; content: string } | null
}

interface Props { metrics: ExecutiveMetrics }

const DEPT_COLORS = ['#028090', '#0EA5E9', '#F97316', '#6B7280', '#8B5CF6']

export default function ExecutiveDashboard({ metrics }: Props) {
  const totalTickets = metrics.tickets_by_department.reduce((s, d) => s + d.count, 0)

  const pieData = metrics.tickets_by_department.map(d => ({
    name: d.department,
    value: d.count,
    pct: totalTickets > 0 ? ((d.count / totalTickets) * 100).toFixed(0) : '0'
  }))

  return (
    <ErrorBoundary section="Executive Dashboard">
    <div style={{ maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0F172A', margin: '0 0 4px' }}>Dashboard</h1>
          <p style={{ color: '#475569', fontSize: '14px', margin: 0 }}>
            Week of {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#fff', fontSize: '13px', color: '#475569', cursor: 'pointer', fontWeight: 500 }}>
            <CalendarIcon /> Last 30 days
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#fff', fontSize: '13px', color: '#475569', cursor: 'pointer', fontWeight: 500 }}>
            <DownloadIcon /> Export
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <KpiCard label="Total Tickets This Week" value={metrics.kpis.total_tickets_week} suffix="this week" trend="+12%" trendUp icon={<TicketsIcon />} />
        <KpiCard label="SLA Compliance"          value={`${metrics.kpis.sla_compliance}%`} suffix="this week" trend="+3%"  trendUp icon={<ShieldIcon />} />
        <KpiCard label="Avg Resolution Time"     value={`${metrics.kpis.avg_resolution_hours}h`} suffix="avg this week" trend="-18%" trendUp={false} trendGood icon={<ClockIcon />} />
        <KpiCard label="AI Operations Cost"      value={`$${metrics.kpis.ai_operations_cost.toFixed(2)}`} suffix="this week" trend="-8%" trendUp={false} trendGood icon={<GearIcon />} />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '60% 1fr', gap: '20px', marginBottom: '24px' }}>
        <div style={card}>
          <h2 style={cardTitle}>Ticket Volume — Last 30 Days</h2>
          <p style={{ fontSize: '12px', color: '#94A3B8', margin: '0 0 16px' }}>Daily ticket intake by department</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={metrics.ticket_volume_30d}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} interval={6} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} />
              <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '13px' }} />
              <Line type="monotone" dataKey="count" stroke="#028090" strokeWidth={2} dot={false} name="Total" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={card}>
          <h2 style={cardTitle}>Tickets by Department</h2>
          <p style={{ fontSize: '12px', color: '#94A3B8', margin: '0 0 12px' }}>
            Distribution this week · {totalTickets} total
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <ResponsiveContainer width={130} height={130}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={38} outerRadius={58} dataKey="value" startAngle={90} endAngle={-270}>
                  {pieData.map((_, i) => <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1 }}>
              {pieData.map((d, i) => (
                <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: DEPT_COLORS[i % DEPT_COLORS.length] }} />
                    <span style={{ fontSize: '12px', color: '#475569' }}>{d.name}</span>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A' }}>{d.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI Executive Report */}
      <div style={{ ...card, marginBottom: '0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#028090', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AiIcon />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0F172A', margin: 0 }}>
                AI Executive Report — {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </h2>
              <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>Generated automatically by GPT-4o every Monday at 7:00 AM</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '8px', background: '#F0FDFA', color: '#028090', fontSize: '12px', fontWeight: 600 }}>
              <AiIcon size={12} /> Generated by GPT-4o
            </span>
            <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '8px', background: '#028090', color: '#fff', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
              <DocIcon /> View Full Report
            </button>
          </div>
        </div>

        {metrics.latest_ai_report ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '20px' }}>
            <ReportSection icon="📋" title="Weekly Summary"   content={extractSection(metrics.latest_ai_report.content, 'summary')} />
            <ReportSection icon="📈" title="Key Trends"       content={extractSection(metrics.latest_ai_report.content, 'trends')} />
            <ReportSection icon="⚠️" title="Critical Alerts"  content={extractSection(metrics.latest_ai_report.content, 'alerts')} alertStyle />
            <ReportSection icon="💡" title="Recommendations"  content={extractSection(metrics.latest_ai_report.content, 'recommendations')} />
          </div>
        ) : (
          <div style={{ marginTop: '20px', padding: '32px', textAlign: 'center', background: '#F8FAFC', borderRadius: '12px' }}>
            <p style={{ color: '#94A3B8', fontSize: '14px', margin: 0 }}>No AI report generated yet. Reports are created every Monday at 7:00 AM.</p>
          </div>
        )}
      </div>
    </div>
    </ErrorBoundary>
  )
}

function extractSection(content: string, section: string): string {
  const lines = content.split('\n')
  const idx = lines.findIndex(l => l.toLowerCase().includes(section))
  if (idx === -1) return content.slice(0, 300)
  return lines.slice(idx + 1, idx + 5).join(' ').slice(0, 400)
}

function ReportSection({ icon, title, content, alertStyle }: { icon: string; title: string; content: string; alertStyle?: boolean }) {
  return (
    <div style={{ padding: '16px', borderRadius: '12px', background: alertStyle ? '#FEF9F0' : '#F8FAFC', border: `1px solid ${alertStyle ? '#FED7AA' : '#E2E8F0'}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <span style={{ fontSize: '16px' }}>{icon}</span>
        <h3 style={{ fontSize: '14px', fontWeight: '700', color: alertStyle ? '#C2410C' : '#0F172A', margin: 0 }}>{title}</h3>
      </div>
      <p style={{ fontSize: '13px', color: '#475569', margin: 0, lineHeight: '1.6' }}>{content || 'No data available for this section.'}</p>
    </div>
  )
}

function KpiCard({ label, value, suffix, trend, trendUp, trendGood, icon }: {
  label: string; value: string | number; suffix: string
  trend: string; trendUp: boolean; trendGood?: boolean; icon: React.ReactNode
}) {
  const trendColor = trendGood !== undefined ? (trendGood ? '#16A34A' : '#EF4444') : (trendUp ? '#16A34A' : '#EF4444')
  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <p style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, fontWeight: 600 }}>{label}</p>
        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F0FDFA', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#028090' }}>{icon}</div>
      </div>
      <p style={{ fontSize: '28px', fontWeight: '700', color: '#0F172A', margin: '0 0 4px' }}>{value}</p>
      <p style={{ fontSize: '12px', color: '#94A3B8', margin: '0 0 6px' }}>{suffix}</p>
      <span style={{ fontSize: '12px', fontWeight: 600, color: trendColor }}>{trendUp ? '▲' : '▼'} {trend} vs last week</span>
    </div>
  )
}

const card: React.CSSProperties = { background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }
const cardTitle: React.CSSProperties = { fontSize: '15px', fontWeight: '700', color: '#0F172A', margin: 0 }

function TicketsIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3H8L2 7h20l-6-4z"/></svg> }
function ShieldIcon()  { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> }
function ClockIcon()   { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> }
function GearIcon()    { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93A10 10 0 0 0 4.93 19.07M19.07 19.07A10 10 0 0 0 4.93 4.93"/></svg> }
function AiIcon({ size = 16 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> }
function DocIcon()     { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> }
function CalendarIcon(){ return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> }
function DownloadIcon(){ return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> }
