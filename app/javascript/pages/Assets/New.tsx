import { useState } from 'react'
import { router } from '@inertiajs/react'
import { Laptop, Monitor, Server, Smartphone, Package } from 'lucide-react'
import AppLayout from '@/components/AppLayout'
import DatePicker from '@/components/DatePicker'

interface Department { id: number; name: string }
interface UserOption  { id: number; name: string }

interface Props {
  departments: Department[]
  users:       UserOption[]
}

const ASSET_TYPES = [
  { value: 'laptop',   label: 'Laptop',   icon: Laptop },
  { value: 'desktop',  label: 'Desktop',  icon: Monitor },
  { value: 'server',   label: 'Server',   icon: Server },
  { value: 'monitor',  label: 'Monitor',  icon: Monitor },
  { value: 'phone',    label: 'Phone',    icon: Smartphone },
  { value: 'other',    label: 'Other',    icon: Package },
]

const CONDITIONS = ['Excellent', 'Good', 'Fair', 'Poor']

export default function AssetsNew({ departments, users }: Props) {
  const [assetType,    setAssetType]    = useState('')
  const [name,         setName]         = useState('')
  const [modelSpec,    setModelSpec]    = useState('')
  const [serial,       setSerial]       = useState('')
  const [purchaseDate, setPurchaseDate] = useState('')
  const [price,        setPrice]        = useState('')
  const [warrantyDate, setWarrantyDate] = useState('')
  const [assignedTo,   setAssignedTo]   = useState('')
  const [department,   setDepartment]   = useState('')
  const [condition,    setCondition]    = useState('Excellent')
  const [notes,        setNotes]        = useState('')
  const [submitting,   setSubmitting]   = useState(false)

  const handleSubmit = () => {
    if (!assetType || !name) return
    setSubmitting(true)
    router.post('/inventory', {
      asset: {
        asset_type:              assetType,
        name,
        model_spec:              modelSpec,
        serial_number:           serial,
        purchase_date:           purchaseDate,
        purchase_price:          price,
        warranty_expires_at:     warrantyDate,
        assigned_to_id:          assignedTo,
        department_id:           department,
        condition_at_assignment: condition,
        notes,
      }
    }, { onFinish: () => setSubmitting(false) })
  }

  return (
    <AppLayout title="Add Asset">
      <div style={{ maxWidth: '700px' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0F172A', margin: '0 0 4px' }}>Add Asset</h1>
          <p style={{ color: '#475569', fontSize: '14px', margin: 0 }}>Register a new asset to the inventory</p>
        </div>

        {/* Asset Type selector */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', marginBottom: '20px' }}>
          <label style={labelStyle}>Asset Type</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
            {ASSET_TYPES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setAssetType(value)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '12px 16px', borderRadius: '10px', cursor: 'pointer',
                  border: `2px solid ${assetType === value ? '#028090' : '#E2E8F0'}`,
                  background: assetType === value ? '#F0FDFA' : '#fff',
                  transition: 'all 0.15s',
                }}
              >
                <Icon size={20} color={assetType === value ? '#028090' : '#64748B'} />
                <span style={{ fontSize: '14px', fontWeight: 600, color: assetType === value ? '#028090' : '#475569' }}>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Form fields */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', marginBottom: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Field label="Asset Name *">
              <input value={name} onChange={e => setName(e.target.value)} placeholder='MacBook Pro 16" M3' style={inputStyle} />
            </Field>

            <Field label="Model / Specification">
              <input value={modelSpec} onChange={e => setModelSpec(e.target.value)} placeholder="MacBook Pro 16&quot; M3 Pro" style={inputStyle} />
            </Field>

            <Field label="Serial Number">
              <input value={serial} onChange={e => setSerial(e.target.value)} placeholder="MBP-2024-M3-0142" style={{ ...inputStyle, fontFamily: 'monospace' }} />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <Field label="Purchase Date">
                <DatePicker value={purchaseDate} onChange={setPurchaseDate} />
              </Field>
              <Field label="Purchase Price">
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: '14px' }}>$</span>
                  <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" style={{ ...inputStyle, paddingLeft: '28px' }} />
                </div>
              </Field>
            </div>

            <Field label="Warranty Expiry Date">
              <DatePicker value={warrantyDate} onChange={setWarrantyDate} minDate={purchaseDate ? new Date(purchaseDate) : undefined} />
              <p style={{ fontSize: '12px', color: '#028090', margin: '6px 0 0' }}>
                Warranty alerts will be sent 30, 15, and 7 days before expiry
              </p>
            </Field>

            <Field label="Assign To">
              <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)} style={inputStyle}>
                <option value="">Select employee...</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </Field>

            <Field label="Department">
              <select value={department} onChange={e => setDepartment(e.target.value)} style={inputStyle}>
                <option value="">Select department...</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </Field>

            <Field label="Initial Condition">
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {CONDITIONS.map(c => (
                  <label key={c} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="radio" checked={condition === c} onChange={() => setCondition(c)} style={{ accentColor: '#028090' }} />
                    <span style={{ fontSize: '14px', color: '#475569' }}>{c}</span>
                  </label>
                ))}
              </div>
            </Field>

            <Field label="Notes (optional)">
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Any additional notes..." style={{ ...inputStyle, resize: 'vertical' }} />
            </Field>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={handleSubmit}
            disabled={submitting || !assetType || !name}
            style={{ width: '100%', padding: '14px', borderRadius: '10px', background: submitting || !assetType || !name ? '#CBD5E1' : '#028090', color: '#fff', fontWeight: 700, fontSize: '15px', border: 'none', cursor: submitting || !assetType || !name ? 'not-allowed' : 'pointer', transition: 'background 0.15s' }}
          >
            {submitting ? 'Adding to Inventory...' : 'Add to Inventory'}
          </button>
          <button onClick={() => router.visit('/inventory')} style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'transparent', color: '#94A3B8', fontWeight: 500, fontSize: '14px', border: 'none', cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </div>
    </AppLayout>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '13px', fontWeight: 600,
  color: '#374151', marginBottom: '6px',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: '10px',
  border: '1px solid #E2E8F0', fontSize: '14px', color: '#0F172A',
  outline: 'none', boxSizing: 'border-box', background: '#fff',
}