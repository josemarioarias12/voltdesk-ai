import { useState } from 'react'
import { Link, router } from '@inertiajs/react'
import { Laptop, Monitor, Server, Smartphone, Package } from 'lucide-react'
import AppLayout from '@/components/AppLayout'
import EmptyState from '@/components/EmptyState'

interface Asset {
  id: number
  asset_number: string
  name: string
  model_spec: string | null
  serial_number: string | null
  asset_type: string
  status: string
  risk_score: number
  warranty_expires_at: string | null
  assigned_to: { id: number; name: string } | null
  department: { id: number; name: string } | null
  updated_at: string
}

interface Summary {
  total: number
  high_risk: number
  in_maintenance: number
  warranty_expiring: number
}

interface Props {
  assets: Asset[]
  summary: Summary
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  active:         { bg: '#F0FDF4', color: '#15803D' },
  in_maintenance: { bg: '#FFF7ED', color: '#C2410C' },
  retired:        { bg: '#F8FAFC', color: '#475569' },
  lost:           { bg: '#FEF2F2', color: '#DC2626' },
}

function TypeIcon({ type }: { type: string }) {
  const props = { size: 20, color: '#64748B' }
  switch (type) {
    case 'laptop':   return <Laptop {...props} />
    case 'desktop':  return <Monitor {...props} />
    case 'server':   return <Server {...props} />
    case 'monitor':  return <Monitor {...props} />
    case 'phone':    return <Smartphone {...props} />
    default:         return <Package {...props} />
  }
}

function RiskBar({ score }: { score: number }) {
  const color = score > 70 ? '#EF4444' : score > 40 ? '#F97316' : '#16A34A'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ flex: 1, height: '6px', borderRadius: '999px', background: '#F1F5F9', overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius:'999px' }} />
      </div>
      <span style={{ fontSize: '13px', fontWeight: 700, color, minWidth: '28px' }}>{score}</span>
    </div>
  )
}

function WarrantyCell({ date }: { date: string | null }) {
  if (!date) return <span style={{ color: '#94A3B8', fontSize: '13px' }}>—</span>
  const days = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000)
  const color = days <= 30 ? '#EF4444' : '#475569'
  return (
    <span style={{ fontSize: '13px', color, fontWeight: days <= 30 ? 700 : 400 }}>
      {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      {days <= 30 && <span style={{ marginLeft: '4px', fontSize: '11px' }}>({days}d)</span>}
    </span>
  )
}

export default function AssetsIndex({ assets, summary }: Props) {
  const [search, setSearch]         = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatus]   = useState('')
  const [riskFilter, setRisk]       = useState('')

  const filtered = assets.filter(a => {
    const matchSearch = search === '' ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      (a.serial_number ?? '').toLowerCase().includes(search.toLowerCase()) ||
      a.asset_number.toLowerCase().includes(search.toLowerCase())
    const matchType   = typeFilter === '' || a.asset_type === typeFilter
    const matchStatus = statusFilter === '' || a.status === statusFilter
    const matchRisk   = riskFilter === '' ||
      (riskFilter === 'high'   && a.risk_score > 70) ||
      (riskFilter === 'medium' && a.risk_score > 40 && a.risk_score <= 70) ||
      (riskFilter === 'low'    && a.risk_score <= 40)
    return matchSearch && matchType && matchStatus && matchRisk
  })

  return (
    <AppLayout title="Asset Inventory">
      <div style={{ maxWidth: '1200px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0F172A', margin: '0 0 4px' }}>Asset Inventory</h1>
            <p style={{ color: '#475569', fontSize: '14px', margin: 0 }}>Track and manage all company hardware and software</p>
          </div>
          <Link href="/inventory/new" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 20px', borderRadius: '10px', background: '#028090', color: '#fff', fontWeight: 600, fontSize: '14px', textDecoration: 'none' }}>
            + Add Asset
          </Link>
        </div>

        {/* KPI cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <KpiCard label="Total Assets"            value={summary.total}             color="#028090" />
          <KpiCard label="High Risk (score >70)"   value={summary.high_risk}         color="#EF4444" />
          <KpiCard label="In Maintenance"          value={summary.in_maintenance}    color="#F97316" />
          <KpiCard label="Warranties Expiring (30d)" value={summary.warranty_expiring} color="#F97316" />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap'}}>
          <input
            placeholder="Search assets..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: '1', minWidth: '200px', padding: '8px 14px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '14px', color: '#0F172A', outline: 'none' }}
          />
          {[
            { value: typeFilter, setter: setTypeFilter, placeholder: 'Asset Type', options: ['laptop','desktop','server','monitor','phone','software','other'] },
            { value: statusFilter, setter: setStatus, placeholder: 'Status', options: ['active','in_maintenance','retired','lost'] },
            { value: riskFilter, setter: setRisk, placeholder: 'Risk Level', options: ['high','medium','low'] },
          ].map(({ value, setter, placeholder, options }) => (
            <select
              key={placeholder}
              value={value}
              onChange={e => setter(e.target.value)}
              style={{ padding: '8px 14px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '14px', color: value ? '#0F172A' : '#94A3B8', background: '#fff', cursor: 'pointer',outline: 'none' }}
            >
              <option value="">{placeholder}</option>
              {options.map(o => <option key={o} value={o}>{o.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
            </select>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                {['Asset', 'Serial Number', 'Assigned To', 'Department', 'Status', 'Risk Score', 'Warranty', 'Last Updated'].map(h => (
                  <th key={h} style={{ textAlign: 'left', fontSize: '11px', color: '#94A3B8', fontWeight: 600, padding: '12px 16px', borderBottom: '1px solid #F1F5F9', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8}><EmptyState title="No assets found" description="Try adjusting your filters or register a new asset." /></td></tr>
              ) : filtered.map(asset => (
                <tr
                  key={asset.id}
                  onClick={() => router.visit(`/inventory/${asset.id}`)}
                  style={{ borderBottom: '1px solid #F8FAFC', cursor: 'pointer', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <TypeIcon type={asset.asset_type} />
                      <div>
                        <p style={{ fontSize: '14px', color: '#0F172A', fontWeight: 500, margin: '0 0 2px' }}>{asset.name}</p>
                        <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>{asset.asset_number}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '13px', color: '#475569' }}>{asset.serial_number ?? '—'}</span>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#475569' }}>{asset.assigned_to?.name ?? <span style={{ color: '#CBD5E1' }}>Unassigned</span>}</td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#475569' }}>{asset.department?.name ?? '—'}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, padding: '3px 10px',borderRadius: '999px', background: STATUS_STYLE[asset.status]?.bg ?? '#F8FAFC', color: STATUS_STYLE[asset.status]?.color ?? '#475569', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
                      {asset.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', minWidth: '120px' }}><RiskBar score={asset.risk_score} /></td>
                  <td style={{ padding: '14px 16px' }}><WarrantyCell date={asset.warranty_expires_at} /></td>
                  <td style={{ padding: '14px 16px', fontSize: '12px', color: '#94A3B8', whiteSpace: 'nowrap' }}>
                    {new Date(asset.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

function KpiCard({ label, value, color }: { label: string; value: number; color: string }){
  return (
    <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
      <p style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px', fontWeight: 600 }}>{label}</p>
      <p style={{ fontSize: '28px', fontWeight: '700', color, margin: 0 }}>{value}</p>
    </div>
  )
}