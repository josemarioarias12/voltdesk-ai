import { useState } from 'react'
import { router } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
import AppLayout from '@/components/AppLayout'
import SettingsTabs from '@/components/SettingsTabs'
import { useWebAuthn } from '@/hooks/useWebAuthn'
import { IconFaceId } from '@/components/Icons'
import { useLocale } from '@/hooks/useLocale'

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

export default function PasskeysIndex({ credentials }: Props) {
  const { t } = useTranslation('settings')
  const { speechLang } = useLocale()
  const { isSupported, status, errorMessage, registerPasskey } = useWebAuthn()
  const [nickname, setNickname] = useState('')

  function formatDate(iso: string | null) {
    if (!iso) return t('passkeys.table.never')
    return new Date(iso).toLocaleDateString(speechLang, { month: 'short', day: 'numeric', year: 'numeric' })
  }

  async function handleAdd() {
    const label = nickname.trim() || undefined
    const success = await registerPasskey(label)

    if (success) {
      setNickname('')
      router.reload({ only: ['credentials'] })
    }
  }

  function handleRevoke(id: number) {
    if (!confirm(t('passkeys.revokeConfirm'))) return
    router.delete(`/settings/passkeys/${id}`)
  }

  return (
    <AppLayout title={t('passkeys.pageTitle')}>
      <div className="max-w-4xl space-y-6">

        <SettingsTabs active="passkeys" />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: SLATE }}>{t('passkeys.header.title')}</h1>
            <p className="text-sm mt-1" style={{ color: GRAY }}>{t('passkeys.header.subtitle')}</p>
          </div>
        </div>

        {!isSupported && (
          <div className="px-4 py-3 rounded-xl text-sm" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}>
            {t('passkeys.unsupported')}
          </div>
        )}

        {isSupported && (
          <div className="rounded-2xl border p-5 space-y-3" style={{ background: '#fff', borderColor: BORDER, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
            <div className="flex items-center gap-2">
              <IconFaceId size={20} color={TEAL} />
              <h2 className="text-sm font-semibold" style={{ color: SLATE }}>{t('passkeys.addNew')}</h2>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  placeholder={t('passkeys.nicknamePlaceholder')}
                  className="flex-1 px-3 py-2 rounded-xl border text-sm"
                  style={{ borderColor: BORDER, color: SLATE }}
                />
                <button
                  onClick={handleAdd}
                  disabled={status === 'in_progress'}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white flex-shrink-0"
                  style={{ background: status === 'in_progress' ? '#94A3B8' : TEAL }}
                >
                  {status === 'in_progress' ? t('passkeys.waiting') : t('passkeys.activate')}
                </button>
              </div>
            {errorMessage && (
              <p className="text-xs" style={{ color: '#DC2626' }}>{t('passkeys.error')}</p>
            )}
          </div>
        )}

       <div className="rounded-2xl border overflow-x-auto" style={{ background: '#fff', borderColor: BORDER, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
            <table className="w-full text-sm" style={{ minWidth: '480px' }}>
            <thead>
              <tr style={{ background: LIGHT, borderBottom: `1px solid ${BORDER}` }}>
                {[t('passkeys.table.device'), t('passkeys.table.added'), t('passkeys.table.lastUsed'), t('passkeys.table.actions')].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold" style={{ color: GRAY }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {credentials.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-sm" style={{ color: GRAY }}>
                    {t('passkeys.table.empty')}
                  </td>
                </tr>
              ) : credentials.map((cred, i) => (
                <tr key={cred.id} style={{ borderBottom: `1px solid ${BORDER}`, background: i % 2 === 0 ? '#fff' : LIGHT }}>
                  <td className="px-4 py-3 font-medium" style={{ color: SLATE }}>
                    <div className="flex items-center gap-2">
                      <IconFaceId size={16} color={TEAL} />
                      {cred.nickname || t('passkeys.table.unnamed')}
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
                      {t('passkeys.table.remove')}
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