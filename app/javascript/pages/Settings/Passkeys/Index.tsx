import { useState } from 'react'
import { router } from '@inertiajs/react'
import AppLayout from '@/components/AppLayout'
import SettingsTabs from '@/components/SettingsTabs'
import { useWebAuthn } from '@/hooks/useWebAuthn'
import { IconFaceId } from '@/components/Icons'

interface PasskeyCredential {
  id: number
  nickname: string | null
  last_used_at: string | null
  created_at: string
}

interface Props {
  credentials: PasskeyCredential[]
}

const TEAL   = '#028090'
const SLATE  = '#1E293B'
const GRAY   = '#475569'
const LIGHT  = '#F8FAFC'
const BORDER = '#E2E8F0'

function formatDate(iso: string | null) {
  if (!iso) return 'Never'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function PasskeysIndex({ credentials }: Props) {
  const { isSupported, status, errorMessage, registerPasskey } = useWebAuthn()
  const [nickname, setNickname] = useState('')

  async function handleAdd() {
    const label = nickname.trim() || undefined
    const success = await registerPasskey(label)

    if (success) {
      setNickname('')
      router.reload({ only: ['credentials'] })
    }
  }

  function handleRevoke(id: number) {
    if (!confirm('Remove this passkey? You will no longer be able to sign in with this device using Face ID.')) return
    router.delete(`/settings/passkeys/${id}`)
  }

  return (
    <AppLayout title="Passkeys">
      <div className="max-w-4xl space-y-6">

        <SettingsTabs active="passkeys" />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: SLATE }}>Passkeys</h1>
            <p className="text-sm mt-1" style={{ color: GRAY }}>Sign in with Face ID, Touch ID, or Windows Hello instead of your password</p>
          </div>
        </div>

        {!isSupported && (
          <div className="px-4 py-3 rounded-xl text-sm" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}>
            This browser or device doesn't support passkeys. Try again from a device with Face ID, Touch ID, or Windows Hello.
          </div>
        )}

        {isSupported && (
          <div className="rounded-2xl border p-5 space-y-3" style={{ background: '#fff', borderColor: BORDER, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
            <div className="flex items-center gap-2">
              <IconFaceId size={20} color={TEAL} />
              <h2 className="text-sm font-semibold" style={{ color: SLATE }}>Add a new passkey</h2>
            </div>
            <div className="flex gap-3">
              <input
                type="text"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                placeholder="e.g. My iPhone"
                className="flex-1 px-3 py-2 rounded-xl border text-sm"
                style={{ borderColor: BORDER, color: SLATE }}
              />
              <button
                onClick={handleAdd}
                disabled={status === 'in_progress'}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white flex-shrink-0"
                style={{ background: status === 'in_progress' ? '#94A3B8' : TEAL }}
              >
                {status === 'in_progress' ? 'Waiting for Face ID…' : 'Activate Face ID'}
              </button>
            </div>
            {errorMessage && (
              <p className="text-xs" style={{ color: '#DC2626' }}>Could not add passkey — try again</p>
            )}
          </div>
        )}

        <div className="rounded-2xl border overflow-hidden" style={{ background: '#fff', borderColor: BORDER, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: LIGHT, borderBottom: `1px solid ${BORDER}` }}>
                {['Device', 'Added', 'Last Used', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold" style={{ color: GRAY }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {credentials.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-sm" style={{ color: GRAY }}>
                    No passkeys yet. Activate Face ID above to sign in without a password.
                  </td>
                </tr>
              ) : credentials.map((cred, i) => (
                <tr key={cred.id} style={{ borderBottom: `1px solid ${BORDER}`, background: i % 2 === 0 ? '#fff' : LIGHT }}>
                  <td className="px-4 py-3 font-medium" style={{ color: SLATE }}>
                    <div className="flex items-center gap-2">
                      <IconFaceId size={16} color={TEAL} />
                      {cred.nickname || 'Unnamed passkey'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: GRAY }}>{formatDate(cred.created_at)}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: GRAY }}>{formatDate(cred.last_used_at)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleRevoke(cred.id)}
                      className="text-xs font-medium px-3 py-1 rounded-lg"
                      style={{ color: '#DC2626', background: '#FEF2F2' }}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </AppLayout>
  )
}