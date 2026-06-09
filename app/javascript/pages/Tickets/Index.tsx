import { useState, useCallback } from 'react'
import { router } from '@inertiajs/react'
import type { Ticket, TicketsIndexProps, TicketPriority, TicketStatus, SlaStatus } from '@/types/tickets'
import { useActionCable } from '@/hooks/useActionCable'
import AppLayout from '@/components/AppLayout'
import ErrorBoundary from '@/components/ErrorBoundary'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatSlaTime(seconds: number | null, slaStatus: SlaStatus) {
  if (slaStatus === 'met') return <span style={{ color: '#16A34A', fontWeight: 500, fontSize: 13 }}>Met</span>
  if (slaStatus === 'breached') return (
    <span style={{ background: '#EF4444', color: '#fff', fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 6 }}>Breached</span>
  )
  if (!seconds || seconds <= 0) return null
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const label = h > 0 ? `${h}h left` : `${m}m left`
  const color = slaStatus === 'at_risk' ? '#F97316' : '#16A34A'
  return <span style={{ color, fontWeight: 500, fontSize: 13 }}>{label}</span>
}

const PRIORITY_CFG: Record<TicketPriority, { label: string; color: string }> = {
  critical: { label: 'Critical', color: '#EF4444' },
  high:     { label: 'High',     color: '#F97316' },
  medium:   { label: 'Medium',   color: '#EAB308' },
  low:      { label: 'Low',      color: '#6B7280' },
}

const STATUS_CFG: Record<TicketStatus, { label: string; bg: string; text: string }> = {
  open:                   { label: 'Open',        bg: '#DCFCE7', text: '#16A34A' },
  in_progress:            { label: 'In Progress', bg: '#DBEAFE', text: '#2563EB' },
  pending:                { label: 'Pending',     bg: '#FEF9C3', text: '#CA8A04' },
  resolved:               { label: 'Resolved',    bg: '#DCFCE7', text: '#16A34A' },
  closed:                 { label: 'Closed',      bg: '#F1F5F9', text: '#64748B' },
  pending_classification: { label: 'Classifying', bg: '#F3E8FF', text: '#9333EA' },
}

const CATEGORY_ICONS: Record<string, string> = {
  it: '🖥', hr: '👤', facilities: '🏢', finance: '💰',
  operations: '⚙️', support: '💬', general: '📋',
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (h < 1) return 'just now'
  if (h < 24) return `${h}h ago`
  return `${d}d ago`
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, subColor }: { label: string; value: string | number; sub: string; subColor?: string }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', padding: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
      <p style={{ fontSize: 13, color: '#475569', marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 700, color: '#0F172A' }}>{value}</p>
      <p style={{ fontSize: 12, color: subColor ?? '#16A34A', marginTop: 2 }}>{sub}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: TicketStatus }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.open
  return (
    <span style={{ background: cfg.bg, color: cfg.text, fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap' }}>
      {cfg.label}
    </span>
  )
}

function Avatar({ name }: { name: string }) {
  return (
    <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#028090', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>{name.charAt(0).toUpperCase()}</span>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

const STATUS_TABS = [
  { key: '',            label: 'All Tickets' },
  { key: 'open',        label: 'Open' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'pending',     label: 'Pending' },
  { key: 'resolved',    label: 'Resolved' },
]

export default function TicketsIndex({ tickets, departments, stats, filters, pagination }: TicketsIndexProps) {
  const [activeTab, setActiveTab]       = useState(filters.status ?? '')
  const [searchQuery, setSearchQuery]   = useState(filters.q ?? '')
  const [selectedPriority, setPriority] = useState(filters.priority ?? '')
  const [selectedDept, setDept]         = useState(filters.department_id ?? '')

  useActionCable({ channel: 'TicketsChannel' }, useCallback(() => {
    router.reload({ only: ['tickets', 'stats'] })
  }, []))

  function applyFilters(overrides: Record<string, string> = {}) {
    router.get('/tickets', {
      status:        overrides.status        ?? (activeTab || undefined),
      priority:      overrides.priority      ?? (selectedPriority || undefined),
      department_id: overrides.department_id ?? (selectedDept || undefined),
      q:             overrides.q             ?? (searchQuery || undefined),
    }, { preserveScroll: true, replace: true })
  }

  function handleTabChange(key: string) {
    setActiveTab(key)
    applyFilters({ status: key })
  }

  const tabCounts: Record<string, number> = {
    '': pagination.total_count,
    open: stats.total_open,
    in_progress: stats.in_progress,
    pending: 0,
    resolved: stats.resolved_today,
  }

  return (
    <AppLayout title="Tickets">
      <ErrorBoundary section="Tickets">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A' }}>Tickets</h1>
          <p style={{ fontSize: 13, color: '#475569', marginTop: 2 }}>Manage and track support, IT, HR, and operations requests</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 13, color: '#475569', background: '#fff', cursor: 'pointer' }}>
            Export
          </button>
          <button
            onClick={() => router.get('/tickets/new')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#028090', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' }}
          >
            + New Ticket
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Total Open"     value={stats.total_open}     sub={`+${stats.delta.total_open_today} today`} />
        <StatCard label="In Progress"    value={stats.in_progress}    sub={`↑ ${stats.delta.in_progress_vs_last_week} vs last week`} />
        <StatCard label="SLA Breached"   value={stats.sla_breached}   sub={`${stats.delta.sla_breached_critical} critical`} subColor="#EF4444" />
        <StatCard label="Resolved Today" value={stats.resolved_today} sub={`+${stats.delta.resolved_today_vs_avg} vs avg`} />
        <StatCard label="Avg Response"   value={`${stats.avg_response_hours}h`} sub={`↓ ${Math.abs(stats.delta.avg_response_vs_avg_minutes)} min vs avg`} />
      </div>

      {/* Main card */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', padding: '0 24px' }}>
          {STATUS_TABS.map(tab => {
            const count = tabCounts[tab.key] ?? 0
            const isActive = activeTab === tab.key
            return (
              <button key={tab.key} onClick={() => handleTabChange(tab.key)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 4px', marginRight: 24, fontSize: 13, fontWeight: 500, border: 'none', background: 'none', cursor: 'pointer', borderBottom: isActive ? '2px solid #028090' : '2px solid transparent', color: isActive ? '#028090' : '#475569' }}
              >
                {tab.label}
                {count > 0 && (
                  <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 20, fontWeight: 600, background: isActive ? '#028090' : '#F1F5F9', color: isActive ? '#fff' : '#475569' }}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 24px', borderBottom: '1px solid #E2E8F0' }}>
          <input
            type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && applyFilters()}
            placeholder="Search tickets..."
            style={{ padding: '8px 14px', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 13, color: '#0F172A', width: 220, outline: 'none' }}
          />
          <select value={selectedDept} onChange={e => { setDept(e.target.value); applyFilters({ department_id: e.target.value }) }}
            style={{ padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 13, color: '#475569', background: '#fff' }}>
            <option value="">Category</option>
            {departments.map(d => <option key={d.id} value={String(d.id)}>{d.name}</option>)}
          </select>
          <select value={selectedPriority} onChange={e => { setPriority(e.target.value); applyFilters({ priority: e.target.value }) }}
            style={{ padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 13, color: '#475569', background: '#fff' }}>
            <option value="">Priority</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                {['ID', 'TITLE', 'CATEGORY', 'DEPARTMENT', 'STATUS', 'PRIORITY', 'ASSIGNEE', 'SLA', 'UPDATED'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 ? (
                <tr><td colSpan={9} style={{ padding: '48px', textAlign: 'center', color: '#94A3B8', fontSize: 14 }}>No tickets found.</td></tr>
              ) : tickets.map(ticket => (
                <tr key={ticket.id} onClick={() => router.get(`/tickets/${ticket.id}`)}
                  style={{ borderBottom: '1px solid #E2E8F0', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '14px 12px' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#028090' }}>{ticket.ticket_number}</span>
                  </td>
                  <td style={{ padding: '14px 12px', maxWidth: 220 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ticket.title}</p>
                    <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{ticket.created_by.full_name}</p>
                  </td>
                  <td style={{ padding: '14px 12px' }}>
                    <span style={{ fontSize: 13, color: '#475569' }}>{CATEGORY_ICONS[ticket.category]} {ticket.category}</span>
                  </td>
                  <td style={{ padding: '14px 12px' }}>
                    <span style={{ fontSize: 13, color: '#475569' }}>{ticket.department.name}</span>
                  </td>
                  <td style={{ padding: '14px 12px' }}><StatusBadge status={ticket.status} /></td>
                  <td style={{ padding: '14px 12px' }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: PRIORITY_CFG[ticket.priority]?.color }}>
                      {PRIORITY_CFG[ticket.priority]?.label}
                    </span>
                  </td>
                  <td style={{ padding: '14px 12px' }}>
                    {ticket.assigned_to ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar name={ticket.assigned_to.full_name} />
                        <span style={{ fontSize: 13, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 80 }}>{ticket.assigned_to.full_name}</span>
                      </div>
                    ) : <span style={{ fontSize: 13, color: '#94A3B8', fontStyle: 'italic' }}>Unassigned</span>}
                  </td>
                  <td style={{ padding: '14px 12px' }}>{formatSlaTime(ticket.sla_remaining_seconds, ticket.sla_status)}</td>
                  <td style={{ padding: '14px 12px' }}>
                    <span style={{ fontSize: 13, color: '#94A3B8' }}>{formatRelative(ticket.updated_at)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', borderTop: '1px solid #E2E8F0' }}>
            <p style={{ fontSize: 13, color: '#475569' }}>
              Showing {((pagination.current_page - 1) * 10) + 1}–{Math.min(pagination.current_page * 10, pagination.total_count)} of {pagination.total_count} tickets
            </p>
            <div style={{ display: 'flex', gap: 4 }}>
              {Array.from({ length: Math.min(pagination.total_pages, 10) }, (_, i) => i + 1).map(page => (
                <button key={page} onClick={() => router.get('/tickets', { ...filters, page })}
                  style={{ width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: page === pagination.current_page ? 600 : 400, background: page === pagination.current_page ? '#028090' : 'transparent', color: page === pagination.current_page ? '#fff' : '#475569' }}>
                  {page}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
    </AppLayout>
  )
}
