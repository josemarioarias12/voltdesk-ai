import { useState, useCallback, useEffect, useRef } from 'react'
import type { CSSProperties, ReactElement } from 'react'
import { router, usePage } from '@inertiajs/react'
import type { SharedProps } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useDepartmentName } from '@/hooks/useDepartmentName'
import type {
  TicketPriority, TicketStatus, TicketCategory, SlaStatus,
  TicketsIndexProps, TicketsFilters, TicketSortColumn, SortDirection,
} from '@/types/tickets'
import { useActionCable } from '@/hooks/useActionCable'
import AppLayout from '@/components/AppLayout'
import EmptyState from '@/components/EmptyState'
import ErrorBoundary from '@/components/ErrorBoundary'

type Translate = (key: string, options?: Record<string, unknown>) => string

function useWindowWidth() {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return width
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatSlaTime(seconds: number | null, slaStatus: SlaStatus, t: Translate): ReactElement | null {
  if (slaStatus === 'met') return <span style={{ color: '#16A34A', fontWeight: 500, fontSize: 13 }}>{t('sla.met')}</span>
  if (slaStatus === 'breached') return (
    <span style={{ background: '#EF4444', color: '#fff', fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 6 }}>{t('sla.breached')}</span>
  )
  if (!seconds || seconds <= 0) return null
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const label = h > 0 ? t('sla.hoursLeft', { count: h }) : t('sla.minutesLeft', { count: m })
  const color = slaStatus === 'at_risk' ? '#F97316' : '#16A34A'
  return <span style={{ color, fontWeight: 500, fontSize: 13 }}>{label}</span>
}

function formatRelative(iso: string, t: Translate): string {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (h < 1) return t('relative.justNow')
  if (h < 24) return t('relative.hoursAgo', { count: h })
  return t('relative.daysAgo', { count: d })
}

// Fallback label for any status the enum gains later but translations haven't been added for yet.
function humanizeStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// ── Config ────────────────────────────────────────────────────────────────────

const PRIORITY_CFG: Record<TicketPriority, { color: string }> = {
  critical: { color: '#EF4444' },
  high: { color: '#F97316' },
  medium: { color: '#EAB308' },
  low: { color: '#6B7280' },
}

const STATUS_CFG: Record<TicketStatus, { bg: string; text: string }> = {
  open: { bg: '#DCFCE7', text: '#16A34A' },
  in_progress: { bg: '#DBEAFE', text: '#2563EB' },
  pending: { bg: '#FEF9C3', text: '#CA8A04' },
  resolved: { bg: '#DCFCE7', text: '#16A34A' },
  closed: { bg: '#F1F5F9', text: '#64748B' },
  pending_classification: { bg: '#F3E8FF', text: '#9333EA' },
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconChevronNeutral() {
  return <svg width="14" height="14" fill="none" stroke="#CBD5E1" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" /></svg>
}
function IconChevronUp() {
  return <svg width="14" height="14" fill="none" stroke="#028090" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 15l6-6 6 6" /></svg>
}
function IconChevronDown() {
  return <svg width="14" height="14" fill="none" stroke="#028090" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9l6 6 6-6" /></svg>
}
function IconEmptyTicket() {
  return (
    <svg width="48" height="48" fill="none" stroke="#CBD5E1" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
    </svg>
  )
}
function IconIt() {
  return (
    <svg width="16" height="16" fill="none" stroke="#475569" viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="13" rx="2" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 21h8M12 17v4" />
    </svg>
  )
}
function IconHr() {
  return (
    <svg width="16" height="16" fill="none" stroke="#475569" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="3.5" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 20a7 7 0 0114 0" />
    </svg>
  )
}
function IconFacilities() {
  return (
    <svg width="16" height="16" fill="none" stroke="#475569" viewBox="0 0 24 24">
      <rect x="4" y="3" width="16" height="18" rx="1" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 8h1m4 0h1M9 12h1m4 0h1M9 16h1m4 0h1" />
    </svg>
  )
}
function IconFinance() {
  return (
    <svg width="16" height="16" fill="none" stroke="#475569" viewBox="0 0 24 24">
      <rect x="2.5" y="6" width="19" height="12" rx="2" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.5" strokeWidth={2} />
    </svg>
  )
}
function IconOperations() {
  return (
    <svg width="16" height="16" fill="none" stroke="#475569" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}
function IconSupport() {
  return (
    <svg width="16" height="16" fill="none" stroke="#475569" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  )
}
function IconGeneral() {
  return (
    <svg width="16" height="16" fill="none" stroke="#475569" viewBox="0 0 24 24">
      <rect x="6" y="4" width="12" height="16" rx="2" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9h6M9 13h6M9 17h4" />
    </svg>
  )
}

const CATEGORY_ICON_MAP: Record<TicketCategory, () => ReactElement> = {
  it: IconIt, hr: IconHr, facilities: IconFacilities, finance: IconFinance,
  operations: IconOperations, support: IconSupport, general: IconGeneral,
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, subColor }: { label: string; value: string | number; sub: string; subColor?: string }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.05)' }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 24, fontWeight: 600, color: '#0F172A' }}>{value}</p>
      <p style={{ fontSize: 12, color: subColor ?? '#16A34A', marginTop: 2 }}>{sub}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: TicketStatus }) {
  const { t } = useTranslation('tickets')
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.open
  const label = t(`status.${status}`, { defaultValue: humanizeStatus(status) })
  return (
    <span style={{ background: cfg.bg, color: cfg.text, fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap' }}>
      {label}
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

function Checkbox({ checked, onClick, ariaLabel }: { checked: boolean; onClick: () => void; ariaLabel: string }) {
  return (
    <div
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } }}
      style={{
        width: 15, height: 15, borderRadius: 4, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `2px solid ${checked ? '#028090' : '#CBD5E1'}`,
        background: checked ? '#028090' : '#fff',
        transition: 'background 0.15s, border-color 0.15s',
      }}
    >
      {checked && (
        <svg width="9" height="9" fill="none" stroke="#fff" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </div>
  )
}

const TH_STYLE: CSSProperties = { padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }

function SortableTh({ label, column, filters, onSort }: { label: string; column: TicketSortColumn; filters: TicketsFilters; onSort: (column: TicketSortColumn) => void }) {
  const isActive = filters.sort === column
  const Chevron = !isActive ? IconChevronNeutral : filters.direction === 'asc' ? IconChevronUp : IconChevronDown
  return (
    <th onClick={() => onSort(column)} style={{ ...TH_STYLE, cursor: 'pointer', userSelect: 'none' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {label}
        <Chevron />
      </span>
    </th>
  )
}

const toolbarControlStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.18)',
  borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer',
}

/// ── Pattern Alert Banner ──────────────────────────────────────────────────────

interface PatternAlertPayload {
  type: string
  alert_id: number
  title: string
  severity: string
  description: string
  created_at: string
}

function PatternAlertBanner({ alert, onDismiss }: { alert: PatternAlertPayload; onDismiss: () => void }) {
  const { t } = useTranslation('tickets')
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.2 }}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: '14px 20px',
        background: 'linear-gradient(135deg, #0D1B2A 0%, #1a2f45 100%)',
        border: '1px solid rgba(239,68,68,0.3)',
        borderRadius: 12,
        marginBottom: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 4px 16px rgba(239,68,68,0.1)',
      }}
    >
      <div style={{ paddingTop: 2, flexShrink: 0 }}>
        <div style={{ position: 'relative', width: 10, height: 10 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444' }} />
          <div style={{
            position: 'absolute', inset: -3, borderRadius: '50%',
            border: '2px solid rgba(239,68,68,0.4)',
            animation: 'ping 1.5s ease-in-out infinite',
          }} />
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {t('patternAlert.label')}
          </span>
          <span style={{ fontSize: 11, padding: '1px 8px', borderRadius: 20, background: 'rgba(239,68,68,0.15)', color: '#FCA5A5', fontWeight: 600 }}>
            {alert.severity.toUpperCase()}
          </span>
        </div>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 3 }}>{alert.title}</p>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{alert.description}</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <button
          onClick={onDismiss}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 4px' }}
          aria-label={t('patternAlert.dismiss')}
        >
          ×
        </button>
      </div>

      <style>{`@keyframes ping { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.6);opacity:0} }`}</style>
    </motion.div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function TicketsIndex({ tickets, departments, assignable_agents, stats, filters, pagination }: TicketsIndexProps) {
  const { t } = useTranslation('tickets')
  const departmentName = useDepartmentName()
  const [activeTab, setActiveTab] = useState(filters.status ?? '')
  const [searchQuery, setSearchQuery] = useState(filters.q ?? '')
  const [selectedPriority, setPriority] = useState(filters.priority ?? '')
  const [selectedDept, setDept] = useState(filters.department_id ?? '')
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [patternAlert, setPatternAlert] = useState<PatternAlertPayload | null>(null)
  const alertShownIds = useRef<Set<number>>(new Set())
  const { auth } = usePage<SharedProps>().props
  const canManageTickets = auth.user?.role !== 'employee'
  const isMobile = useWindowWidth() < 640

  useActionCable({ channel: 'TicketsChannel' }, useCallback(() => {
    router.reload({ only: ['tickets', 'stats'] })
  }, []))

  useActionCable({ channel: 'WorkspaceChannel' }, useCallback((data: Record<string, unknown>) => {
    if (data.type !== 'pattern_alert') return
    const alert = data as unknown as PatternAlertPayload
    if (alertShownIds.current.has(alert.alert_id)) return
    alertShownIds.current.add(alert.alert_id)
    setPatternAlert(alert)
  }, []))

  useEffect(() => {
    setSelectedIds(new Set())
  }, [tickets])

  function applyFilters(overrides: Partial<TicketsFilters> = {}) {
    router.get('/tickets', {
      status: overrides.status ?? (activeTab || undefined),
      priority: overrides.priority ?? (selectedPriority || undefined),
      department_id: overrides.department_id ?? (selectedDept || undefined),
      q: overrides.q ?? (searchQuery || undefined),
      sort: overrides.sort ?? filters.sort,
      direction: overrides.direction ?? filters.direction,
    }, { preserveScroll: true, replace: true })
  }

  function handleTabChange(key: string) {
    setActiveTab(key)
    applyFilters({ status: key })
  }

  function handleSort(column: TicketSortColumn) {
    const nextDirection: SortDirection = filters.sort === column && filters.direction === 'desc' ? 'asc' : 'desc'
    applyFilters({ sort: column, direction: nextDirection })
  }

  function toggleRow(id: number) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    setSelectedIds(prev => prev.size === tickets.length ? new Set() : new Set(tickets.map(t => t.id)))
  }

  function runBulkAction(bulkAction: string, value?: string | number) {
    setIsSubmitting(true)
    router.patch('/tickets/bulk_update', {
      bulk_action: bulkAction,
      value,
      ticket_ids: Array.from(selectedIds),
    }, {
      preserveScroll: true,
      onFinish: () => setIsSubmitting(false),
    })
  }

  const tabs = [
    { key: '', label: t('allTickets'), count: pagination.total_count },
    ...(Object.entries(stats.by_status) as Array<[TicketStatus, number]>).map(([status, count]) => ({
      key: status,
      label: t(`status.${status}`, { defaultValue: humanizeStatus(status) }),
      count,
    })),
  ]

  return (
    <AppLayout title={t('title')}>
      <ErrorBoundary section="Tickets">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A' }}>{t('title')}</h1>
            <p style={{ fontSize: 13, color: '#475569', marginTop: 2 }}>{t('subtitle')}</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: '1px solid rgba(15,23,42,0.12)', borderRadius: 8, fontSize: 13, color: '#475569', background: '#fff', cursor: 'pointer' }}>
              {t('export')}
            </button>
            <button
              onClick={() => router.get('/tickets/new')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#028090', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' }}
            >
              {t('newTicket')}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {patternAlert && (
            <PatternAlertBanner
              alert={patternAlert}
              onDismiss={() => setPatternAlert(null)}
            />
          )}
        </AnimatePresence>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
          <StatCard label={t('stats.totalOpen')} value={stats.total_open} sub={t('stats.todayDelta', { count: stats.delta.total_open_today })} />
          <StatCard label={t('stats.inProgress')} value={stats.in_progress} sub={t('stats.lastWeekDelta', { count: stats.delta.in_progress_vs_last_week })} />
          <StatCard label={t('stats.slaBreached')} value={stats.sla_breached} sub={t('stats.criticalDelta', { count: stats.delta.sla_breached_critical })} subColor="#EF4444" />
          <StatCard label={t('stats.resolvedToday')} value={stats.resolved_today} sub={t('stats.avgDelta', { count: stats.delta.resolved_today_vs_avg })} />
          <StatCard label={t('stats.avgResponse')} value={`${stats.avg_response_hours}h`} sub={t('stats.avgMinutesDelta', { count: Math.abs(stats.delta.avg_response_vs_avg_minutes) })} />
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid rgba(15,23,42,0.08)', boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(15,23,42,0.06)', padding: '0 24px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            {tabs.map(tab => {
              const isActive = activeTab === tab.key
              return (
                <button key={tab.key} onClick={() => handleTabChange(tab.key)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 4px', marginRight: 24, fontSize: 13, fontWeight: 500, border: 'none', background: 'none', cursor: 'pointer', borderBottom: isActive ? '2px solid #028090' : '2px solid transparent', color: isActive ? '#028090' : '#475569', transition: 'color 120ms ease' }}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 20, fontWeight: 600, background: isActive ? '#028090' : '#F1F5F9', color: isActive ? '#fff' : '#475569' }}>
                      {tab.count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 24px', borderBottom: '1px solid rgba(15,23,42,0.06)', flexWrap: 'wrap' }}>
            <input
              type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && applyFilters()}
              placeholder={t('searchPlaceholder')}
              style={{ padding: '7px 14px', border: '1px solid rgba(15,23,42,0.12)', borderRadius: 8, fontSize: 13, color: '#0F172A', width: 220, outline: 'none' }}
            />
            <select value={selectedDept} onChange={e => { setDept(e.target.value); applyFilters({ department_id: e.target.value }) }}
              style={{ padding: '7px 12px', border: '1px solid rgba(15,23,42,0.12)', borderRadius: 8, fontSize: 13, color: '#475569', background: '#fff' }}>
              <option value="">{t('filters.category')}</option>
              {departments.map(d => <option key={d.id} value={String(d.id)}>{departmentName(d.name)}</option>)}
            </select>
            <select value={selectedPriority} onChange={e => { setPriority(e.target.value); applyFilters({ priority: e.target.value }) }}
              style={{ padding: '7px 12px', border: '1px solid rgba(15,23,42,0.12)', borderRadius: 8, fontSize: 13, color: '#475569', background: '#fff' }}>
              <option value="">{t('filters.priority')}</option>
              <option value="critical">{t('priority.critical')}</option>
              <option value="high">{t('priority.high')}</option>
              <option value="medium">{t('priority.medium')}</option>
              <option value="low">{t('priority.low')}</option>
            </select>
          </div>

          <AnimatePresence>
            {selectedIds.size > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0D1B2A', padding: '10px 16px' }}>
                  <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{t('bulk.selected', { count: selectedIds.size })}</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select
                      value=""
                      disabled={isSubmitting}
                      onChange={e => { if (e.target.value) runBulkAction('assign', Number(e.target.value)) }}
                      style={toolbarControlStyle}
                    >
                      <option value="" disabled>{t('bulk.assignTo')}</option>
                      {assignable_agents.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
                    </select>
                    <button onClick={() => runBulkAction('resolve')} disabled={isSubmitting} style={toolbarControlStyle}>
                      {t('bulk.resolve')}
                    </button>
                    <select
                      value=""
                      disabled={isSubmitting}
                      onChange={e => { if (e.target.value) runBulkAction('priority', e.target.value) }}
                      style={toolbarControlStyle}
                    >
                      <option value="" disabled>{t('bulk.priorityPlaceholder')}</option>
                      <option value="critical">{t('priority.critical')}</option>
                      <option value="high">{t('priority.high')}</option>
                      <option value="medium">{t('priority.medium')}</option>
                      <option value="low">{t('priority.low')}</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', minWidth: '680px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
                  {canManageTickets && (
                    <th style={{ padding: '10px 12px', width: 36 }} onClick={e => e.stopPropagation()}>
                      <Checkbox
                        checked={tickets.length > 0 && selectedIds.size === tickets.length}
                        onClick={toggleSelectAll}
                        ariaLabel={t('table.selectAll')}
                      />
                    </th>
                  )}
                  {(['id', 'title', 'category', 'department', 'status'] as const).map(key => (
                    <th key={key} style={TH_STYLE}>{t(`table.${key}`)}</th>
                  ))}
                  <SortableTh label={t('table.priority')} column="priority" filters={filters} onSort={handleSort} />
                  {(['assignee', 'sla'] as const).map(key => (
                    <th key={key} style={TH_STYLE}>{t(`table.${key}`)}</th>
                  ))}
                  <SortableTh label={t('table.updated')} column="updated_at" filters={filters} onSort={handleSort} />
                </tr>
              </thead>
              <tbody>
                {tickets.length === 0 ? null : (
                  <AnimatePresence>
                    {tickets.map(ticket => {
                      const CategoryIcon = CATEGORY_ICON_MAP[ticket.category] ?? IconGeneral
                      return (
                        <motion.tr key={ticket.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                          onClick={() => router.get(`/tickets/${ticket.id}`)}
                          style={{ borderBottom: '1px solid rgba(15,23,42,0.05)', cursor: 'pointer' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = '#F8FAFC' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent' }}
                        >
                          {canManageTickets && (
                            <td style={{ padding: '14px 12px' }} onClick={e => e.stopPropagation()}>
                              <Checkbox checked={selectedIds.has(ticket.id)} onClick={() => toggleRow(ticket.id)} ariaLabel={t('table.selectTicket', { ticketNumber: ticket.ticket_number })} />
                            </td>
                          )}
                          <td style={{ padding: '14px 12px' }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#028090', fontFamily: 'monospace' }}>{ticket.ticket_number}</span>
                          </td>
                          <td style={{ padding: '14px 12px', maxWidth: 220 }}>
                            <p style={{ fontSize: 13, fontWeight: 500, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ticket.title}</p>
                            <p style={{ fontSize: 12, color: '#A3ACBA', marginTop: 2 }}>{ticket.created_by.full_name}</p>
                          </td>
                          <td style={{ padding: '14px 12px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569' }}>
                              <CategoryIcon />
                              {t(`category.${ticket.category}`)}
                            </span>
                          </td>
                          <td style={{ padding: '14px 12px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#475569' }}>
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: ticket.department.color, flexShrink: 0 }} />
                              {departmentName(ticket.department.name)}
                            </span>
                          </td>
                          <td style={{ padding: '14px 12px' }}><StatusBadge status={ticket.status} /></td>
                          <td style={{ padding: '14px 12px' }}>
                            <span style={{ fontSize: 13, fontWeight: 500, color: PRIORITY_CFG[ticket.priority]?.color }}>
                              {t(`priority.${ticket.priority}`)}
                            </span>
                          </td>
                          <td style={{ padding: '14px 12px' }}>
                            {ticket.assigned_to ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Avatar name={ticket.assigned_to.full_name} />
                                <span style={{ fontSize: 13, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 80 }}>{ticket.assigned_to.full_name}</span>
                              </div>
                            ) : <span style={{ fontSize: 13, color: '#A3ACBA', fontStyle: 'italic' }}>{t('table.unassigned')}</span>}
                          </td>
                          <td style={{ padding: '14px 12px' }}>{formatSlaTime(ticket.sla_remaining_seconds, ticket.sla_status, t)}</td>
                          <td style={{ padding: '14px 12px' }}>
                            <span style={{ fontSize: 13, color: '#A3ACBA' }}>{formatRelative(ticket.updated_at, t)}</span>
                          </td>
                        </motion.tr>
                      )
                    })}
                  </AnimatePresence>
                )}
              </tbody>
            </table>
          </div>
          {tickets.length === 0 && (
            <EmptyState icon={<IconEmptyTicket />} title={t('empty.title')} description={t('empty.description')} action={{ label: t('empty.action'), onClick: () => router.get('/tickets/new') }} />
          )}
          {pagination.total_pages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', borderTop: '1px solid rgba(15,23,42,0.06)' }}>
              <p style={{ fontSize: 13, color: '#475569' }}>
                {t('pagination.showing', {
                  from: ((pagination.current_page - 1) * 10) + 1,
                  to: Math.min(pagination.current_page * 10, pagination.total_count),
                  total: pagination.total_count,
                })}
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