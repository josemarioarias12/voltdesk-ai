import { useState, useMemo } from 'react'
import { router } from '@inertiajs/react'
import AppLayout from '@/components/AppLayout'
import SettingsTabs from '@/components/SettingsTabs'

interface WorkspaceAiSettings {
  ai_provider: string
  ai_model: string
  ai_fallback_provider: string
  ai_selection_mode: string
}

interface AutomationSettings {
  agent_urgency_threshold: number
  agent_similarity_threshold: number
  human_in_the_loop: boolean
  automatable_categories: string[]
}

interface CostRow {
  provider: string
  model: string
  cost_per_1k_calls: number
}

interface Props {
  workspace: WorkspaceAiSettings
  provider_models: Record<string, string[]>
  cost_table: CostRow[]
  automation: AutomationSettings
  ticket_categories: string[]
}

const PROVIDER_LABELS: Record<string, string> = {
  openai:    'OpenAI',
  anthropic: 'Anthropic Claude',
  gemini:    'Google Gemini',
}

const PROVIDER_COLORS: Record<string, string> = {
  openai:    '#10B981',
  anthropic: '#8B5CF6',
  gemini:    '#3B82F6',
}

const MODEL_LABELS: Record<string, string> = {
  'gpt-4o':                    'GPT-4o — Most capable',
  'gpt-4o-mini':               'GPT-4o Mini — Fastest & cheapest',
  'gpt-4.1':                   'GPT-4.1 — Latest generation',
  'gpt-4.1-mini':              'GPT-4.1 Mini — Latest, fast',
  'claude-sonnet-4-5':         'Claude Sonnet 4.5 — Balanced',
  'claude-haiku-4-5-20251001': 'Claude Haiku 4.5 — Ultra fast',
  'gemini-2.0-flash':          'Gemini 2.0 Flash — Fastest',
  'gemini-1.5-pro':            'Gemini 1.5 Pro — Most capable',
}

const CATEGORY_LABELS: Record<string, string> = {
  general:    'General',
  it:         'IT',
  hr:         'HR',
  facilities: 'Facilities',
  finance:    'Finance',
  operations: 'Operations',
  support:    'Support',
}

export default function SettingsIndex({ workspace, provider_models, cost_table, automation, ticket_categories }: Props) {
  const [activeTab, setActiveTab] = useState<'ai_provider' | 'ai_automation'>('ai_provider')

  const [mode, setMode]         = useState(workspace.ai_selection_mode)
  const [provider, setProvider] = useState(workspace.ai_provider)
  const [model, setModel]       = useState(workspace.ai_model)
  const [fallback, setFallback] = useState(workspace.ai_fallback_provider)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)

  const [urgencyThreshold, setUrgencyThreshold] = useState(automation.agent_urgency_threshold)
  const [similarityPercent, setSimilarityPercent] = useState(Math.round(automation.agent_similarity_threshold * 100))
  const [humanInLoop, setHumanInLoop] = useState(automation.human_in_the_loop)
  const [categories, setCategories] = useState<string[]>(automation.automatable_categories)
  const [savingAutomation, setSavingAutomation] = useState(false)
  const [savedAutomation, setSavedAutomation] = useState(false)

  const availableModels: string[] = useMemo(() => {
    const models = provider_models[provider]
    return Array.isArray(models) ? models : []
  }, [provider, provider_models])

  const currentCost = cost_table.find(r => r.provider === provider && r.model === model)

  function handleProviderChange(p: string) {
    const models = provider_models[p] || []
    const firstModel = models[0] || ''
    setProvider(p)
    setModel(firstModel)
    if (fallback === p) setFallback('openai')
  }

  function handleSave() {
    setSaving(true)
    router.patch('/settings/ai', {
      workspace: {
        ai_provider:          provider,
        ai_model:             model,
        ai_fallback_provider: fallback,
        ai_selection_mode:    mode,
      }
    }, {
      onFinish: () => setSaving(false),
      onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 3000) },
    })
  }

  function toggleCategory(cat: string) {
    setCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }

  function handleSaveAutomation() {
    setSavingAutomation(true)
    router.patch('/settings/automation', {
      workspace: {
        agent_urgency_threshold:    urgencyThreshold,
        agent_similarity_threshold: similarityPercent / 100,
        human_in_the_loop:          humanInLoop,
        automatable_categories:     categories,
      }
    }, {
      onFinish: () => setSavingAutomation(false),
      onSuccess: () => { setSavedAutomation(true); setTimeout(() => setSavedAutomation(false), 3000) },
    })
  }

  return (
    <AppLayout title="Settings">
      <div className="max-w-4xl space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#0F172A' }}>Settings</h1>
          <p className="text-sm mt-1" style={{ color: '#475569' }}>
            Configure the AI behavior, automation rules, and integrations for your workspace.
          </p>
        </div>

        <SettingsTabs active={activeTab} onLocalTabChange={setActiveTab} />

        {activeTab === 'ai_provider' && (
          <>
            {/* Selection Mode */}
            <div className="rounded-2xl border p-6" style={{ background: '#fff', borderColor: '#E2E8F0', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
              <h2 className="text-base font-semibold mb-1" style={{ color: '#0F172A' }}>AI Selection Mode</h2>
              <p className="text-sm mb-4" style={{ color: '#475569' }}>
                Automatic lets VoltDesk pick the best model. Manual gives you full control.
              </p>
              <div className="flex gap-3">
                {(['automatic', 'manual'] as const).map(m => (
                  <button
                    key={m}
                    type="button" onClick={(e) => { e.stopPropagation(); setMode(m); }}
                    className="flex-1 py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all"
                    style={{
                      borderColor: mode === m ? '#028090' : '#E2E8F0',
                      background:  mode === m ? '#F0FDFA' : '#F8FAFC',
                      color:       mode === m ? '#028090' : '#475569',
                    }}
                  >
                    {m === 'automatic' ? 'Automatic' : 'Manual'}
                    <p className="text-xs font-normal mt-0.5" style={{ color: mode === m ? '#028090' : '#94A3B8' }}>
                      {m === 'automatic' ? 'Best model selected per operation' : 'You choose provider and model'}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Provider Selector */}
            <div className="rounded-2xl border p-6 space-y-5" style={{ background: '#fff', borderColor: '#E2E8F0', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
              <div>
                <h2 className="text-base font-semibold mb-1" style={{ color: '#0F172A' }}>AI Provider</h2>
                <p className="text-sm" style={{ color: '#475569' }}>
                  Primary provider used for ticket classification, RAG suggestions, and reports.
                </p>
              </div>

              {/* Provider Cards */}
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(PROVIDER_LABELS).map(([p, label]) => {
                  const isActive = provider === p
                  const dot = PROVIDER_COLORS[p]
                  const modelCount = (provider_models[p] || []).length
                  return (
                    <button
                      key={p}
                      type="button" onClick={(e) => { e.stopPropagation(); handleProviderChange(p); }}
                      className="p-4 rounded-xl border-2 text-left transition-all"
                      style={{
                        borderColor: isActive ? '#028090' : '#E2E8F0',
                        background:  isActive ? '#F0FDFA' : '#F8FAFC',
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2" style={{ pointerEvents: 'none' }}>
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: dot }} />
                        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: dot }}>
                          {p}
                        </span>
                      </div>
                      <p className="text-sm font-medium" style={{ color: '#0F172A', pointerEvents: 'none' }}>{label}</p>
                      <p className="text-xs mt-1" style={{ color: '#94A3B8', pointerEvents: 'none' }}>
                        {modelCount} models available
                      </p>
                    </button>
                  )
                })}
              </div>

              {/* Model Selector */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#0F172A' }}>
                  Model — {provider} has {availableModels.length} models</label>
                <div className="grid grid-cols-2 gap-2">
                  {availableModels.map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setModel(m); }}
                      className="p-3 rounded-xl border-2 text-left text-sm transition-all"
                      style={{
                        borderColor: model === m ? '#028090' : '#E2E8F0',
                        background:  model === m ? '#F0FDFA' : '#F8FAFC',
                        color:       model === m ? '#028090' : '#475569',
                        pointerEvents: 'auto'
                      }}
                    >
                      {MODEL_LABELS[m] || m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cost Estimator */}
              {currentCost && (
                <div
                  className="flex items-center justify-between px-4 py-3 rounded-xl"
                  style={{ background: '#F0FDFA', border: '1px solid #99F6E4' }}
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#028090' }}>
                      Estimated cost per 1,000 classifications
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#475569' }}>
                      Based on ~800 tokens avg per ticket
                    </p>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: '#028090' }}>
                    ${currentCost.cost_per_1k_calls.toFixed(4)}
                  </p>
                </div>
              )}
            </div>

            {/* Fallback Provider */}
            <div className="rounded-2xl border p-6" style={{ background: '#fff', borderColor: '#E2E8F0', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
              <h2 className="text-base font-semibold mb-1" style={{ color: '#0F172A' }}>Fallback Provider</h2>
              <p className="text-sm mb-4" style={{ color: '#475569' }}>
                If the primary provider fails after 3 retries, VoltDesk automatically switches to this provider.
              </p>
              <select
                value={fallback}
                onChange={e => setFallback(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border text-sm"
                style={{ borderColor: '#E2E8F0', background: '#fff', color: '#0F172A' }}
              >
                {Object.entries(PROVIDER_LABELS)
                  .filter(([p]) => p !== provider)
                  .map(([p, label]) => (
                    <option key={p} value={p}>{label}</option>
                  ))}
              </select>
              <p className="text-xs mt-2" style={{ color: '#94A3B8' }}>
                Embeddings always use OpenAI regardless of this setting — pgvector requires 1536-dim vectors.
              </p>
            </div>

            {/* Cost Comparison Table */}
            <div className="rounded-2xl border p-6" style={{ background: '#fff', borderColor: '#E2E8F0', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
              <h2 className="text-base font-semibold mb-4" style={{ color: '#0F172A' }}>Cost Comparison — All Models</h2>
              <div className="overflow-hidden rounded-xl border" style={{ borderColor: '#E2E8F0' }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      <th className="px-4 py-3 text-left font-semibold" style={{ color: '#475569' }}>Provider</th>
                      <th className="px-4 py-3 text-left font-semibold" style={{ color: '#475569' }}>Model</th>
                      <th className="px-4 py-3 text-right font-semibold" style={{ color: '#475569' }}>Cost / 1k tickets</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cost_table.map((row, i) => {
                      const isSelected = row.provider === provider && row.model === model
                      const dot = PROVIDER_COLORS[row.provider]
                      return (
                        <tr
                          key={i}
                          style={{
                            background:   isSelected ? '#F0FDFA' : i % 2 === 0 ? '#fff' : '#FAFAFA',
                            borderBottom: '1px solid #F1F5F9',
                          }}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full" style={{ background: dot }} />
                              <span style={{ color: '#475569' }}>{PROVIDER_LABELS[row.provider]}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3" style={{ color: '#0F172A' }}>
                            {MODEL_LABELS[row.model] || row.model}
                            {isSelected && (
                              <span
                                className="ml-2 text-xs px-2 py-0.5 rounded-full font-medium"
                                style={{ background: '#028090', color: '#fff' }}
                              >
                                Active
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-medium" style={{ color: '#0F172A' }}>
                            ${row.cost_per_1k_calls.toFixed(4)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-between py-2">
              {saved ? (
                <span className="text-sm font-medium" style={{ color: '#16A34A' }}>
                  ✓ Configuration saved successfully
                </span>
              ) : <span />}
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity"
                style={{ background: saving ? '#94A3B8' : '#028090' }}
              >
                {saving ? 'Saving...' : 'Save AI Configuration'}
              </button>
            </div>
          </>
        )}

        {activeTab === 'ai_automation' && (
          <>
            {/* Automation Thresholds */}
            <div className="rounded-2xl border p-6" style={{ background: '#fff', borderColor: '#E2E8F0', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
              <h2 className="text-base font-semibold mb-1" style={{ color: '#0F172A' }}>Automation thresholds</h2>
              <p className="text-sm mb-5" style={{ color: '#475569' }}>
                Both conditions must be met before the AI agent attempts to resolve a ticket on its own.
              </p>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium" style={{ color: '#0F172A' }}>Minimum urgency score</label>
                  <span className="text-sm font-semibold" style={{ color: '#028090' }}>{urgencyThreshold}</span>
                </div>
                <input
                  type="range" min={0} max={100} step={1}
                  value={urgencyThreshold}
                  onChange={e => setUrgencyThreshold(Number(e.target.value))}
                  className="w-full accent-teal-600"
                />
                <p className="text-xs mt-1.5" style={{ color: '#94A3B8' }}>
                  Tickets below this urgency score are always routed to a human agent, regardless of category.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium" style={{ color: '#0F172A' }}>Minimum match confidence</label>
                  <span className="text-sm font-semibold" style={{ color: '#028090' }}>{similarityPercent}%</span>
                </div>
                <input
                  type="range" min={0} max={100} step={1}
                  value={similarityPercent}
                  onChange={e => setSimilarityPercent(Number(e.target.value))}
                  className="w-full accent-teal-600"
                />
                <p className="text-xs mt-1.5" style={{ color: '#94A3B8' }}>
                  Cosine similarity against past resolved tickets — higher means stricter precedent matching.
                </p>
              </div>
            </div>

            {/* Human-in-the-loop */}
            <div className="rounded-2xl border p-6" style={{ background: '#fff', borderColor: '#E2E8F0', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold mb-1" style={{ color: '#0F172A' }}>Human-in-the-loop</h2>
                  <p className="text-sm" style={{ color: '#475569', maxWidth: '460px' }}>
                    Require agent approval before the AI executes an automated resolution.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setHumanInLoop(!humanInLoop) }}
                  className="flex-shrink-0"
                  style={{
                    width: '44px', height: '24px', borderRadius: '12px', border: 'none',
                    background: humanInLoop ? '#028090' : '#E2E8F0', position: 'relative', cursor: 'pointer',
                  }}
                >
                  <span style={{
                    position: 'absolute', top: '2px', left: humanInLoop ? '22px' : '2px',
                    width: '20px', height: '20px', borderRadius: '50%', background: '#fff',
                    transition: 'left 0.15s',
                  }} />
                </button>
              </div>
              <div className="mt-4 px-4 py-3 rounded-xl text-sm" style={{ background: '#F8FAFC', color: '#475569' }}>
                {humanInLoop ? (
                  <><strong style={{ color: '#0F172A' }}>Approval required —</strong> the agent prepares the resolution and waits for a human agent to approve or reject it before executing.</>
                ) : (
                  <><strong style={{ color: '#0F172A' }}>Autonomous mode —</strong> the agent resolves matching tickets immediately, no approval needed.</>
                )}
              </div>
            </div>

            {/* Automatable Categories */}
            <div className="rounded-2xl border p-6" style={{ background: '#fff', borderColor: '#E2E8F0', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
              <h2 className="text-base font-semibold mb-1" style={{ color: '#0F172A' }}>Automatable categories</h2>
              <p className="text-sm mb-4" style={{ color: '#475569' }}>
                Only tickets in selected categories are eligible for AI auto-resolution.
              </p>
              <div className="grid grid-cols-4 gap-2">
                {ticket_categories.map(cat => {
                  const isSelected = categories.includes(cat)
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleCategory(cat) }}
                      className="px-3 py-2.5 rounded-xl border-2 text-sm font-medium text-left transition-all"
                      style={{
                        borderColor: isSelected ? '#028090' : '#E2E8F0',
                        background:  isSelected ? '#F0FDFA' : '#F8FAFC',
                        color:       isSelected ? '#028090' : '#475569',
                      }}
                    >
                      {CATEGORY_LABELS[cat] ?? cat}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-between py-2">
              {savedAutomation ? (
                <span className="text-sm font-medium" style={{ color: '#16A34A' }}>
                  ✓ Automation settings saved successfully
                </span>
              ) : <span />}
              <button
                onClick={handleSaveAutomation}
                disabled={savingAutomation}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity"
                style={{ background: savingAutomation ? '#94A3B8' : '#028090' }}
              >
                {savingAutomation ? 'Saving...' : 'Save Automation Settings'}
              </button>
            </div>
          </>
        )}

      </div>
    </AppLayout>
  )
}