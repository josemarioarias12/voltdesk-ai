import { useState } from 'react'
import { router } from '@inertiajs/react'
import AppLayout from '@/components/AppLayout'
import SettingsTabs from '@/components/SettingsTabs'

interface ApiKey {
  id: number
  name: string
  scopes: string[]
  masked_key: string
  last_used_at: string | null
  created_at: string
  active: boolean
  created_by: string | null
}

interface Props {
  api_keys: ApiKey[]
  new_token?: string
}

const AVAILABLE_SCOPES = [
  'tickets:create',
  'tickets:read',
  'tickets:delete',
  'assets:read',
  'hr:read',
  'hr:write',
]

const TEAL  = '#028090'
const SLATE = '#1E293B'
const GRAY  = '#475569'
const LIGHT = '#F8FAFC'
const BORDER = '#E2E8F0'

export default function ApiKeysIndex({ api_keys, new_token }: Props) {
  const [showModal, setShowModal]   = useState(false)
  const [name, setName]             = useState('')
  const [scopes, setScopes]         = useState<string[]>(['tickets:read'])
  const [creating, setCreating]     = useState(false)
  const [copied, setCopied]         = useState(false)
  const [tokenVisible, setTokenVisible] = useState(!!new_token)

  function toggleScope(scope: string) {
    setScopes(prev =>
      prev.includes(scope) ? prev.filter(s => s !== scope) : [...prev, scope]
    )
  }

  function handleCreate() {
    if (!name.trim()) return
    setCreating(true)
    router.post('/settings/api_keys', { api_key: { name, scopes } }, {
      onFinish: () => { setCreating(false); setShowModal(false); setName(''); setScopes(['tickets:read']) },
    })
  }

  function handleRevoke(id: number) {
    if (!confirm('Revoke this API key? This action cannot be undone.')) return
    router.delete(`/settings/api_keys/${id}`)
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function formatDate(iso: string | null) {
    if (!iso) return 'Never'
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <AppLayout title="API Keys">
      <div className="max-w-4xl space-y-6">

        <SettingsTabs active="api_keys" />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: SLATE }}>API Keys</h1>
            <p className="text-sm mt-1" style={{ color: GRAY }}>Manage external integrations and API access</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: TEAL }}
          >
            + Create API Key
          </button>
        </div>

        {/* New token banner — shown only once */}
        {tokenVisible && new_token && (
          <div className="rounded-2xl border-2 p-5 space-y-3" style={{ borderColor: TEAL, background: '#F0FDFA' }}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold" style={{ color: TEAL }}>
                ✓ Your new API key — copy it now, it won't be shown again
              </p>
              <button onClick={() => setTokenVisible(false)} className="text-xs" style={{ color: GRAY }}>Dismiss</button>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#fff', border: `1px solid ${TEAL}` }}>
              <code className="flex-1 text-sm font-mono break-all" style={{ color: SLATE }}>{new_token}</code>
              <button
                onClick={() => handleCopy(new_token)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white flex-shrink-0"
                style={{ background: copied ? '#16A34A' : TEAL }}
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-xs" style={{ color: '#DC2626' }}>
              ⚠ Store this key securely. You will not be able to see it again.
            </p>
          </div>
        )}

        {/* Info banner */}
        <div className="px-4 py-3 rounded-xl text-sm" style={{ background: '#F0FDFA', border: `1px solid #99F6E4`, color: TEAL }}>
          API keys allow external systems to create tickets and access data. Each key has configurable scopes.
        </div>

        {/* Keys table */}
        <div className="rounded-2xl border overflow-hidden" style={{ background: '#fff', borderColor: BORDER, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: LIGHT, borderBottom: `1px solid ${BORDER}` }}>
                {['Name', 'Key', 'Scopes', 'Last Used', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold" style={{ color: GRAY }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {api_keys.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm" style={{ color: GRAY }}>
                    No API keys yet. Create one to start integrating.
                  </td>
                </tr>
              ) : api_keys.map((key, i) => (
                <tr key={key.id} style={{ borderBottom: `1px solid ${BORDER}`, opacity: key.active ? 1 : 0.5, background: i % 2 === 0 ? '#fff' : LIGHT }}>
                  <td className="px-4 py-3 font-medium" style={{ color: SLATE }}>{key.name}</td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: GRAY }}>{key.masked_key}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {key.scopes.map(s => (
                        <span key={s} className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: '#F0FDFA', color: TEAL }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: GRAY }}>{formatDate(key.last_used_at)}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 text-xs font-medium">
                      <span className="w-2 h-2 rounded-full" style={{ background: key.active ? '#16A34A' : '#94A3B8' }} />
                      {key.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {key.active && (
                      <button
                        onClick={() => handleRevoke(key.id)}
                        className="text-xs font-medium px-3 py-1 rounded-lg"
                        style={{ color: '#DC2626', background: '#FEF2F2' }}
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Create Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
            <div className="rounded-2xl p-6 w-full max-w-md space-y-5" style={{ background: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold" style={{ color: SLATE }}>Create API Key</h2>
                <button onClick={() => setShowModal(false)} className="text-lg" style={{ color: GRAY }}>✕</button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: SLATE }}>Key Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Slack Integration"
                  className="w-full px-3 py-2 rounded-xl border text-sm"
                  style={{ borderColor: BORDER, color: SLATE }}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: SLATE }}>Scopes</label>
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABLE_SCOPES.map(s => (
                    <label key={s} className="flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer text-sm"
                      style={{ borderColor: scopes.includes(s) ? TEAL : BORDER, background: scopes.includes(s) ? '#F0FDFA' : LIGHT }}>
                      <input
                        type="checkbox"
                        checked={scopes.includes(s)}
                        onChange={() => toggleScope(s)}
                        className="accent-teal-600"
                      />
                      <span style={{ color: scopes.includes(s) ? TEAL : GRAY }}>{s}</span>
                    </label>
                  ))}
                </div>
              </div>

              <p className="text-xs" style={{ color: GRAY }}>Rate limit: 100 requests per minute</p>

              <button
                onClick={handleCreate}
                disabled={creating || !name.trim()}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: creating || !name.trim() ? '#94A3B8' : TEAL }}
              >
                {creating ? 'Creating...' : 'Create Key'}
              </button>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  )
}