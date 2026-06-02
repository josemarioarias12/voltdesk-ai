import { useEffect, useState } from "react"
import { motion } from "framer-motion"

interface ConfidenceBadgeProps {
  confidence: number
  showWarning?: boolean
}

export default function ConfidenceBadge({
  confidence,
  showWarning = true,
}: ConfidenceBadgeProps) {
  const [animatedWidth, setAnimatedWidth] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedWidth(Math.round(confidence * 100))
    }, 150)
    return () => clearTimeout(timer)
  }, [confidence])

  const isLowConfidence = confidence < 0.7
  const barColor = isLowConfidence ? "bg-red-500" : "bg-[#028090]"
  const textColor = isLowConfidence ? "text-red-600" : "text-[#028090]"
  const label = isLowConfidence
    ? `Low Confidence ${confidence.toFixed(2)}`
    : `High Confidence ${confidence.toFixed(2)}`

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#475569] uppercase tracking-wide">
          Classification Confidence
        </span>
        <span className={`text-xs font-semibold ${textColor}`}>
          {label}
        </span>
      </div>

      <div className="relative h-2 w-full bg-[#E2E8F0] rounded-full overflow-hidden">
        <motion.div
          className={`absolute left-0 top-0 h-full rounded-full ${barColor}`}
          initial={{ width: "0%" }}
          animate={{ width: `${animatedWidth}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>

      {isLowConfidence && showWarning && (
        <motion.div
          className="flex items-center justify-between pt-1"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-red-500 flex-shrink-0">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span className="text-xs text-red-600 font-medium">
              Low Confidence — Review Recommended
            </span>
          </div>
          <span className="text-xs text-[#94A3B8]">
            Shown when score &lt; 0.70
          </span>
        </motion.div>
      )}
    </div>
  )
}
