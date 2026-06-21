import { useState, useEffect, useRef } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
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

function slaColor(pct: number): string {
  if (pct >= 90) return '#16A34A'
  if (pct >= 75) return '#F97316'
  return '#EF4444'
}

// ── Animated counter ──────────────────────────────────────────────────────────
function AnimatedNumber({ value, color, prefix = '', suffix = '', decimals = 0 }: {
  value: number; color: string; prefix?: string; suffix?: string; decimals?: number
}) {
  const motionVal = useMotionValue(0)
  const ref       = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const controls = animate(motionVal, value, { duration: 0.9, ease: 'easeOut' })
    return controls.stop
  }, [value, motionVal])

  useEffect(() => {
    return motionVal.on('change', (v) => {
      if (ref.current) ref.current.textContent = `${prefix}${v.toFixed(decimals)}${suffix}`
    })
  }, [motionVal, prefix, suffix, decimals])

  return (
    <p ref={ref} style={{ fontSize: '24px', fontWeight: 700, color, margin: 0 }}>
      {prefix}0{suffix}
    </p>
  )
}

export default function ExecutiveDashboard({ metrics }: Props) {
  const [expandedSection, setExpandedSection] = useState<string | null>('executive summary')
  const totalTickets = metrics.tickets_by_department.reduce((sum, dept) => sum + dept.count, 0)
  const pieData      = metrics.tickets_by_department.map((dept) => ({
    name:  dept.department,
    value: dept.count,
    pct:   totalTickets > 0 ? ((dept.count / totalTickets) * 100).toFixed(0) : '0'
  }))

  const report       = metrics.latest_ai_report
  const sections     = report ? parseSections(report.content) : {}
  const riskScore    = report?.metrics?.risk_score ?? 0
  const trendData    = report?.trend_data ?? []
  const bottlenecks  = report?.metrics?.top_bottlenecks ?? []

  const REPORT_SECTIONS = [
    { key: 'executive summary',                    icon: <ClipboardIcon />, label: 'Executive Summary',          alert: false },
    { key: 'trend analysis (last 4 weeks)',         icon: <TrendIcon />,    label: 'Trend Analysis (4 Weeks)',    alert: false },
    { key: 'top 3 bottlenecks & estimated cost',    icon: <FlameIcon />,    label: 'Top Bottlenecks & Cost',      alert: true },
    { key: 'next week risk forecast',               icon: <RadarIcon2 />,  label: 'Next Week Risk Forecast',     alert: false },
  ]

  return (
    <ErrorBoundary section="Executive Dashboard">
      <div style={{ maxWidth: '1200px' }}>

        {/* ── Dark hero header ── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{
            background: '#0D1B2A', borderRadius: '16px', padding: '28px 32px',
            marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}
        >
          <div>
            <p style={{ fontSize: '11px', color: '#02C39A', letterSpacing: '0.12em', fontWeight: 700, margin: '0 0 6px', textTransform: 'uppercase' }}>
              Executive Overview · Week of {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.4px' }}>
              Workspace Intelligence
            </h1>
            <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0 }}>
              {riskScore > 0 ? (
                <>Risk score <span style={{ color: riskColor(riskScore), fontWeight: 600 }}>{riskScore}/100</span> · {riskLabel(riskScore)} this week</>
              ) : (
                <>SLA compliance at <span style={{ color: slaColor(metrics.kpis.sla_compliance), fontWeight: 600 }}>{metrics.kpis.sla_compliance}%</span> this week</>
              )}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              style={{ background: 'rgba(2,128,144,0.15)', border: '1px solid rgba(2,195,154,0.3)', borderRadius: '12px', padding: '12px 20px', textAlign: 'center', minWidth: '76px' }}
            >
              <p style={{ fontSize: '24px', fontWeight: 700, color: '#02C39A', margin: 0, lineHeight: 1 }}>{metrics.kpis.total_tickets_week}</p>
              <p style={{ fontSize: '10px', color: '#64748B', margin: '5px 0 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tickets</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.28, duration: 0.3 }}
              style={{
                background: metrics.kpis.sla_compliance >= 90 ? 'rgba(22,163,74,0.12)' : 'rgba(249,115,22,0.12)',
                border: `1px solid ${metrics.kpis.sla_compliance >= 90 ? 'rgba(22,163,74,0.3)' : 'rgba(249,115,22,0.25)'}`,
                borderRadius: '12px', padding: '12px 20px', textAlign: 'center', minWidth: '76px',
              }}
            >
              <p style={{ fontSize: '24px', fontWeight: 700, color: slaColor(metrics.kpis.sla_compliance), margin: 0, lineHeight: 1 }}>{metrics.kpis.sla_compliance}%</p>
              <p style={{ fontSize: '10px', color: '#64748B', margin: '5px 0 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>SLA</p>
            </motion.div>
          </div>
        </motion.div>

        {/* ── KPI row ── */}
        <motion.div
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
          initial="hidden"
          animate="show"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '20px' }}
        >
          {[
            { label: 'Total Tickets',   value: metrics.kpis.total_tickets_week, color: '#028090', icon: <TicketsIcon />, prefix: '', suffix: '', decimals: 0 },
            { label: 'SLA Compliance',  value: metrics.kpis.sla_compliance,     color: slaColor(metrics.kpis.sla_compliance), icon: <ShieldIcon />, prefix: '', suffix: '%', decimals: 1 },
            { label: 'Avg Resolution',  value: metrics.kpis.avg_resolution_hours, color: '#028090', icon: <ClockIcon />, prefix: '', suffix: 'h', decimals: 1 },
            { label: 'AI Ops Cost',     value: metrics.kpis.ai_operations_cost, color: '#6B7280', icon: <GearIcon />, prefix: '$', suffix: '', decimals: 2 },
          ].map((kpi) => (
            <motion.div key={kpi.label} variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } } }}>
              <div style={{ ...card, borderTop: `3px solid ${kpi.color}`, padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <p style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>{kpi.label}</p>
                  <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: '#F0FDFA', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#028090', flexShrink: 0 }}>{kpi.icon}</div>
                </div>
                <AnimatedNumber value={kpi.value} color={kpi.color} prefix={kpi.prefix} suffix={kpi.suffix} decimals={kpi.decimals} />
              </div>
            </motion.div>
          ))}
          <motion.div variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } } }}>
            <div style={{ ...card, borderTop: '3px solid #F97316', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <p style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>At-Risk Tickets</p>
                <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F97316', flexShrink: 0 }}><WarningIcon /></div>
              </div>
              {report?.metrics?.at_risk_tickets != null ? (
                <AnimatedNumber value={report.metrics.at_risk_tickets} color="#F97316" />
              ) : (
                <p style={{ fontSize: '24px', fontWeight: 700, color: '#CBD5E1', margin: 0 }}>—</p>
              )}
            </div>
          </motion.div>
          <motion.div variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } } }}>
            <div style={{ ...card, borderTop: `3px solid ${riskScore > 0 ? riskColor(riskScore) : '#CBD5E1'}`, padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <p style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Workspace Risk</p>
                <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: '#F0FDFA', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#028090', flexShrink: 0 }}><RadarIcon /></div>
              </div>
              {riskScore > 0 ? (
                <AnimatedNumber value={riskScore} color={riskColor(riskScore)} suffix="/100" />
              ) : (
                <p style={{ fontSize: '24px', fontWeight: 700, color: '#CBD5E1', margin: 0 }}>—</p>
              )}
            </div>
          </motion.div>
        </motion.div>

        {/* Risk score bar */}
        {riskScore > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.35 }}>
            <div style={{ ...card, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '20px', borderTop: `3px solid ${riskColor(riskScore)}` }}>
              <div>
                <p style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>Workspace Risk Score</p>
                <p style={{ fontSize: '26px', fontWeight: 700, color: riskColor(riskScore), margin: 0 }}>{riskScore}/100</p>
                <p style={{ fontSize: '11px', fontWeight: 600, color: riskColor(riskScore), margin: '4px 0 0' }}>{riskLabel(riskScore)}</p>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ height: '10px', borderRadius: '6px', background: '#F1F5F9', overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${riskScore}%` }}
                    transition={{ duration: 1.1, type: 'spring', stiffness: 60, damping: 14, delay: 0.3 }}
                    style={{ height: '100%', background: `linear-gradient(90deg, ${riskColor(riskScore)}, ${riskColor(riskScore)}CC)`, borderRadius: '6px' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                  <span style={{ fontSize: '11px', color: '#94A3B8' }}>0 — Low</span>
                  <span style={{ fontSize: '11px', color: '#94A3B8' }}>40 — Medium</span>
                  <span style={{ fontSize: '11px', color: '#94A3B8' }}>70+ — High</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px', marginBottom: '14px' }}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36, duration: 0.35 }}>
            <div style={{ ...card, borderTop: '3px solid #028090' }}>
              <h2 style={cardTitle}>Ticket Volume — Last 30 Days</h2>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={metrics.ticket_volume_30d}>
                  <defs>
                    <linearGradient id="execVolumeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#028090" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="#028090" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} interval={6} axisLine={{ stroke: '#E2E8F0' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '13px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }} labelStyle={{ color: '#0F172A', fontWeight: 600 }} />
                  <Area type="monotone" dataKey="count" stroke="#028090" strokeWidth={2.5} fill="url(#execVolumeGradient)" dot={false} activeDot={{ r: 5, fill: '#028090', stroke: '#fff', strokeWidth: 2 }} animationDuration={900} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.35 }}>
            <div style={{ ...card, borderTop: '3px solid #028090' }}>
              <h2 style={cardTitle}>Tickets by Department</h2>
              <p style={{ fontSize: '12px', color: '#94A3B8', margin: '0 0 12px' }}>{totalTickets} total this week</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <ResponsiveContainer width={130} height={130}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={38} outerRadius={58} dataKey="value" startAngle={90} endAngle={-270} animationDuration={900}>
                      {pieData.map((_, idx) => <Cell key={idx} fill={DEPT_COLORS[idx % DEPT_COLORS.length]} stroke="#fff" strokeWidth={2} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '13px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex: 1 }}>
                  {pieData.map((dept, idx) => (
                    <div key={dept.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: DEPT_COLORS[idx % DEPT_COLORS.length] }} />
                        <span style={{ fontSize: '12px', color: '#475569' }}>{dept.name}</span>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>{dept.pct}% <span style={{ color: '#94A3B8', fontWeight: 400 }}>({pieData.find(d => d.name === dept.name)?.value})</span></span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 4-week trend table */}
        {trendData.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.44, duration: 0.35 }}>
            <div style={{ ...card, marginBottom: '14px', borderTop: '3px solid #028090' }}>
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
                    {trendData.map((week, i) => (
                      <motion.tr key={week.week_label} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.48 + i * 0.06 }} style={{ borderBottom: '1px solid #F8FAFC' }}>
                        <td style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>{week.week_label}</td>
                        <td style={{ padding: '10px 12px', fontSize: '13px', color: '#475569' }}>{week.total_tickets}</td>
                        <td style={{ padding: '10px 12px', fontSize: '13px', color: '#475569' }}>{week.resolved_tickets}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: slaColor(week.sla_compliance_pct) }}>{week.sla_compliance_pct}%</span>
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: '13px', color: week.sla_breaches > 0 ? '#EF4444' : '#475569', fontWeight: week.sla_breaches > 0 ? 600 : 400 }}>{week.sla_breaches}</td>
                        <td style={{ padding: '10px 12px', fontSize: '13px', color: '#475569' }}>{week.avg_resolution_hrs}h</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Top bottlenecks */}
        {bottlenecks.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.35 }}>
            <div style={{ ...card, marginBottom: '14px', borderTop: '3px solid #F97316' }}>
              <h2 style={{ ...cardTitle, marginBottom: '4px' }}>Top Bottlenecks</h2>
              <p style={{ fontSize: '12px', color: '#94A3B8', margin: '0 0 16px' }}>Departments with highest unproductive person-hours</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                {bottlenecks.map((dept, idx) => (
                  <motion.div key={dept.department} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.54 + idx * 0.07 }} style={{ padding: '16px', borderRadius: '12px', background: '#FFF7ED', border: '1px solid #FED7AA' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <span style={{ fontSize: '16px', fontWeight: 700, color: '#C2410C' }}>#{idx + 1}</span>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>{dept.department}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <Stat label="Open" value={String(dept.open_tickets)} />
                      <Stat label="Breaches" value={String(dept.sla_breaches)} danger={dept.sla_breaches > 0} />
                      <Stat label="Avg Hrs" value={`${dept.avg_resolution_hrs}h`} />
                      <Stat label="Cost Hrs" value={`${dept.estimated_cost_hours}h`} danger />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* AI Executive Report */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.58, duration: 0.35 }}>
          <div style={{ ...card, borderTop: '3px solid #028090' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#028090', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <SparkleIcon />
              </div>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', margin: 0 }}>AI Intelligence Briefing v2</h2>
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
                        <span style={{ color: sec.alert ? '#C2410C' : '#028090', display: 'flex', alignItems: 'center' }}>{sec.icon}</span>
                        <span style={{ flex: 1, fontSize: '14px', fontWeight: 600, color: sec.alert ? '#C2410C' : '#0F172A' }}>{sec.label}</span>
                        <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ display: 'flex', color: '#94A3B8' }}>
                          <ChevronDownIcon />
                        </motion.span>
                      </button>
                      {isOpen && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.25 }} style={{ padding: '16px', background: '#fff', borderTop: `1px solid ${sec.alert ? '#FED7AA' : '#E2E8F0'}` }}>
                          <p style={{ fontSize: '13px', color: '#475569', margin: 0, lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                            {content || 'No content available for this section.'}
                          </p>
                        </motion.div>
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
        </motion.div>

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

const card: React.CSSProperties      = { background: '#fff', borderRadius: '14px', padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.05)' }
const cardTitle: React.CSSProperties = { fontSize: '14px', fontWeight: 700, color: '#0F172A', margin: 0, letterSpacing: '-0.1px' }

function TicketsIcon()    { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3H8L2 7h20l-6-4z"/></svg> }
function ShieldIcon()     { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> }
function ClockIcon()      { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> }
function GearIcon()       { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93A10 10 0 0 0 4.93 19.07M19.07 19.07A10 10 0 0 0 4.93 4.93"/></svg> }
function WarningIcon()    { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> }
function RadarIcon()      { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="2"/><path d="M12 2a10 10 0 0 1 10 10"/><path d="M12 6a6 6 0 0 1 6 6"/></svg> }
function SparkleIcon()    { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> }
function ClipboardIcon()  { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><line x1="8" y1="11" x2="16" y2="11"/><line x1="8" y1="15" x2="14" y2="15"/></svg> }
function TrendIcon()      { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg> }
function FlameIcon()      { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/></svg> }
function RadarIcon2()     { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/><line x1="12" y1="2" x2="12" y2="4"/></svg> }
function ChevronDownIcon(){ return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg> }