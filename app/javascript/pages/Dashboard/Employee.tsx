import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { Link } from '@inertiajs/react'
import ErrorBoundary from '@/components/ErrorBoundary'

interface Ticket {
  id: number
  ticket_number: string
  title: string
  status: string
  priority: string
  due_at: string | null
}

interface LeaveRequest {
  id: number
  leave_type: string
  start_date: string
  end_date: string
  status: string
}

interface OnboardingTask {
  id: number
  title: string
  category: string
}

interface Notification {
  id: number
  title: string
  body: string
  read: boolean
  created_at: string
}

interface EmployeeMetrics {
  tickets: { open: number; resolved: number; recent: Ticket[] }
  leave_requests: { pending: number; approved: number; recent: LeaveRequest[] }
  onboarding: {
    completion_percentage: number
    total_tasks: number
    completed_tasks: number
    next_tasks: OnboardingTask[]
  } | null
  notifications: Notification[]
}

interface Props {
  metrics: EmployeeMetrics
  user: { first_name: string }
}

const PRIORITY_COLORS: Record<string, string> = {
  critical: '#EF4444',
  high:     '#F97316',
  medium:   '#EAB308',
  low:      '#6B7280',
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  open:        { bg: '#EFF6FF', text: '#1D4ED8' },
  in_progress: { bg: '#FFF7ED', text: '#C2410C' },
  pending:     { bg: '#FEFCE8', text: '#A16207' },
  resolved:    { bg: '#F0FDF4', text: '#15803D' },
  closed:      { bg: '#F8FAFC', text: '#475569' },
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
}

const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.08 } },
}

// ── Animated counter ──────────────────────────────────────────────────────────
function AnimatedNumber({ value, color }: { value: number; color: string }) {
  const motionVal = useMotionValue(0)
  const rounded   = useTransform(motionVal, (v) => Math.round(v))
  const ref        = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const controls = animate(motionVal, value, { duration: 0.9, ease: 'easeOut' })
    return controls.stop
  }, [value, motionVal])

  useEffect(() => {
    return rounded.on('change', (v) => {
      if (ref.current) ref.current.textContent = String(v)
    })
  }, [rounded])

  return (
    <p
      ref={ref}
      style={{ fontSize: '32px', fontWeight: 700, color, margin: '0 0 8px', letterSpacing: '-1px' }}
    >
      0
    </p>
  )
}

// ── SLA countdown ─────────────────────────────────────────────────────────────
function SlaCountdown({ dueAt }: { dueAt: string | null }) {
  if (!dueAt) return <span style={{ color: '#CBD5E1', fontSize: '11px' }}>No SLA</span>
  const diff  = new Date(dueAt).getTime() - Date.now()
  const hours = Math.floor(diff / 3600000)
  const mins  = Math.floor((diff % 3600000) / 60000)
  const color = diff < 0 ? '#EF4444' : diff < 3600000 ? '#F97316' : '#16A34A'
  const label = diff < 0 ? 'Overdue' : hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  return (
    <span style={{ fontSize: '11px', color, fontWeight: 700, flexShrink: 0, marginLeft: '10px' }}>
      {label}
    </span>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function EmployeeDashboard({ metrics, user }: Props) {
  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const dateLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <ErrorBoundary section="Employee Dashboard">
      <div style={{ maxWidth: '1020px' }}>

        {/* ── Dark hero header ── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{
            background: '#0D1B2A',
            borderRadius: '16px',
            padding: '28px 32px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <p style={{ fontSize: '11px', color: '#02C39A', letterSpacing: '0.12em', fontWeight: 700, margin: '0 0 6px', textTransform: 'uppercase' }}>
              {dateLabel}
            </p>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.4px' }}>
              {greeting}, {user.first_name}.
            </h1>
            <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0 }}>
              {metrics.tickets.open > 0
                ? <>You have <span style={{ color: '#02C39A', fontWeight: 600 }}>{metrics.tickets.open} open ticket{metrics.tickets.open !== 1 ? 's' : ''}</span>{metrics.leave_requests.pending > 0 ? <> and <span style={{ color: '#F97316', fontWeight: 600 }}>{metrics.leave_requests.pending} pending request</span></> : ''} today.</>
                : "You're all caught up. Great work!"}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              style={{
                background: metrics.tickets.open > 0 ? 'rgba(2,128,144,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${metrics.tickets.open > 0 ? 'rgba(2,195,154,0.3)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '12px', padding: '12px 20px', textAlign: 'center', minWidth: '76px',
              }}
            >
              <p style={{ fontSize: '24px', fontWeight: 700, color: metrics.tickets.open > 0 ? '#02C39A' : '#475569', margin: 0, lineHeight: 1 }}>
                {metrics.tickets.open}
              </p>
              <p style={{ fontSize: '10px', color: '#64748B', margin: '5px 0 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tickets</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.28, duration: 0.3 }}
              style={{
                background: metrics.leave_requests.pending > 0 ? 'rgba(249,115,22,0.12)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${metrics.leave_requests.pending > 0 ? 'rgba(249,115,22,0.25)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '12px', padding: '12px 20px', textAlign: 'center', minWidth: '76px',
              }}
            >
              <p style={{ fontSize: '24px', fontWeight: 700, color: metrics.leave_requests.pending > 0 ? '#F97316' : '#475569', margin: 0, lineHeight: 1 }}>
                {metrics.leave_requests.pending}
              </p>
              <p style={{ fontSize: '10px', color: '#64748B', margin: '5px 0 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Leave</p>
            </motion.div>
          </div>
        </motion.div>

        {/* ── KPI cards ── */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}
        >
          <motion.div variants={fadeUp}>
            <div style={{ ...card, borderTop: '3px solid #028090' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <p style={label}>My Open Tickets</p>
                <IconBox color="#028090" bg="#F0FDFA"><TicketIcon /></IconBox>
              </div>
              <AnimatedNumber value={metrics.tickets.open} color="#028090" />
              <Link href="/tickets" style={{ fontSize: '11px', color: '#028090', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                View all <ArrowRight />
              </Link>
            </div>
          </motion.div>

          <motion.div variants={fadeUp}>
            <div style={{ ...card, borderTop: '3px solid #F97316' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <p style={label}>Pending Leave</p>
                <IconBox color="#F97316" bg="#FFF7ED"><CalendarIcon /></IconBox>
              </div>
              <AnimatedNumber value={metrics.leave_requests.pending} color="#F97316" />
              <span style={{ fontSize: '11px', color: '#94A3B8' }}>Awaiting approval</span>
            </div>
          </motion.div>

          <motion.div variants={fadeUp}>
            <div style={{ ...card, borderTop: '3px solid #02C39A' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <p style={label}>Onboarding Progress</p>
                <IconBox color="#02C39A" bg="#F0FDFA"><CheckIcon /></IconBox>
              </div>
              {metrics.onboarding ? (
                <>
                  <p style={{ fontSize: '32px', fontWeight: 700, color: '#028090', margin: '0 0 10px', letterSpacing: '-1px' }}>
                    {metrics.onboarding.completion_percentage}%
                  </p>
                  <div style={{ background: '#E2E8F0', borderRadius: '999px', height: '5px', overflow: 'hidden', marginBottom: '6px' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${metrics.onboarding.completion_percentage}%` }}
                      transition={{ duration: 1.1, type: 'spring', stiffness: 60, damping: 14, delay: 0.4 }}
                      style={{ height: '100%', background: 'linear-gradient(90deg, #028090, #02C39A)', borderRadius: '999px' }}
                    />
                  </div>
                  <p style={{ fontSize: '10px', color: '#94A3B8', margin: 0 }}>
                    {metrics.onboarding.completed_tasks}/{metrics.onboarding.total_tasks} tasks complete
                  </p>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 0 2px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F8FAFC', border: '1px dashed #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <DashIcon />
                  </div>
                  <div>
                    <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 1px', fontWeight: 500 }}>No plan assigned</p>
                    <p style={{ fontSize: '10px', color: '#94A3B8', margin: 0 }}>Contact HR to get started</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>

        {/* ── Main 2-col grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '16px', marginBottom: '16px' }}>

          {/* My Tickets */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.35 }}>
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h2 style={sectionTitle}>My Tickets</h2>
                <Link href="/tickets" style={{ fontSize: '11px', color: '#028090', textDecoration: 'none', fontWeight: 600 }}>View all →</Link>
              </div>
              {metrics.tickets.recent.length === 0 ? (
                <EmptyState icon={<TicketIcon />} text="No open tickets" sub="You're all caught up." />
              ) : (
                metrics.tickets.recent.map((t, i) => (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.06, duration: 0.25 }}
                  >
                    <Link href={`/tickets/${t.id}`} style={{ display: 'block', textDecoration: 'none' }}>
                      <div
                        style={{ padding: '10px 0', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', transition: 'opacity 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = '0.65')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                      >
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: '10px', color: '#94A3B8', margin: '0 0 2px', fontFamily: 'monospace', letterSpacing: '0.04em' }}>{t.ticket_number}</p>
                          <p style={{ fontSize: '13px', color: '#0F172A', margin: '0 0 7px', fontWeight: 500, lineHeight: 1.4 }}>{t.title}</p>
                          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                            <Badge text={t.status.replace('_', ' ')} bg={STATUS_COLORS[t.status]?.bg ?? '#F8FAFC'} color={STATUS_COLORS[t.status]?.text ?? '#475569'} />
                            <Badge text={t.priority} bg={PRIORITY_COLORS[t.priority] + '18'} color={PRIORITY_COLORS[t.priority] ?? '#475569'} />
                          </div>
                        </div>
                        <SlaCountdown dueAt={t.due_at} />
                      </div>
                    </Link>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>

          {/* My Leave Requests */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32, duration: 0.35 }}>
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h2 style={sectionTitle}>My Leave Requests</h2>
                <Link href="/hr/leave_requests/new" style={{ fontSize: '11px', color: '#028090', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <PlusIcon /> New request
                </Link>
              </div>
              {metrics.leave_requests.recent.length === 0 ? (
                <EmptyState icon={<CalendarIcon />} text="No leave requests" sub="Submit your first request above." />
              ) : (
                metrics.leave_requests.recent.map((lr, i) => {
                  const s = lr.status === 'approved' ? { bg: '#F0FDF4', color: '#15803D' }
                          : lr.status === 'rejected' ? { bg: '#FEF2F2', color: '#DC2626' }
                          :                            { bg: '#FFF7ED', color: '#C2410C' }
                  return (
                    <motion.div
                      key={lr.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.35 + i * 0.07 }}
                      style={{ padding: '11px 0', borderBottom: '1px solid #F1F5F9' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ fontSize: '13px', color: '#0F172A', margin: '0 0 3px', fontWeight: 500, textTransform: 'capitalize' }}>
                            {lr.leave_type.replace('_', ' ')}
                          </p>
                          <p style={{ fontSize: '10px', color: '#94A3B8', margin: 0 }}>
                            {new Date(lr.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            {' — '}
                            {new Date(lr.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                        <Badge text={lr.status} bg={s.bg} color={s.color} />
                      </div>
                    </motion.div>
                  )
                })
              )}
            </div>
          </motion.div>
        </div>

        {/* ── Bottom 2-col grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '16px' }}>

          {/* Onboarding tasks */}
          {metrics.onboarding && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.35 }}>
              <div style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h2 style={sectionTitle}>My Onboarding</h2>
                  <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: '#F0FDFA', color: '#028090' }}>
                    {metrics.onboarding.completion_percentage}%
                  </span>
                </div>
                <div style={{ background: '#E2E8F0', borderRadius: '999px', height: '4px', overflow: 'hidden', marginBottom: '14px' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${metrics.onboarding.completion_percentage}%` }}
                    transition={{ duration: 1.1, type: 'spring', stiffness: 60, damping: 14, delay: 0.5 }}
                    style={{ height: '100%', background: 'linear-gradient(90deg, #028090, #02C39A)', borderRadius: '999px' }}
                  />
                </div>
                {metrics.onboarding.next_tasks.map((task, i) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.07, duration: 0.25 }}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 0', borderBottom: '1px solid #F1F5F9' }}
                  >
                    <div style={{ width: '15px', height: '15px', borderRadius: '4px', border: '2px solid #CBD5E1', flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: '13px', color: '#0F172A', margin: 0 }}>{task.title}</p>
                      <p style={{ fontSize: '10px', color: '#94A3B8', margin: '2px 0 0', textTransform: 'capitalize' }}>{task.category}</p>
                    </div>
                  </motion.div>
                ))}
                <Link href="/hr/onboarding_plans/1" style={{ display: 'block', textAlign: 'center', fontSize: '11px', color: '#028090', paddingTop: '14px', textDecoration: 'none', fontWeight: 600 }}>
                  View full plan →
                </Link>
              </div>
            </motion.div>
          )}

          {/* Notifications */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.46, duration: 0.35 }}>
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h2 style={sectionTitle}>Recent Notifications</h2>
                <Link href="/notifications" style={{ fontSize: '11px', color: '#028090', textDecoration: 'none', fontWeight: 600 }}>View all</Link>
              </div>
              {metrics.notifications.length === 0 ? (
                <EmptyState icon={<BellIcon />} text="No notifications" sub="You're up to date." />
              ) : (
                metrics.notifications.map((n, i) => (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 + i * 0.06 }}
                    style={{ display: 'flex', gap: '12px', padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}
                  >
                    {n.read ? (
                      <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#CBD5E1', flexShrink: 0, marginTop: '5px' }} />
                    ) : (
                      <motion.div
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ duration: 2, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
                        style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#028090', flexShrink: 0, marginTop: '5px', boxShadow: '0 0 0 3px rgba(2,128,144,0.18)' }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '13px', color: '#0F172A', margin: '0 0 3px', fontWeight: n.read ? 400 : 600, lineHeight: 1.4 }}>
                        {n.title}
                      </p>
                      <p style={{ fontSize: '10px', color: '#94A3B8', margin: 0 }}>
                        {new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>

        </div>
      </div>
    </ErrorBoundary>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function IconBox({ color, bg, children }: { color: string; bg: string; children: React.ReactNode }) {
  return (
    <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
      {children}
    </div>
  )
}

function Badge({ text, bg, color }: { text: string; bg: string; color: string }) {
  return (
    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '5px', background: bg, color, textTransform: 'capitalize', letterSpacing: '0.01em' }}>
      {text}
    </span>
  )
}

function EmptyState({ icon, text, sub }: { icon: React.ReactNode; text: string; sub: string }) {
  return (
    <div style={{ padding: '28px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
      <div style={{ color: '#CBD5E1', marginBottom: '2px' }}>{icon}</div>
      <p style={{ fontSize: '13px', color: '#64748B', margin: 0, fontWeight: 500 }}>{text}</p>
      <p style={{ fontSize: '11px', color: '#94A3B8', margin: 0 }}>{sub}</p>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: '#fff',
  borderRadius: '14px',
  padding: '20px',
  border: '1px solid #E2E8F0',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.05)',
  height: '100%',
  boxSizing: 'border-box',
}

const label: React.CSSProperties = {
  fontSize: '10px',
  color: '#94A3B8',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  margin: 0,
  fontWeight: 700,
}

const sectionTitle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 700,
  color: '#0F172A',
  margin: 0,
  letterSpacing: '-0.1px',
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function TicketIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/>
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

function BellIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  )
}

function DashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  )
}

function ArrowRight() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  )
}