import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts'
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
  return '#7FC7CE'
}

function isCurrentHourCell(dow: number, hour: number): boolean {
  const now = new Date()
  return now.getDay() === dow && now.getHours() === hour
}

function riskColor(prob: number): string {
  if (prob >= 0.90) return '#EF4444'
  if (prob >= 0.80) return '#F97316'
  return '#EAB308'
}

function slaColor(pct: number): string {
  if (pct >= 90) return '#16A34A'
  if (pct >= 75) return '#F97316'
  return '#EF4444'
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

// ── Animated counter ──────────────────────────────────────────────────────────
function AnimatedNumber({ value, color, suffix = '' }: { value: number; color: string; suffix?: string }) {
  const motionVal = useMotionValue(0)
  const rounded   = useTransform(motionVal, (v) => Math.round(v))
  const ref       = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const controls = animate(motionVal, value, { duration: 0.9, ease: 'easeOut' })
    return controls.stop
  }, [value, motionVal])

  useEffect(() => {
    return rounded.on('change', (v) => {
      if (ref.current) ref.current.textContent = `${v}${suffix}`
    })
  }, [rounded, suffix])

  return (
    <p ref={ref} style={{ fontSize: '24px', fontWeight: 700, color, margin: 0 }}>
      0{suffix}
    </p>
  )
}

export default function ManagerDashboard({ metrics }: Props) {
  const maxHeat = Math.max(...metrics.heatmap.map(c => c.count), 1)

  return (
    <ErrorBoundary section="Manager Dashboard">
      <div style={{ maxWidth: '1100px' }}>

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
              Operations · Week of {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.4px' }}>
              Team Dashboard
            </h1>
            <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0 }}>
              {metrics.tickets_breached.length > 0 || metrics.tickets_at_risk.length > 0 ? (
                <>
                  {metrics.tickets_breached.length > 0 && (
                    <span style={{ color: '#EF4444', fontWeight: 600 }}>{metrics.tickets_breached.length} ticket{metrics.tickets_breached.length !== 1 ? 's' : ''} breached SLA</span>
                  )}
                  {metrics.tickets_breached.length > 0 && metrics.tickets_at_risk.length > 0 ? ', ' : ''}
                  {metrics.tickets_at_risk.length > 0 && (
                    <span style={{ color: '#F97316', fontWeight: 600 }}>{metrics.tickets_at_risk.length} at risk</span>
                  )}
                  {' this week.'}
                </>
              ) : "All tickets within SLA. Great work, team!"}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              style={{
                background: metrics.tickets_breached.length > 0 ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${metrics.tickets_breached.length > 0 ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '12px', padding: '12px 20px', textAlign: 'center', minWidth: '76px',
              }}
            >
              <p style={{ fontSize: '24px', fontWeight: 700, color: metrics.tickets_breached.length > 0 ? '#EF4444' : '#475569', margin: 0, lineHeight: 1 }}>
                {metrics.tickets_breached.length}
              </p>
              <p style={{ fontSize: '10px', color: '#64748B', margin: '5px 0 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Breached</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.28, duration: 0.3 }}
              style={{
                background: metrics.tickets_at_risk.length > 0 ? 'rgba(249,115,22,0.12)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${metrics.tickets_at_risk.length > 0 ? 'rgba(249,115,22,0.25)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '12px', padding: '12px 20px', textAlign: 'center', minWidth: '76px',
              }}
            >
              <p style={{ fontSize: '24px', fontWeight: 700, color: metrics.tickets_at_risk.length > 0 ? '#F97316' : '#475569', margin: 0, lineHeight: 1 }}>
                {metrics.tickets_at_risk.length}
              </p>
              <p style={{ fontSize: '10px', color: '#64748B', margin: '5px 0 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>At Risk</p>
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
            { label: 'Open Tickets', value: metrics.kpis.open_tickets, color: '#028090', suffix: '' },
            { label: 'SLA Compliance', value: metrics.kpis.sla_compliance, color: slaColor(metrics.kpis.sla_compliance), suffix: '%' },
            { label: 'Avg Resolution', value: metrics.kpis.avg_resolution_hours, color: '#028090', suffix: 'h' },
            { label: 'Critical Unassigned', value: metrics.kpis.critical_unassigned, color: metrics.kpis.critical_unassigned > 0 ? '#EF4444' : '#16A34A', suffix: '' },
            { label: 'At-Risk Tickets', value: metrics.tickets_at_risk.length, color: metrics.tickets_at_risk.length > 0 ? '#F97316' : '#16A34A', suffix: '' },
            { label: 'SLA Breached', value: metrics.tickets_breached.length, color: metrics.tickets_breached.length > 0 ? '#EF4444' : '#16A34A', suffix: '' },
          ].map((kpi) => (
            <motion.div
              key={kpi.label}
              variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } } }}
            >
              <div style={{ ...card, borderTop: `3px solid ${kpi.color}`, padding: '16px' }}>
                <p style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>
                  {kpi.label}
                </p>
                <AnimatedNumber value={kpi.value} color={kpi.color} suffix={kpi.suffix} />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Tickets at Risk */}
        {metrics.tickets_at_risk.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.35 }}>
            <div style={{ ...card, marginBottom: '14px', borderLeft: '4px solid #F97316' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <motion.div
                  animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F97316' }}
                />
                <h2 style={{ ...cardTitle, margin: 0 }}>Tickets at Risk — Predicted SLA Breach</h2>
                <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#94A3B8' }}>
                  AI predicted · P(breach) ≥ 70%
                </span>
              </div>
              <AtRiskTable tickets={metrics.tickets_at_risk} showProbability />
            </div>
          </motion.div>
        )}

        {/* Tickets Breached */}
        {metrics.tickets_breached.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34, duration: 0.35 }}>
            <div style={{ ...card, marginBottom: '14px', borderLeft: '4px solid #EF4444' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444' }} />
                <h2 style={{ ...cardTitle, margin: 0 }}>SLA Breached</h2>
                <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#EF4444', fontWeight: 600 }}>
                  {metrics.tickets_breached.length} ticket{metrics.tickets_breached.length !== 1 ? 's' : ''} past deadline
                </span>
              </div>
              <AtRiskTable tickets={metrics.tickets_breached} showProbability={false} />
            </div>
          </motion.div>
        )}

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px', marginBottom: '14px' }}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38, duration: 0.35 }}>
            <div style={{ ...card, borderTop: '3px solid #028090' }}>
              <h2 style={cardTitle}>Ticket Volume — Last 30 Days</h2>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={metrics.ticket_volume_30d}>
                  <defs>
                    <linearGradient id="ticketVolumeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#028090" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="#028090" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} interval={6} axisLine={{ stroke: '#E2E8F0' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip
                    contentStyle={{ borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '13px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
                    labelStyle={{ color: '#0F172A', fontWeight: 600, marginBottom: '4px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#028090"
                    strokeWidth={2.5}
                    fill="url(#ticketVolumeGradient)"
                    dot={false}
                    activeDot={{ r: 5, fill: '#028090', stroke: '#fff', strokeWidth: 2 }}
                    animationDuration={900}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42, duration: 0.35 }}>
            <div style={{ ...card, borderTop: '3px solid #028090' }}>
              <h2 style={cardTitle}>By Category</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={metrics.tickets_by_category} layout="vertical" margin={{ right: 28 }}>
                  <defs>
                    <linearGradient id="categoryBarGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#02C39A" />
                      <stop offset="100%" stopColor="#028090" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="category" tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} width={72} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: '#F8FAFC' }}
                    contentStyle={{ borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '13px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
                  />
                  <Bar dataKey="count" fill="url(#categoryBarGradient)" radius={[0, 6, 6, 0]} animationDuration={900} barSize={16}>
                    <LabelList dataKey="count" position="right" style={{ fontSize: 12, fontWeight: 700, fill: '#0F172A' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Heatmap */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.46, duration: 0.35 }}>
          <div style={{ ...card, marginBottom: '14px', borderTop: '3px solid #028090' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={cardTitle}>Operational Load — Last 7 Days</h2>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {[['#F8FAFC', 'None'], ['#B2E0E5', 'Low'], ['#028090', 'High'], ['#EF4444', 'Critical']].map(([bg, lbl]) => (
                  <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: bg, border: '1px solid #E2E8F0' }} />
                    <span style={{ fontSize: '11px', color: '#94A3B8' }}>{lbl}</span>
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
                    const cell    = metrics.heatmap.find(c => c.dow === dow && c.hour === hour)
                    const count   = cell?.count ?? 0
                    const isNow   = isCurrentHourCell(dow, hour)
                    return (
                      <motion.div
                        key={`${dow}-${hour}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 + (hour * 7 + dow) * 0.0015, duration: 0.25 }}
                        title={`${DAYS[dow]} ${hour}:00 — ${count} tickets${isNow ? ' (current hour)' : ''}`}
                        style={{
                          height: '14px',
                          borderRadius: '2px',
                          background: heatColor(count, maxHeat),
                          outline: isNow ? '2px solid #0D1B2A' : 'none',
                          outlineOffset: isNow ? '-1px' : '0',
                        }}
                      />
                    )
                  })}
                </>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Agent Performance */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.52, duration: 0.35 }}>
          <div style={{ ...card, borderTop: '3px solid #02C39A' }}>
            <h2 style={{ ...cardTitle, marginBottom: '16px' }}>Agent Performance</h2>
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Agent', 'Open', 'Resolved', 'SLA Met %', 'Avg Time'].map(h => (
                      <th key={h} style={{ textAlign: 'left', fontSize: '11px', color: '#94A3B8', fontWeight: 600, padding: '8px 12px', borderBottom: '1px solid #F1F5F9', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {metrics.agent_performance.slice(0, 5).map((agent, i) => (
                    <motion.tr
                      key={agent.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.55 + i * 0.06, duration: 0.25 }}
                      style={{ borderBottom: '1px solid #F8FAFC' }}
                    >
                      <td style={{ padding: '12px', fontSize: '13px', color: '#0F172A', fontWeight: 500 }}>{agent.name}</td>
                      <td style={{ padding: '12px', fontSize: '13px', color: '#0F172A' }}>{agent.open}</td>
                      <td style={{ padding: '12px', fontSize: '13px', color: '#0F172A' }}>{agent.resolved}</td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: slaColor(agent.sla_met_pct), minWidth: '32px' }}>
                            {agent.sla_met_pct}%
                          </span>
                          <div style={{ width: '60px', height: '4px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${agent.sla_met_pct}%` }}
                              transition={{ duration: 0.8, delay: 0.6 + i * 0.06, ease: 'easeOut' }}
                              style={{ height: '100%', background: slaColor(agent.sla_met_pct), borderRadius: '999px' }}
                            />
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px', fontSize: '13px', color: '#0F172A' }}>{agent.avg_time_hrs}h</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

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
          {tickets.map((tkt, i) => (
            <motion.tr
              key={tkt.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.25 }}
              onClick={() => router.visit(`/tickets/${tkt.id}`)}
              style={{ borderBottom: '1px solid #F8FAFC', cursor: 'pointer', transition: 'background 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
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
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const card: React.CSSProperties = {
  background: '#fff', borderRadius: '14px', padding: '20px',
  border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.05)',
}
const cardTitle: React.CSSProperties = {
  fontSize: '14px', fontWeight: 700, color: '#0F172A', margin: '0 0 4px', letterSpacing: '-0.1px',
}