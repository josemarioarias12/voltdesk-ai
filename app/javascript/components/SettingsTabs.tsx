import { router } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'

export type SettingsTabKey = 'ai_provider' | 'ai_automation' | 'api_keys' | 'webhooks' | 'learning' | 'profile' | 'passkeys'

interface TabDef {
  key: SettingsTabKey
  labelKey: string
  path?: string
}

interface Props {
  active: SettingsTabKey
  onLocalTabChange?: (tab: 'ai_provider' | 'ai_automation') => void
}

const TABS: TabDef[] = [
  { key: 'ai_provider', labelKey: 'tabs.aiProvider' },
  { key: 'ai_automation', labelKey: 'tabs.aiAutomation' },
  { key: 'api_keys', labelKey: 'tabs.apiKeys', path: '/settings/api_keys' },
  { key: 'webhooks', labelKey: 'tabs.webhooks', path: '/settings/webhooks' },
  { key: 'learning', labelKey: 'tabs.learning', path: '/settings/learning' },
  { key: 'passkeys', labelKey: 'tabs.passkeys', path: '/settings/passkeys' },
  { key: 'profile', labelKey: 'tabs.profile', path: '/settings/profile' },
]

const TEAL  = '#028090'
const MUTED = '#94A3B8'
const BORDER = '#E2E8F0'

export default function SettingsTabs({ active, onLocalTabChange }: Props) {
  const { t } = useTranslation('settings')

  function handleClick(tab: TabDef) {
    if (tab.path) {
      router.get(tab.path)
    } else if (onLocalTabChange) {
      onLocalTabChange(tab.key as 'ai_provider' | 'ai_automation')
    }
  }

  return (
    <div className="flex gap-6 mb-6" style={{ borderBottom: `1px solid ${BORDER}` }}>
      {TABS.map(tab => {
        const isActive = tab.key === active
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => handleClick(tab)}
            className="pb-3 text-sm font-medium transition-colors"
            style={{
              color: isActive ? TEAL : MUTED,
              borderBottom: isActive ? `2px solid ${TEAL}` : '2px solid transparent',
              marginBottom: '-1px',
            }}
          >
            {t(tab.labelKey)}
          </button>
        )
      })}
    </div>
  )
}