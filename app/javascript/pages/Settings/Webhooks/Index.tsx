import { useState } from 'react'
import { router } from '@inertiajs/react'
import AppLayout from '@/components/AppLayout'
import SettingsTabs from '@/components/SettingsTabs'

interface Webhook {
  id: number
  name: string
  url: string
  events: string[]
  active: boolean
  failure_count: number
  last_triggered_at: string | null
  created_at: string
}

interface Props {
  webhooks: Webhook[]
  supported_events: string[]
  new_secret?: string
}

const TEAL   = '#028090'
const SLATE  = '#0F172A'
const GRAY   = '#475569'
const LIGHT  = '#F8FAFC'
const BORDER = '#E2E8F0'

const EVENT_LABELS: Record<string, string> = {
  'ticket.created':  '🎫 ticket.created',
  'ticket.resolved': '✅ ticket.resolved',
  'agent.executed':  '🤖 agent.executed',
  'sla.breached':    '⚠️ sla.breached',
}

export default function WebhooksIndex({ webhooks, supported_events, new_secret }: Props) {
  const [showModal, setShowModal]       = useState(false)
  const [name, setName]                 = useState('')
  const [url, setUrl]                   = useState('')
  const [events, setEvents]             = useState<string[]>(['ticket.created'])
  const [creating, setCreating]         = useState(false)
  const [secretVisible, setSecretVisible] = useState(!!new_secret)
  const [copied, setCopied]             = useState(false)

  function toggleEvent(event: string) {
    setEvents(prev =>
      prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]
    )
  }

  function handleCreate() {
    if (!name.trim() || !url.trim()) return
    setCreating(true)
    router.post('/settings/webhooks', { webhook: { name, url, events } }, {
      onFinish: () => { setCreating(false); setShowModal(false); setName(''); setUrl(''); setEvents(['ticket.created']) },
    })
  }

  function handleDelete(id: number) {
    if (!confirm('Delete this webhook? This action cannot be undone.')) return
    router.delete(`/settings/webhooks/${id}`)
  }

  function handleToggle(id: number) {
    router.patch(`/settings/webhooks/${id}/toggle`)
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function formatDate(iso: string | null) {
    if (!iso) return 'Never'
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  function statusColor(webhook: Webhook) {
    if (!webhook.active) return '#94A3B8'
    if (webhook.failure_count >= 2) return '#F59E0B'
    return '#16A34A'
  }

  function statusLabel(webhook: Webhook) {
    if (!webhook.active) return 'Inactive'
    if (webhook.failure_count >= 2) return `Warning (${webhook.failure_count} failures)`
    return 'Active'
  }

  return (
    <AppLayout title="Webhooks">
      <div className="max-w-4xl space-y-6">

        <SettingsTabs active="webhooks" />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: SLATE }}>Webhooks</h1>
            <p className="text-sm mt-1" style={{ color: GRAY }}>
              Receive real-time notifications when events occur in your workspace
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: TEAL }}
          >
            + Add Webhook
          </button>
        </div>

        {/* New secret banner */}
        {secretVisible && new_secret && (
          <div className="rounded-2xl border-2 p-5 space-y-3" style={{ borderColor: TEAL, background: '#F0FDFA' }}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold" style={{ color: TEAL }}>
                ✓ Webhook secret — copy it now, it won't be shown again
              </p>
              <button onClick={() => setSecretVisible(false)} className="text-xs" style={{ color: GRAY }}>Dismiss</button>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#fff', border: `1px solid ${TEAL}` }}>
              <code className="flex-1 text-sm font-mono break-all" style={{ color: SLATE }}>{new_secret}</code>
              <button
                onClick={() => handleCopy(new_secret)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white flex-shrink-0"
                style={{ background: copied ? '#16A34A' : TEAL }}
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-xs" style={{ color: GRAY }}>
              Use this secret to verify the <code className="font-mono">X-VoltDesk-Signature</code> header in your endpoint.
            </p>
          </div>
        )}

        {/* Webhooks table */}
        <div className="rounded-2xl border overflow-hidden" style={{ background: '#fff', borderColor: BORDER, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: LIGHT, borderBottom: `1px solid ${BORDER}` }}>
                {['Name', 'URL', 'Events', 'Last Triggered', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold" style={{ color: GRAY }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {webhooks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm" style={{ color: GRAY }}>
                    No webhooks configured. Add one to start receiving events.
                  </td>
                </tr>
              ) : webhooks.map((wh, i) => (
                <tr key={wh.id} style={{ borderBottom: `1px solid ${BORDER}`, background: i % 2 === 0 ? '#fff' : LIGHT, opacity: wh.active ? 1 : 0.6 }}>
                  <td className="px-4 py-3 font-medium" style={{ color: SLATE }}>{wh.name}</td>
                  <td className="px-4 py-3 font-mono text-xs max-w-[180px] truncate" style={{ color: GRAY }} title={wh.url}>{wh.url}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {wh.events.map(e => (
                        <span key={e} className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: '#F0FDFA', color: TEAL }}>
                          {e}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: GRAY }}>{formatDate(wh.last_triggered_at)}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 text-xs font-medium">
                      <span className="w-2 h-2 rounded-full" style={{ background: statusColor(wh) }} />
                      <span style={{ color: statusColor(wh) }}>{statusLabel(wh)}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggle(wh.id)}
                        className="text-xs font-medium px-3 py-1 rounded-lg"
                        style={{ color: wh.active ? GRAY : TEAL, background: wh.active ? LIGHT : '#F0FDFA' }}
                      >
                        {wh.active ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => handleDelete(wh.id)}
                        className="text-xs font-medium px-3 py-1 rounded-lg"
                        style={{ color: '#DC2626', background: '#FEF2F2' }}
                      >
                        Delete
                      </button>
                    </div>
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
                <h2 className="text-lg font-bold" style={{ color: SLATE }}>Add Webhook</h2>
                <button onClick={() => setShowModal(false)} className="text-lg" style={{ color: GRAY }}>✕</button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: SLATE }}>Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Slack Notifications"
                  className="w-full px-3 py-2 rounded-xl border text-sm"
                  style={{ borderColor: BORDER, color: SLATE }}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: SLATE }}>Endpoint URL</label>
                <input
                  type="url"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://your-server.com/webhook"
                  className="w-full px-3 py-2 rounded-xl border text-sm font-mono"
                  style={{ borderColor: BORDER, color: SLATE }}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: SLATE }}>Events</label>
                <div className="space-y-2">
                  {supported_events.map(e => (
                    <label key={e} className="flex items-center gap-3 px-3 py-2 rounded-xl border cursor-pointer text-sm"
                      style={{ borderColor: events.includes(e) ? TEAL : BORDER, background: events.includes(e) ? '#F0FDFA' : LIGHT }}>
                      <input
                        type="checkbox"
                        checked={events.includes(e)}
                        onChange={() => toggleEvent(e)}
                        className="accent-teal-600"
                      />
                      <span className="font-mono" style={{ color: events.includes(e) ? TEAL : GRAY }}>
                        {EVENT_LABELS[e] ?? e}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={handleCreate}
                disabled={creating || !name.trim() || !url.trim() || events.length === 0}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: creating || !name.trim() || !url.trim() ? '#94A3B8' : TEAL }}
              >
                {creating ? 'Creating...' : 'Add Webhook'}
              </button>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  )
}