import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTranslation } from "react-i18next"
import ConfidenceBadge from "@/components/ConfidenceBadge"
import type { AiMetadata } from "@/types/tickets"

interface XaiPanelProps {
  aiMetadata: AiMetadata | null
  ticketNumber: string
}

const PROGRESS_CAP = 90
const PROGRESS_DURATION_MS = 3000

export default function XaiPanel({ aiMetadata, ticketNumber }: XaiPanelProps) {
  const { t } = useTranslation('tickets')
  const [isExpanded, setIsExpanded] = useState(true)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (aiMetadata) { setProgress(100); return }

    setProgress(0)
    const start = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - start
      const linear = Math.min(elapsed / PROGRESS_DURATION_MS, 1)
      const eased = 1 - Math.pow(1 - linear, 2)
      setProgress(Math.round(eased * PROGRESS_CAP))
      if (linear >= 1) clearInterval(interval)
    }, 100)

    return () => clearInterval(interval)
  }, [aiMetadata])

  if (!aiMetadata) {
    return (
      <div className="border border-[#E2E8F0] rounded-2xl overflow-hidden">
        <div className="bg-[#028090] px-4 py-3 flex items-center gap-2">
          <SparkleIcon />
          <span className="text-white font-medium text-sm">{t('show.xai.title')}</span>
          <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-white text-xs">
            {t('show.pipeline.title')}
          </span>
        </div>
        <div className="p-4 space-y-3">
          <div className="h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#028090] rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.15, ease: "linear" }}
            />
          </div>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-[#E2E8F0] rounded w-1/3" />
            <div className="flex gap-2">
              {[80, 110, 90].map((w) => (
                <div key={w} className="h-7 bg-[#E2E8F0] rounded-full" style={{ width: w }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const { reasoning, tags } = aiMetadata
  const confidence = reasoning.confidence ?? 0

  return (
    <div className="border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
      <button
        onClick={() => setIsExpanded((v) => !v)}
        className="w-full bg-[#028090] px-4 py-3 flex flex-wrap items-center justify-between gap-2 hover:bg-[#026E7A] transition-colors"
      >
        <div className="flex items-center gap-2">
          <SparkleIcon />
          <span className="text-white font-semibold text-sm">{t('show.xai.title')}</span>
          <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-white text-xs font-medium">
            {t('show.xai.poweredBy')}
          </span>
        </div>
        <div className="flex items-center gap-1 text-white/80 text-xs">
          <span>{isExpanded ? t('show.xai.collapse') : t('show.xai.expand')}</span>
          <motion.svg
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <path d="M19 9l-7 7-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </motion.svg>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="xai-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-[#475569] uppercase tracking-wide mb-2">
                    {t('show.xai.categorySignals')}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {reasoning.category_signals.length > 0 ? (
                      reasoning.category_signals.map((signal) => (
                        <SignalChip key={signal} label={signal} variant="category" />
                      ))
                    ) : (
                      <span className="text-xs text-[#94A3B8]">{t('show.xai.noSignalsDetected')}</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#475569] uppercase tracking-wide mb-2">
                    {t('show.xai.prioritySignals')}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {reasoning.priority_signals.length > 0 ? (
                      reasoning.priority_signals.map((signal) => (
                        <SignalChip key={signal} label={signal} variant="priority" />
                      ))
                    ) : (
                      <span className="text-xs text-[#94A3B8]">{t('show.xai.noSignalsDetected')}</span>
                    )}
                  </div>
                </div>
              </div>

              <ConfidenceBadge confidence={confidence} showWarning={confidence < 0.7} />

              {tags && tags.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-[#475569] uppercase tracking-wide mb-2">
                    {t('show.aiTags')}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <span key={tag} className="px-2.5 py-1 bg-[#F1F5F9] text-[#475569] text-xs rounded-full border border-[#E2E8F0]">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SignalChip({ label, variant }: { label: string; variant: "category" | "priority" }) {
  const styles = variant === "category"
    ? "bg-white text-[#0F172A] border-[#E2E8F0]"
    : "bg-[#FFF7ED] text-[#F97316] border-[#FED7AA]"
  return (
    <span className={`px-2.5 py-1 text-xs rounded-full border font-medium ${styles}`}>
      {label}
    </span>
  )
}

function SparkleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}