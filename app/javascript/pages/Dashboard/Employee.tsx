import ErrorBoundary from '@/components/ErrorBoundary'
import { Link } from '@inertiajs/react'

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
  tickets: {
    open: number
    resolved: number
    recent: Ticket[]
  }
  leave_requests: {
    pending: number
    approved: number
    recent: LeaveRequest[]
  }
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

function SlaCountdown({ dueAt }: { dueAt: string | null }) {
  if (!dueAt) return <span style={{ color: '#94A3B8', fontSize: '12px' }}>No SLA</span>
  const diff = new Date(dueAt).getTime() - Date.now()
  const hours = Math.floor(diff / 3600000)
  const mins  = Math.floor((diff % 3600000) / 60000)
  const color = diff < 0 ? '#EF4444' : diff < 3600000 ? '#F97316' : '#16A34A'
  const label = diff < 0 ? 'Overdue' : hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  return <span style={{ fontSize: '12px', color, fontWeight: 600 }}>{label}</span>
}

export default function EmployeeDashboard({ metrics, user }: Props) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <ErrorBoundary section="Employee Dashboard">
      <div style={{ maxWidth: '1000px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0F172A', margin: '0 0 4px' }}>
          My Dashboard
        </h1>
        <p style={{ color: '#475569', fontSize: '14px', margin: 0 }}>
          {greeting}, {user.first_name}! Here's your day at a glance.
        </p>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
        <KpiCard
          label="My Open Tickets"
          value={metrics.tickets.open}
          color="#028090"
          sub={<Link href="/tickets" style={{ fontSize: '12px', color: '#028090', textDecoration: 'none' }}>View All →</Link>}
        />
        <KpiCard
          label="Pending Leave Request"
          value={metrics.leave_requests.pending}
          color="#F97316"
          sub={<span style={{ fontSize: '12px', color: '#94A3B8' }}>Awaiting approval</span>}
        />
        <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <p style={{ fontSize: '12px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px', fontWeight: 600 }}>Onboarding Progress</p>
          {metrics.onboarding ? (
            <>
              <p style={{ fontSize: '28px', fontWeight: '700', color: '#028090', margin: '0 0 10px' }}>{metrics.onboarding.completion_percentage}%</p>
              <div style={{ background: '#E2E8F0', borderRadius: '999px', height: '6px', overflow: 'hidden' }}>
                <div style={{ width: `${metrics.onboarding.completion_percentage}%`, background: '#028090', height: '100%', borderRadius: '999px', transition: 'width 0.3s' }} />
              </div>
              <p style={{ fontSize: '12px', color: '#94A3B8', margin: '8px 0 0' }}>{metrics.onboarding.completed_tasks}/{metrics.onboarding.total_tasks} tasks</p>
            </>
          ) : (
            <p style={{ fontSize: '14px', color: '#94A3B8', margin: 0 }}>No plan assigned</p>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* My Tickets */}
        <Section title="My Tickets">
          {metrics.tickets.recent.length === 0
            ? <Empty text="No open tickets" />
            : metrics.tickets.recent.map(t => (
              <Link key={t.id} href={`/tickets/${t.id}`} style={{ display: 'block', textDecoration: 'none' }}>
                <div style={{ padding: '12px 0', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontSize: '12px', color: '#94A3B8', margin: '0 0 2px', fontFamily: 'monospace' }}>{t.ticket_number}</p>
                    <p style={{ fontSize: '14px', color: '#0F172A', margin: '0 0 6px', fontWeight: 500 }}>{t.title}</p>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <Badge text={t.status.replace('_', ' ')} bg={STATUS_COLORS[t.status]?.bg ?? '#F8FAFC'} color={STATUS_COLORS[t.status]?.text ?? '#475569'} />
                      <Badge text={t.priority} bg={PRIORITY_COLORS[t.priority] + '20'} color={PRIORITY_COLORS[t.priority] ?? '#475569'} />
                    </div>
                  </div>
                  <SlaCountdown dueAt={t.due_at} />
                </div>
              </Link>
            ))
          }
          <Link href="/tickets" style={{ display: 'block', textAlign: 'center', fontSize: '13px', color: '#028090', paddingTop: '12px', textDecoration: 'none' }}>
            View All My Tickets →
          </Link>
        </Section>

        {/* My Leave Requests */}
        <Section title="My Leave Requests" action={<Link href="/hr/leave_requests/new" style={{ fontSize: '13px', color: '#028090', textDecoration: 'none', fontWeight: 600 }}>+ New Request</Link>}>
          {metrics.leave_requests.recent.length === 0
            ? <Empty text="No leave requests" />
            : metrics.leave_requests.recent.map(lr => {
              const isApproved = lr.status === 'approved'
              return (
                <div key={lr.id} style={{ padding: '12px 0', borderBottom: '1px solid #F1F5F9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontSize: '14px', color: '#0F172A', margin: '0 0 4px', fontWeight: 500, textTransform: 'capitalize' }}>
                        {lr.leave_type.replace('_', ' ')}
                      </p>
                      <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>
                        {new Date(lr.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {new Date(lr.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <Badge
                      text={lr.status}
                      bg={isApproved ? '#F0FDF4' : lr.status === 'rejected' ? '#FEF2F2' : '#FFF7ED'}
                      color={isApproved ? '#15803D' : lr.status === 'rejected' ? '#DC2626' : '#C2410C'}
                    />
                  </div>
                </div>
              )
            })
          }
        </Section>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Onboarding */}
        {metrics.onboarding && (
          <Section title="My Onboarding">
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', color: '#475569' }}>Progress</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#028090' }}>{metrics.onboarding.completion_percentage}%</span>
              </div>
              <div style={{ background: '#E2E8F0', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
                <div style={{ width: `${metrics.onboarding.completion_percentage}%`, background: '#028090', height: '100%', borderRadius: '999px' }} />
              </div>
            </div>
            {metrics.onboarding.next_tasks.map(task => (
              <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
                <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: '2px solid #CBD5E1', flexShrink: 0 }} />
                <span style={{ fontSize: '14px', color: '#0F172A' }}>{task.title}</span>
              </div>
            ))}
            <Link href="/hr/onboarding_plans/1" style={{ display: 'block', textAlign: 'center', fontSize: '13px', color: '#028090', paddingTop: '12px', textDecoration: 'none' }}>
              View Full Plan →
            </Link>
          </Section>
        )}

        {/* Notifications */}
        <Section title="Recent Notifications" action={<Link href="/notifications" style={{ fontSize: '13px', color: '#028090', textDecoration: 'none' }}>View All</Link>}>
          {metrics.notifications.length === 0
            ? <Empty text="No notifications" />
            : metrics.notifications.map(n => (
              <div key={n.id} style={{ display: 'flex', gap: '10px', padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: n.read ? '#CBD5E1' : '#028090', flexShrink: 0, marginTop: '5px' }} />
                <div>
                  <p style={{ fontSize: '13px', color: '#0F172A', margin: '0 0 2px', fontWeight: n.read ? 400 : 600 }}>{n.title}</p>
                  <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>
                    {new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))
          }
        </Section>
      </div>
    </div>
    </ErrorBoundary>
  )
}

function KpiCard({ label, value, color, sub }: { label: string; value: number; color: string; sub?: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
      <p style={{ fontSize: '12px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px', fontWeight: 600 }}>{label}</p>
      <p style={{ fontSize: '28px', fontWeight: '700', color, margin: '0 0 6px' }}>{value}</p>
      {sub}
    </div>
  )
}

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A', margin: 0 }}>{title}</h2>
        {action}
      </div>
      {children}
    </div>
  )
}

function Badge({ text, bg, color }: { text: string; bg: string; color: string }) {
  return (
    <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px', background: bg, color, textTransform: 'capitalize' }}>
      {text}
    </span>
  )
}

function Empty({ text }: { text: string }) {
  return <p style={{ fontSize: '14px', color: '#94A3B8', textAlign: 'center', padding: '20px 0', margin: 0 }}>{text}</p>
}
