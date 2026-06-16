import { useState } from 'react'
import { Head, router } from '@inertiajs/react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import AppLayout from '@/components/AppLayout'
import { useActionCable } from '@/hooks/useActionCable'

interface Pattern {
  from: string
  to: string
  count: number
}

interface TrendPoint {
  week: string
  count: number
}

interface Suggestion {
  summary: string
  suggested_prompt_addition: string
  correction_patterns: { from: string; to: string; count: number; pct: number }[]
  confidence: number
  generated_at: string
  applied_at?: string
}

interface Props {
  total_corrections: number
  corrections_last_30_days: number
  top_patterns: Pattern[]
  learning_suggestion: Suggestion | null
  threshold: number
  correction_rate_trend: TrendPoint[]
}

function KpiCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
    </div>
  )
}

export default function LearningIndex({
  total_corrections,
  corrections_last_30_days,
  top_patterns,
  learning_suggestion: initialSuggestion,
  threshold,
  correction_rate_trend,
}: Props) {
  const [suggestion, setSuggestion] = useState<Suggestion | null>(initialSuggestion)
  const [toastVisible, setToastVisible] = useState(false)
  const workspaceId = (window as unknown as { workspaceId?: number }).workspaceId ?? 0
  const progress = Math.min((total_corrections / threshold) * 100, 100)

  useActionCable(
    { channel: `workspace_admin:${workspaceId}` },
    (data: Record<string, unknown>) => {
      if (data.event !== 'learning_suggestion_ready') return
      setToastVisible(true)
      setTimeout(() => setToastVisible(false), 5000)
      router.reload({ only: ['learning_suggestion'] })
    }
  )

  function handleApply() {
    router.post('/settings/learning/apply', {}, {
      onSuccess: () => router.reload()
    })
  }

  function handleDismiss() {
    router.post('/settings/learning/dismiss', {}, {
      onSuccess: () => setSuggestion(null)
    })
  }

  return (
    <AppLayout>
      <Head title="AI Self-Learning" />

      <AnimatePresence>
        {toastVisible && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-4 right-4 z-50 bg-teal-600 text-white px-4 py-3 rounded-lg shadow-lg text-sm"
          >
            New AI learning suggestion is ready!
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">AI Self-Learning</h1>
          <p className="text-slate-500 mt-1">
            The system learns from agent corrections to improve classification accuracy.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Total Corrections" value={total_corrections} />
          <KpiCard label="Last 30 Days" value={corrections_last_30_days} />
          <KpiCard label="Patterns Detected" value={top_patterns.length} />
          <KpiCard label="Threshold" value={`${total_corrections}/${threshold}`} />
        </div>

        {total_corrections < threshold && (
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex justify-between text-sm text-slate-600 mb-2">
              <span>Progress toward AI learning</span>
              <span>{total_corrections}/{threshold} corrections</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3">
              <div
                className="bg-teal-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Keep agents correcting classifications to unlock AI learning
            </p>
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-700 mb-4">Correction Trend (Last 4 Weeks)</h2>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={correction_rate_trend}>
              <XAxis dataKey="week" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#028090" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {top_patterns.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-700">Top Correction Patterns</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-3 text-slate-600 font-medium">From</th>
                  <th className="text-left px-4 py-3 text-slate-600 font-medium"></th>
                  <th className="text-left px-4 py-3 text-slate-600 font-medium">To</th>
                  <th className="text-left px-4 py-3 text-slate-600 font-medium">Count</th>
                </tr>
              </thead>
              <tbody>
                {top_patterns.map((pattern, idx) => (
                  <tr key={idx} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-700">{pattern.from}</td>
                    <td className="px-4 py-3 text-slate-400">→</td>
                    <td className="px-4 py-3 text-teal-700 font-medium">{pattern.to}</td>
                    <td className="px-4 py-3 text-slate-600">{pattern.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {suggestion ? (
          <div className="bg-white rounded-xl border border-teal-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-800">AI Suggestion</h2>
              <span className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2 py-1 rounded">
                Generated {new Date(suggestion.generated_at).toLocaleDateString()}
              </span>
            </div>
            <p className="text-slate-600 text-sm">{suggestion.summary}</p>
            <div className="bg-slate-900 rounded-lg p-4">
              <pre className="text-green-400 text-xs whitespace-pre-wrap font-mono">
                {suggestion.suggested_prompt_addition}
              </pre>
            </div>
            {suggestion.applied_at ? (
              <p className="text-sm text-green-600 font-medium">
                ✓ Applied on {new Date(suggestion.applied_at).toLocaleDateString()}
              </p>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={handleApply}
                  className="px-4 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Apply Suggestion
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-sm rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
            <p className="text-slate-400 text-sm">
              No AI suggestion yet. Reach {threshold} corrections to unlock learning insights.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  )
}