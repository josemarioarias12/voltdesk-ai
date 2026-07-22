import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import ConfidenceBadge from "@/components/ConfidenceBadge"
import type { AiMetadata } from "@/types/tickets"

interface XaiPanelProps {
  aiMetadata: AiMetadata | null
  ticketNumber: string
}

export default function XaiPanel({ aiMetadata, ticketNumber }: XaiPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  if (!aiMetadata) {
    return (
      <div className="border border-[#E2E8F0] rounded-2xl overflow-hidden">
        <div className="bg-[#028090] px-4 py-3 flex items-center gap-2">
          <SparkleIcon />
          <span className="text-white font-medium text-sm">AI Classification Reasoning</span>
          <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-white text-xs">
            Classifying…
          </span>
        </div>
        <div className="p-4 space-y-3 animate-pulse">
          <div className="h-4 bg-[#E2E8F0] rounded w-1/3" />
          <div className="flex gap-2">
            {[80, 110, 90].map((w) => (
              <div key={w} className="h-7 bg-[#E2E8F0] rounded-full" style={{ width: w }} />
            ))}
          </div>
          <div className="h-2 bg-[#E2E8F0] rounded w-full mt-2" />
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
          <span className="text-white font-semibold text-sm">AI Classification Reasoning</span>
          <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-white text-xs font-medium">
            Powered by GPT-4o
          </span>
        </div>
        <div className="flex items-center gap-1 text-white/80 text-xs">
          <span>{isExpanded ? "Collapse" : "Expand"}</span>
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
                    Category Signals
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {reasoning.category_signals.length > 0 ? (
                      reasoning.category_signals.map((signal) => (
                        <SignalChip key={signal} label={signal} variant="category" />
                      ))
                    ) : (
                      <span className="text-xs text-[#94A3B8]">No signals detected</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#475569] uppercase tracking-wide mb-2">
                    Priority Signals
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {reasoning.priority_signals.length > 0 ? (
                      reasoning.priority_signals.map((signal) => (
                        <SignalChip key={signal} label={signal} variant="priority" />
                      ))
                    ) : (
                      <span className="text-xs text-[#94A3B8]">No signals detected</span>
                    )}
                  </div>
                </div>
              </div>

              <ConfidenceBadge confidence={confidence} showWarning={confidence < 0.7} />

              {reasoning.similar_ticket && (
                <div>
                  <p className="text-xs font-semibold text-[#475569] uppercase tracking-wide mb-2">
                    Similar Ticket Reference
                  </p>
                  <div className="flex items-center justify-between bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2">
                    <div className="flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[#028090]">
                        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="text-sm font-semibold text-[#028090]">
                        {reasoning.similar_ticket}
                      </span>
                      <span className="text-sm text-[#475569]">— Similar issue, resolved in 2h</span>
                    </div>
                    <span className="px-2 py-0.5 bg-[#16A34A]/10 text-[#16A34A] text-xs font-semibold rounded-full">
                      Resolved
                    </span>
                  </div>
                </div>
              )}

              {tags && tags.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-[#475569] uppercase tracking-wide mb-2">
                    AI Tags
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
