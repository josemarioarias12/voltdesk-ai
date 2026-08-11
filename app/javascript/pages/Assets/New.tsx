import { useState } from 'react'
import { router } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
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
  { value: 'laptop',   nsKey: 'laptop',  icon: Laptop },
  { value: 'desktop',  nsKey: 'desktop', icon: Monitor },
  { value: 'server',   nsKey: 'server',  icon: Server },
  { value: 'monitor',  nsKey: 'monitor', icon: Monitor },
  { value: 'phone',    nsKey: 'phone',   icon: Smartphone },
  { value: 'other',    nsKey: 'other',   icon: Package },
]

const CONDITIONS = [
  { value: 'Excellent', nsKey: 'excellent' },
  { value: 'Good',      nsKey: 'good' },
  { value: 'Fair',      nsKey: 'fair' },
  { value: 'Poor',      nsKey: 'poor' },
]

export default function AssetsNew({ departments, users }: Props) {
  const { t } = useTranslation(['assets'])
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
    <AppLayout title={t('assets:new.pageTitle')}>
      <div style={{ maxWidth: '700px' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0F172A', margin: '0 0 4px' }}>{t('assets:new.pageTitle')}</h1>
          <p style={{ color: '#475569', fontSize: '14px', margin: 0 }}>{t('assets:new.subtitle')}</p>
        </div>

        {/* Asset Type selector */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', marginBottom: '20px' }}>
          <label style={labelStyle}>{t('assets:new.assetTypeLabel')}</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
            {ASSET_TYPES.map(({ value, nsKey, icon: Icon }) => (
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
                <span style={{ fontSize: '14px', fontWeight: 600, color: assetType === value ? '#028090' : '#475569' }}>{t(`assets:assetType.${nsKey}`)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Form fields */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', marginBottom: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Field label={t('assets:new.fields.assetName')}>
              <input value={name} onChange={e => setName(e.target.value)} placeholder='MacBook Pro 16" M3' style={inputStyle} />
            </Field>

            <Field label={t('assets:new.fields.modelSpec')}>
              <input value={modelSpec} onChange={e => setModelSpec(e.target.value)} placeholder="MacBook Pro 16&quot; M3 Pro" style={inputStyle} />
            </Field>

            <Field label={t('assets:new.fields.serialNumber')}>
              <input value={serial} onChange={e => setSerial(e.target.value)} placeholder="MBP-2024-M3-0142" style={{ ...inputStyle, fontFamily: 'monospace' }} />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <Field label={t('assets:new.fields.purchaseDate')}>
                <DatePicker value={purchaseDate} onChange={setPurchaseDate} />
              </Field>
              <Field label={t('assets:new.fields.purchasePrice')}>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: '14px' }}>$</span>
                  <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" style={{ ...inputStyle, paddingLeft: '28px' }} />
                </div>
              </Field>
            </div>

            <Field label={t('assets:new.fields.warrantyExpiryDate')}>
              <DatePicker value={warrantyDate} onChange={setWarrantyDate} minDate={purchaseDate ? new Date(purchaseDate) : undefined} />
              <p style={{ fontSize: '12px', color: '#028090', margin: '6px 0 0' }}>
                {t('assets:new.fields.warrantyHint')}
              </p>
            </Field>

            <Field label={t('assets:new.fields.assignTo')}>
              <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)} style={inputStyle}>
                <option value="">{t('assets:new.fields.selectEmployee')}</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </Field>

            <Field label={t('assets:new.fields.department')}>
              <select value={department} onChange={e => setDepartment(e.target.value)} style={inputStyle}>
                <option value="">{t('assets:new.fields.selectDepartment')}</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </Field>

            <Field label={t('assets:new.fields.initialCondition')}>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {CONDITIONS.map(({ value, nsKey }) => (
                  <label key={value} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="radio" checked={condition === value} onChange={() => setCondition(value)} style={{accentColor: '#028090' }} />
                    <span style={{ fontSize: '14px', color: '#475569' }}>{t(`assets:condition.${nsKey}`)}</span>
                  </label>
                ))}
              </div>
            </Field>

            <Field label={t('assets:new.fields.notes')}>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder={t('assets:new.fields.notesPlaceholder')} style={{ ...inputStyle, resize: 'vertical' }} />
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
            {submitting ? t('assets:new.submitting') : t('assets:new.submit')}
          </button>
          <button onClick={() => router.visit('/inventory')} style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'transparent', color: '#94A3B8', fontWeight: 500, fontSize: '14px', border: 'none', cursor: 'pointer' }}>
            {t('assets:new.cancel')}
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