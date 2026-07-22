import { router } from '@inertiajs/react'

export type SettingsTabKey = 'ai_provider' | 'ai_automation' | 'api_keys' | 'webhooks' | 'learning' | 'profile' | 'passkeys'

interface TabDef {
  key: SettingsTabKey
  label: string
  path?: string
}

interface Props {
  active: SettingsTabKey
  onLocalTabChange?: (tab: 'ai_provider' | 'ai_automation') => void
}

const TABS: TabDef[] = [
  { key: 'ai_provider', label: 'AI Provider' },
  { key: 'ai_automation', label: 'AI Automation' },
  { key: 'api_keys', label: 'API Keys', path: '/settings/api_keys' },
  { key: 'webhooks', label: 'Webhooks', path: '/settings/webhooks' },
  { key: 'learning', label: 'Learning', path: '/settings/learning' },
  { key: 'passkeys', label: 'Passkeys', path: '/settings/passkeys' },
  { key: 'profile', label: 'Profile', path: '/settings/profile' },
]

const TEAL  = '#028090'
const MUTED = '#94A3B8'
const BORDER = '#E2E8F0'

export default function SettingsTabs({ active, onLocalTabChange }: Props) {
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
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}