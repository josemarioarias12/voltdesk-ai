import { useState } from "react"
import { motion } from "framer-motion"
import type { AiSuggestion } from "@/types/tickets"

interface AiSuggestedResponseProps {
  suggestion: AiSuggestion
  onAccept: (text: string) => void
  onIgnore: () => void
}

export default function AiSuggestedResponse({
  suggestion,
  onAccept,
  onIgnore,
}: AiSuggestedResponseProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedText, setEditedText] = useState(suggestion.suggestion)
  const [isDismissed, setIsDismissed] = useState(false)

  if (isDismissed) return null

  const citationList = suggestion.based_on.join(" and ")

  return (
    <motion.div
      className="border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between px-4 py-3 bg-[#F8FAFC] border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[#028090]">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-sm font-semibold text-[#0F172A]">AI Suggested Response</span>
        </div>
        <span className="text-xs text-[#94A3B8]">Based on {citationList}</span>
      </div>

      <div className="p-4">
        {isEditing ? (
          <textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            className="w-full min-h-32 text-sm text-[#0F172A] border border-[#028090] rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-[#028090]/20"
            autoFocus
          />
        ) : (
          <p className="text-sm text-[#0F172A] leading-relaxed">{editedText}</p>
        )}
      </div>

      <div className="flex items-center justify-between px-4 py-3 bg-[#F8FAFC] border-t border-[#E2E8F0]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onAccept(editedText)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#028090] text-white text-sm font-medium rounded-[10px] hover:bg-[#026E7A] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Accept
          </button>
          <button
            onClick={() => setIsEditing((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-[#0F172A] text-sm font-medium rounded-[10px] border border-[#E2E8F0] hover:bg-[#F1F5F9] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {isEditing ? "Done" : "Edit"}
          </button>
          <button
            onClick={() => { setIsDismissed(true); onIgnore() }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-[#DC2626] text-sm font-medium rounded-[10px] border border-[#FCA5A5] hover:bg-[#FEF2F2] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Ignore
          </button>
        </div>
        <span className="text-xs text-[#94A3B8] flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          AI-generated • Review before sending
        </span>
      </div>
    </motion.div>
  )
}
