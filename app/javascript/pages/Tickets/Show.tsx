import { useState, useCallback, useEffect, useRef } from 'react'
import { router } from '@inertiajs/react'
import { motion, AnimatePresence } from 'framer-motion'
import type {
  TicketsShowProps, Ticket, TicketComment, TicketActivity,
  TicketPriority, TicketStatus, AgentActionPending,
} from '@/types/tickets'
import { useActionCable } from '@/hooks/useActionCable'
import AppLayout from '@/components/AppLayout'
import { useTranslation } from 'react-i18next'
import { useDepartmentName } from '@/hooks/useDepartmentName'
import { useWindowWidth } from '@/hooks/useWindowWidth'

type Translate = (key: string, options?: Record<string, unknown>) => string

// ── Design tokens ─────────────────────────────────────────────────────────────
const CARD: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  border: '1px solid rgba(15,23,42,0.06)',
  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
}

const LABEL: React.CSSProperties = {
  fontSize: 10.5,
  fontWeight: 600,
  color: '#94A3B8',
  textTransform: 'uppercase',
  letterSpacing: '0.09em',
}

const PANEL_SELECT_STYLE: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  padding: '4px 8px',
  borderRadius: 6,
  border: '1px solid rgba(15,23,42,0.12)',
  color: '#0F172A',
  background: '#fff',
  cursor: 'pointer',
}

const PRIORITY_COLORS: Record<TicketPriority, string> = {
  critical: '#DC2626', high: '#EA580C', medium: '#D97706', low: '#6B7280',
}

const PRIORITY_BG: Record<TicketPriority, string> = {
  critical: '#FEF2F2', high: '#FFF7ED', medium: '#FFFBEB', low: '#F8FAFC',
}

const STATUS_CFG: Record<TicketStatus, { bg: string; text: string; dot: string }> = {
  open:                   { bg: '#F0FDF4', text: '#15803D', dot: '#22C55E' },
  in_progress:            { bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6' },
  pending:                { bg: '#FEFCE8', text: '#A16207', dot: '#EAB308' },
  resolved:               { bg: '#F0FDF4', text: '#15803D', dot: '#22C55E' },
  closed:                 { bg: '#F8FAFC', text: '#475569', dot: '#94A3B8' },
  pending_classification: { bg: 'rgba(2,128,144,0.04)', text: '#028090', dot: '#02C39A' },
}

// ── Framer variants ───────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
}

const fadeIn = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { duration: 0.25 } },
}

const stagger = {
  show: { transition: { staggerChildren: 0.07 } },
}

const slideRight = {
  hidden: { opacity: 0, x: 20 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatRelative(iso: string, t: Translate): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (m < 1) return t('relative.justNow')
  if (m < 60) return t('relative.minutesAgo', { count: m })
  if (h < 24) return t('relative.hoursAgo', { count: h })
  return t('relative.daysAgo', { count: d })
}

// ── AI Pipeline Card ──────────────────────────────────────────────────────────
const PIPELINE_STEP_IDS = ['analyzing', 'searching', 'priority', 'generating', 'finalizing'] as const

function AiPipelineCard() {
  const { t } = useTranslation('tickets')
  const [activeStep, setActiveStep] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setActiveStep(prev => prev < PIPELINE_STEP_IDS.length - 1 ? prev + 1 : prev)
    }, 2200)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  const progress = Math.round(((activeStep + 1) / PIPELINE_STEP_IDS.length) * 100)

  return (
    <motion.div variants={fadeUp} style={{ ...CARD, marginBottom: 10, borderLeft: '3px solid #028090', overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative', width: 8, height: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#028090' }} />
            <div style={{ position: 'absolute', inset: -3, borderRadius: '50%', border: '2px solid rgba(2,128,144,0.25)', animation: 'ping 1.8s ease-in-out infinite' }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#028090' }}>{t('show.pipeline.title')}</span>
          <span style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 20, background: 'rgba(2,128,144,0.04)', color: '#028090', border: '1px solid rgba(2,128,144,0.15)', fontWeight: 600 }}>GPT-4o</span>
        </div>
        <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, fontFamily: 'monospace' }}>{activeStep + 1} / {PIPELINE_STEP_IDS.length}</span>
      </div>

      <div style={{ height: 2, background: 'rgba(2,128,144,0.08)', margin: '0 20px' }}>
        <motion.div
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ height: '100%', background: '#028090', borderRadius: 1 }}
        />
      </div>

      <div style={{ padding: '10px 20px 16px', display: 'flex', flexDirection: 'column', gap: 3 }}>
        {PIPELINE_STEP_IDS.map((stepId, idx) => {
          const step = {
            label: t(`show.pipeline.steps.${stepId}.label`),
            detail: t(`show.pipeline.steps.${stepId}.detail`),
          }
          const done    = idx < activeStep
          const current = idx === activeStep
          return (
            <motion.div
              key={stepId}
              animate={{
                background: current ? '#028090' : done ? 'rgba(2,128,144,0.04)' : 'transparent',
              }}
              transition={{ duration: 0.3 }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderRadius: 8 }}
            >
              <motion.div
                animate={{
                  background: done ? '#028090' : current ? 'rgba(255,255,255,0.2)' : 'rgba(15,23,42,0.05)',
                  scale: current ? 1.1 : 1,
                }}
                transition={{ duration: 0.3 }}
                style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <AnimatePresence mode="wait">
                  {done ? (
                    <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </motion.div>
                  ) : (
                    <motion.div key="dot" style={{ width: 5, height: 5, borderRadius: '50%', background: current ? '#fff' : '#CBD5E1' }} />
                  )}
                </AnimatePresence>
              </motion.div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: current ? 600 : 400, color: current ? '#fff' : done ? '#028090' : '#94A3B8', lineHeight: 1.3 }}>
                  {step.label}
                </p>
                <AnimatePresence>
                  {current && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2, overflow: 'hidden' }}
                    >
                      {step.detail}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {current && (
                <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
                      style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.6)' }}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
      <style>{`@keyframes ping { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.8);opacity:0} }`}</style>
    </motion.div>
  )
}

// ── XAI Panel ─────────────────────────────────────────────────────────────────
function XaiPanel({ ticket }: { ticket: Ticket }) {
  const { t } = useTranslation('tickets')
  const [collapsed, setCollapsed] = useState(false)
  const isMobile = useWindowWidth() < 640
  const meta = ticket.ai_metadata
  if (!meta?.reasoning) return null

  const { category_signals, priority_signals, confidence } = meta.reasoning
  const confidencePct = Math.round(confidence * 100)
  const isHigh = confidence >= 0.70

  return (
    <motion.div variants={fadeUp} style={{ ...CARD, marginBottom: 10, overflow: 'hidden' }}>
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        aria-expanded={!collapsed}
        style={{ width: '100%', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', borderBottom: collapsed ? 'none' : '1px solid rgba(15,23,42,0.05)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(2,128,144,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M7.5 1.5a6 6 0 100 12 6 6 0 000-12zM7.5 4v4l3 1.5" stroke="#028090" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ textAlign: 'left' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{t('show.xai.title')}</p>
            <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>GPT-4o · {confidencePct}% {t('show.xai.confidenceSuffix')}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: isHigh ? '#F0FDF4' : '#FEF2F2', color: isHigh ? '#15803D' : '#DC2626', border: `1px solid ${isHigh ? 'rgba(21,128,61,0.15)' : 'rgba(220,38,38,0.15)'}` }}>
            {t('show.xai.confBadge', { value: confidence.toFixed(2) })}
          </span>
          <motion.div animate={{ rotate: collapsed ? 0 : 180 }} transition={{ duration: 0.2 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 5l4 4 4-4" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            style={{ overflow: 'hidden' }}
          >
            {/* Two-column layout: signals left, confidence right */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 200px', gap: 0 }}>

              {/* Left — signals */}
              <div style={{ padding: '16px 20px', borderRight: isMobile ? 'none' : '1px solid rgba(15,23,42,0.05)', borderBottom: isMobile ? '1px solid rgba(15,23,42,0.05)' : 'none' }}>
                <div style={{ marginBottom: 16 }}>
                  <p style={{ ...LABEL, marginBottom: 8 }}>{t('show.xai.categorySignals')}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {category_signals.map((s, i) => (
                      <motion.span
                        key={s}
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05, duration: 0.2 }}
                        style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: 'rgba(2,128,144,0.07)', color: '#028090', border: '1px solid rgba(2,128,144,0.12)', fontWeight: 500 }}
                      >
                        {s}
                      </motion.span>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <p style={{ ...LABEL, marginBottom: 8 }}>{t('show.xai.prioritySignals')}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {priority_signals.map((s, i) => (
                      <motion.span
                        key={s}
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 + 0.1, duration: 0.2 }}
                        style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: '#FFF7ED', border: '1px solid rgba(234,88,12,0.15)', color: '#C2410C', fontWeight: 500 }}
                      >
                        {s}
                      </motion.span>
                    ))}
                  </div>
                </div>


                {ticket.correction_rate && ticket.correction_rate.times_corrected > 0 && (
                  <div style={{ marginTop: 14, padding: '9px 12px', borderRadius: 8, background: ticket.correction_rate.times_corrected > 5 ? '#FFFBEB' : '#F8FAFC', border: `1px solid ${ticket.correction_rate.times_corrected > 5 ? 'rgba(217,119,6,0.2)' : 'rgba(15,23,42,0.06)'}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: '#475569' }}>
                        {t('show.xai.correctedRate', { category: ticket.correction_rate.category, count: ticket.correction_rate.times_corrected })}
                      </span>
                      {ticket.correction_rate.times_corrected > 5 && (
                        <span style={{ fontSize: 10.5, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: '#FEF3C7', color: '#D97706', flexShrink: 0, marginLeft: 8 }}>{t('show.xai.highRate')}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right — confidence box (Banani style) */}
              <div style={{ padding: '16px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: isHigh ? 'rgba(21,128,61,0.02)' : 'rgba(220,38,38,0.02)' }}>
                <p style={{ ...LABEL, marginBottom: 12, textAlign: 'center' }}>{t('show.xai.confidence')}</p>

                {/* Big number */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 18, delay: 0.1 }}
                  style={{ textAlign: 'center', marginBottom: 10 }}
                >
                  <p style={{ fontSize: 36, fontWeight: 700, color: isHigh ? '#15803D' : '#DC2626', letterSpacing: '-0.03em', lineHeight: 1 }}>
                    {confidence.toFixed(2)}
                  </p>
                  <p style={{ fontSize: 11, fontWeight: 600, color: isHigh ? '#15803D' : '#DC2626', marginTop: 4 }}>
                    {isHigh ? t('show.xai.highConfidence') : t('show.xai.lowConfidence')}
                  </p>
                </motion.div>

                {/* Confidence bar */}
                <div style={{ width: '100%', height: 5, background: 'rgba(15,23,42,0.06)', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${confidencePct}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut', delay: 0.15 }}
                    style={{ height: '100%', background: isHigh ? '#22C55E' : '#EF4444', borderRadius: 3 }}
                  />
                </div>

                <p style={{ fontSize: 10.5, color: '#94A3B8', textAlign: 'center' }}>
                  {confidencePct}% · {isHigh ? t('show.xai.autoRouting') : t('show.xai.reviewRecommended')}
                </p>

                {!isHigh && (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                    style={{ marginTop: 10, padding: '7px 10px', borderRadius: 7, background: '#FEF2F2', border: '1px solid rgba(220,38,38,0.15)', textAlign: 'center' }}
                  >
                    <p style={{ fontSize: 10.5, color: '#DC2626', fontWeight: 500 }}>{t('show.xai.manualReview')}</p>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Vision AI Card ────────────────────────────────────────────────────────────
function VisionAiCard({ ticket }: { ticket: Ticket }) {
  const { t } = useTranslation('tickets')
  const analysis = ticket.ai_metadata?.image_analysis
  if (!analysis) return null

  return (
    <motion.div variants={fadeUp} style={{ ...CARD, marginBottom: 10 }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(15,23,42,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(2,128,144,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#028090" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="12" r="3" stroke="#028090" strokeWidth="1.8" />
            </svg>
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{t('show.vision.title')}</p>
            <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>GPT-4o Vision</p>
          </div>
        </div>
        <span style={{ fontSize: 10.5, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: 'rgba(2,128,144,0.07)', color: '#028090', border: '1px solid rgba(2,128,144,0.15)' }}>
          GPT-4o Vision
        </span>
      </div>
      <div style={{ padding: '14px 20px', background: 'rgba(2,128,144,0.02)' }}>
        <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.75, margin: 0 }}>{analysis}</p>
      </div>
    </motion.div>
  )
}

// ── RAG Suggestion Card ───────────────────────────────────────────────────────
function RagSuggestionCard({ agentAction, onAccept }: { agentAction: AgentActionPending; onAccept: (text: string) => void }) {
  const { t } = useTranslation('tickets')
  const [dismissed, setDismissed] = useState(false)
  if (dismissed || !agentAction.ai_reasoning) return null

  return (
    <motion.div variants={fadeUp} style={{ ...CARD, marginBottom: 10, borderLeft: '3px solid #02C39A', overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(15,23,42,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(2,195,154,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M7.5 1l1.8 3.6 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4L2 5.2l4-.6z" stroke="#02C39A" strokeWidth="1.3" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{t('show.ragSuggestion.title')}</p>
            <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>{t('show.ragSuggestion.similarityStats', { pct: Math.round(agentAction.top_similarity * 100), count: agentAction.similar_tickets.length })}</p>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          aria-label={t('show.ragSuggestion.dismiss')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: 18, lineHeight: 1, padding: '2px 6px', borderRadius: 4 }}
        >×</button>
      </div>
      <div style={{ padding: '14px 20px', fontSize: 13, color: '#374151', lineHeight: 1.8, whiteSpace: 'pre-line', background: 'rgba(2,195,154,0.015)' }}>
        {agentAction.ai_reasoning}
      </div>
      <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(15,23,42,0.05)', display: 'flex', gap: 8 }}>
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => onAccept(agentAction.ai_reasoning)}
          style={{ padding: '7px 16px', background: '#028090', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer' }}
        >
          {t('show.ragSuggestion.accept')}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => onAccept(agentAction.ai_reasoning)}
          style={{ padding: '7px 16px', background: '#fff', border: '1px solid rgba(15,23,42,0.1)', borderRadius: 8, fontSize: 12, fontWeight: 500, color: '#475569', cursor: 'pointer' }}
        >
          {t('show.ragSuggestion.editBeforeSending')}
        </motion.button>
      </div>
    </motion.div>
  )
}

// ── Agent Approval Card ───────────────────────────────────────────────────────
function AgentApprovalCard({ agentAction }: { agentAction: AgentActionPending }) {
  const { t } = useTranslation('tickets')
  const confidencePct = Math.round(agentAction.confidence * 100)

  return (
    <motion.div variants={fadeUp} style={{ ...CARD, marginBottom: 10, borderLeft: '3px solid #F59E0B', overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(15,23,42,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="7.5" cy="7.5" r="6" stroke="#D97706" strokeWidth="1.4" />
              <path d="M7.5 5v3.5M7.5 10.5h.01" stroke="#D97706" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{t('show.agentApproval.title')}</p>
            <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>{t('show.agentApproval.humanInTheLoop', { time: formatRelative(agentAction.created_at, t) })}</p>
          </div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: '#FFFBEB', color: '#D97706', border: '1px solid rgba(217,119,6,0.2)' }}>
          {t('show.agentApproval.confidencePct', { pct: confidencePct })}
        </span>
      </div>

      <div style={{ padding: '14px 20px' }}>
        <p style={{ ...LABEL, marginBottom: 10 }}>{t('show.agentApproval.proposedActions')}</p>
        <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
          {[
            { label: t('show.agentApproval.actions.autoResolve'), icon: <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 6.5l3 3 6-6" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg> },
            { label: t('show.agentApproval.actions.postResponse'), icon: <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 3h9M2 6.5h9M2 10h6" stroke="#6B7280" strokeWidth="1.4" strokeLinecap="round" /></svg> },
            { label: t('show.agentApproval.actions.notifyRequester'), icon: <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1a5 5 0 100 10 5 5 0 000-10zM6.5 4v3l2 1" stroke="#6B7280" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg> },
          ].map((item, idx) => (
            <motion.div key={idx} variants={fadeIn} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, background: '#F8FAFC', border: '1px solid rgba(15,23,42,0.05)' }}>
              <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>{item.icon}</span>
              <span style={{ fontSize: 12, color: '#374151' }}>{item.label}</span>
            </motion.div>
          ))}
        </motion.div>

        {agentAction.similar_tickets.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ ...LABEL, marginBottom: 8 }}>{t('show.agentApproval.basedOn')}</p>
            {agentAction.similar_tickets.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(15,23,42,0.04)' }}>
                <span style={{ fontSize: 12, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}>{t.title}</span>
                <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500, flexShrink: 0 }}>{Math.round(t.similarity * 100)}%</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => router.patch(`/agent_actions/${agentAction.id}/ticket_approve`)}
            style={{ flex: 1, padding: '10px 0', background: '#028090', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' }}
          >
            {t('show.agentApproval.approveExecute')}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => router.patch(`/agent_actions/${agentAction.id}/ticket_reject`)}
            style={{ flex: 1, padding: '10px 0', background: '#fff', border: '1px solid rgba(220,38,38,0.25)', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#DC2626', cursor: 'pointer' }}
          >
            {t('show.agentApproval.reject')}
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

// ── Comment ───────────────────────────────────────────────────────────────────
function CommentItem({ comment, index }: { comment: TicketComment; index: number }) {
  const { t } = useTranslation('tickets')
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      style={{ display: 'flex', gap: 12, padding: '16px 20px', borderBottom: '1px solid rgba(15,23,42,0.04)' }}
    >
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: comment.internal ? '#D97706' : '#0D1B2A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>{comment.user.full_name.charAt(0)}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{comment.user.full_name}</span>
          <span style={{ fontSize: 11, color: '#94A3B8', textTransform: 'capitalize' }}>{comment.user.role.replace(/_/g, ' ')}</span>
          {comment.internal && (
            <span style={{ fontSize: 10.5, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: '#FEF3C7', color: '#D97706', border: '1px solid rgba(217,119,6,0.2)' }}>{t('show.internalBadge')}</span>
          )}
          <span style={{ marginLeft: 'auto', fontSize: 11, color: '#94A3B8' }}>{formatRelative(comment.created_at, t)}</span>
        </div>
        <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{comment.body}</p>
      </div>
    </motion.div>
  )
}

// ── Activity ──────────────────────────────────────────────────────────────────
function ActivityItem({ activity }: { activity: TicketActivity }) {
  const meta = activity.metadata as Record<string, string>
  const { t } = useTranslation('tickets')
  const labels: Record<string, string> = {
    created:        t('show.activity.created'),
    status_changed: t('show.activity.statusChanged', { status: meta.to ?? '' }),
    assigned:       t('show.activity.assigned', { name: meta.to_user_name ?? 'agent' }),
    escalated:      t('show.activity.escalated'),
    sla_breached:   t('show.activity.slaBreached'),
    sla_warning:    t('show.activity.slaWarning'),
    ai_classified:  t('show.activity.aiClassified'),
  }

  return (
    <div style={{ display: 'flex', gap: 10, padding: '8px 20px' }}>
      <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#F8FAFC', border: '1px solid rgba(15,23,42,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
        <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
          <circle cx="4.5" cy="4.5" r="3" stroke="#CBD5E1" strokeWidth="1.2" />
          <path d="M4.5 3v2l1 .7" stroke="#CBD5E1" strokeWidth="1.1" strokeLinecap="round" />
        </svg>
      </div>
      <div>
        <p style={{ fontSize: 12, color: '#475569' }}>{labels[activity.action] ?? activity.action.replace(/_/g, ' ')}</p>
        <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>{formatRelative(activity.created_at, t)}</p>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function TicketsShow({
  ticket, can_resolve, can_start_progress, can_assign, can_change_priority, can_internal, assignable_agents, agent_action,
}: TicketsShowProps) {
  const { t } = useTranslation('tickets')
  const departmentName = useDepartmentName()
  const isMobile = useWindowWidth() < 1024
  const [commentBody, setCommentBody] = useState('')
  const [isInternal, setIsInternal]   = useState(false)
  const [activeTab, setActiveTab]     = useState<'all' | 'internal' | 'external'>('all')
  const [isReassigning, setIsReassigning]             = useState(false)
  const [isChangingPriority, setIsChangingPriority]   = useState(false)

  function reassignTicket(agentId: number) {
    setIsReassigning(true)
    router.patch('/tickets/bulk_update', {
      bulk_action: 'assign',
      value: agentId,
      ticket_ids: [ticket.id],
    }, { preserveScroll: true, onFinish: () => setIsReassigning(false) })
  }

  function changeTicketPriority(value: TicketPriority) {
    setIsChangingPriority(true)
    router.patch('/tickets/bulk_update', {
      bulk_action: 'priority',
      value,
      ticket_ids: [ticket.id],
    }, { preserveScroll: true, onFinish: () => setIsChangingPriority(false) })
  }

  useActionCable(
    { channel: 'TicketsChannel', ticket_id: ticket.id },
    useCallback(() => { router.reload({ only: ['ticket', 'agent_action'] }) }, [])
  )

  const priorityColor = PRIORITY_COLORS[ticket.priority]
  const priorityBg    = PRIORITY_BG[ticket.priority]
  const statusCfg     = STATUS_CFG[ticket.status] ?? STATUS_CFG.open

  const visibleComments = ticket.comments.filter(c => {
    if (activeTab === 'internal') return c.internal
    if (activeTab === 'external') return !c.internal
    return true
  })

  function submitComment(e: React.FormEvent) {
    e.preventDefault()
    if (!commentBody.trim()) return
    router.post(`/tickets/${ticket.id}/comments`, {
      ticket_comment: { body: commentBody, internal: isInternal }
    }, { onSuccess: () => { setCommentBody(''); setIsInternal(false) } })
  }

  function acceptRagSuggestion(text: string) {
    setCommentBody(text)
    setTimeout(() => document.querySelector('textarea')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100)
  }

  return (
    <AppLayout title={ticket.ticket_number}>
      {/* Breadcrumb + action */}
      <motion.div
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => router.get('/tickets')}
            style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: 13, padding: 0 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t('show.breadcrumb')}
          </button>
          <span style={{ color: '#E2E8F0' }}>/</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', fontFamily: 'monospace', letterSpacing: '0.04em' }}>{ticket.ticket_number}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {can_start_progress && (
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => router.post(`/tickets/${ticket.id}/start_progress`)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', background: '#fff', border: '1px solid rgba(15,23,42,0.1)', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer', letterSpacing: '0.01em' }}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M6.5 2v4.5l3 2" stroke="#374151" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="6.5" cy="6.5" r="5.2" stroke="#374151" strokeWidth="1.2" />
              </svg>
              {t('show.startProgress')}
            </motion.button>
          )}
          {can_resolve && (
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => router.post(`/tickets/${ticket.id}/resolve`)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', background: '#028090', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', letterSpacing: '0.01em' }}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M2 6.5l3 3 6-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {t('show.resolveTicket')}
            </motion.button>
          )}
        </div>
      </motion.div>

      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 0, alignItems: 'stretch', border: '1px solid rgba(15,23,42,0.06)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.04)' }}>

        {/* Left column */}
        <motion.div
          variants={stagger} initial="hidden" animate="show"
          style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}
        >
          {/* Header */}
          <motion.div variants={fadeUp} style={{ padding: '24px 28px', background: '#fff', borderBottom: '1px solid rgba(15,23,42,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 16, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 5, background: 'rgba(2,128,144,0.07)', color: '#028090', fontFamily: 'monospace', letterSpacing: '0.06em' }}>
                {ticket.ticket_number}
              </span>
              <span style={{ width: 1, height: 14, background: 'rgba(15,23,42,0.1)' }} />
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: statusCfg.bg, color: statusCfg.text }}>
                <motion.span
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ width: 5, height: 5, borderRadius: '50%', background: statusCfg.dot, display: 'inline-block', flexShrink: 0 }}
                />
                {t(`status.${ticket.status}`)}
              </span>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: priorityBg, color: priorityColor, textTransform: 'capitalize' }}>
                {t(`priority.${ticket.priority}`)}
              </span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>
                {departmentName(ticket.department.name)}{ticket.category && ticket.category.toUpperCase() !== ticket.department.name.toUpperCase() ? ` · ${t(`category.${ticket.category}`)}` : ''}
              </span>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0F172A', lineHeight: 1.25, letterSpacing: '-0.02em', marginBottom: 20 }}>
              {ticket.title}
            </h1>
            <div style={{ height: 1, background: 'rgba(15,23,42,0.05)', marginBottom: 16 }} />
            <p style={{ ...LABEL, marginBottom: 8 }}>{t('show.description')}</p>
            <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
              {ticket.description ?? t('show.noDescription')}
            </p>

            {/* Attachments */}
            {ticket.attachments?.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <p style={{ ...LABEL, marginBottom: 10 }}>{t('show.attachments')}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {ticket.attachments.map(att => (
                    <a key={att.id} href={att.url} target="_blank" rel="noreferrer"
                      style={{ textDecoration: 'none' }}>
                      {att.content_type.startsWith('image/') ? (
                        <div style={{ width: 120, height: 90, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(15,23,42,0.10)', cursor: 'pointer', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <img src={att.url} alt={att.filename}
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(15,23,42,0.10)', background: '#F8FAFC', cursor: 'pointer' }}>
                          <svg width="14" height="14" fill="none" stroke="#64748B" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          <span style={{ fontSize: 12, color: '#475569', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {att.filename}
                          </span>
                        </div>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* AI cards */}
          {(ticket.status === 'pending_classification' || agent_action || ticket.ai_metadata?.reasoning) && (
            <div style={{ padding: '12px 28px 0', background: '#FAFAFA', borderBottom: '1px solid rgba(15,23,42,0.05)' }}>
              {ticket.status === 'pending_classification' && <AiPipelineCard />}
              {agent_action?.status === 'pending_approval' && <AgentApprovalCard agentAction={agent_action} />}
              {agent_action?.ai_reasoning && agent_action.status === 'pending_approval' && (
                <RagSuggestionCard agentAction={agent_action} onAccept={acceptRagSuggestion} />
              )}
              <XaiPanel ticket={ticket} />
              <VisionAiCard ticket={ticket} />
              <div style={{ height: 12 }} />
            </div>
          )}

          {/* Comments */}
          <motion.div variants={fadeUp} style={{ background: '#fff', flex: 1 }}>
            <div role="tablist" style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(15,23,42,0.05)', padding: '0 28px' }}>
              {(['all', 'internal', 'external'] as const).map(tab => {
                const tabLabels = { all: t('show.tabs.all'), internal: t('show.tabs.internal'), external: t('show.tabs.external') }
                const isActive  = activeTab === tab
                return (
                  <button key={tab} role="tab" aria-selected={isActive} onClick={() => setActiveTab(tab)}
                    style={{ padding: '14px 0', marginRight: 24, fontSize: 13, fontWeight: isActive ? 600 : 400, border: 'none', background: 'none', cursor: 'pointer', borderBottom: isActive ? '2px solid #028090' : '2px solid transparent', color: isActive ? '#028090' : '#64748B', transition: 'color 120ms ease' }}>
                    {tabLabels[tab]}
                  </button>
                )
              })}
              <span style={{ marginLeft: 'auto', fontSize: 11, color: '#94A3B8' }}>
                {t('show.comment', { count: visibleComments.length })}
              </span>
            </div>

            {visibleComments.length === 0 && (
              <div style={{ padding: '32px 28px', textAlign: 'center' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#F8FAFC', border: '1px solid rgba(15,23,42,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M14 8c0 3.314-2.686 6-6 6a5.97 5.97 0 01-3.5-1.127L2 14l1.127-2.5A5.97 5.97 0 012 8c0-3.314 2.686-6 6-6s6 2.686 6 6z" stroke="#CBD5E1" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p style={{ fontSize: 13, color: '#94A3B8' }}>{activeTab === 'all' ? t('show.noActivity') : t('show.noTabComments', { tab: activeTab })}</p>
              </div>
            )}

            <AnimatePresence>
              {visibleComments.map((c, i) => <CommentItem key={c.id} comment={c} index={i} />)}
            </AnimatePresence>

            {activeTab === 'all' && ticket.activities.length > 0 && (
              <div style={{ background: '#FAFAFA', borderTop: '1px solid rgba(15,23,42,0.04)', paddingTop: 6, paddingBottom: 6 }}>
                {ticket.activities.map(a => <ActivityItem key={a.id} activity={a} />)}
              </div>
            )}

            {/* Reply box */}
            <div style={{ borderTop: '1px solid rgba(15,23,42,0.05)', padding: '16px 28px' }}>
              <form onSubmit={submitComment}>
                <textarea
                  value={commentBody}
                  onChange={e => setCommentBody(e.target.value)}
                  placeholder={isInternal ? t('show.internalNotePlaceholder') : t('show.replyPlaceholder')}
                  rows={3}
                  style={{ width: '100%', padding: '10px 14px', border: `1px solid ${isInternal ? 'rgba(217,119,6,0.3)' : 'rgba(15,23,42,0.1)'}`, borderRadius: 8, fontSize: 13, resize: 'none', outline: 'none', color: '#0F172A', boxSizing: 'border-box', lineHeight: 1.65, background: isInternal ? '#FFFBEB' : '#fff', transition: 'border-color 120ms ease, background 120ms ease', fontFamily: 'inherit' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                  {can_internal && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B', cursor: 'pointer', userSelect: 'none' }}>
                      <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} style={{ accentColor: '#F59E0B' }} />
                      {t('show.internalNoteLabel')}
                    </label>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    type="submit" disabled={!commentBody.trim()}
                    style={{ marginLeft: 'auto', padding: '7px 20px', background: '#028090', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', cursor: commentBody.trim() ? 'pointer' : 'default', opacity: commentBody.trim() ? 1 : 0.4, transition: 'opacity 120ms ease' }}
                  >
                    {t('show.send')}
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>

        {/* Right sidebar — single surface, Linear style */}
        <motion.div
          variants={slideRight} initial="hidden" animate="show"
          style={{ width: isMobile ? '100%' : 256, flexShrink: 0, borderLeft: isMobile ? 'none' : '1px solid rgba(15,23,42,0.06)', borderTop: isMobile ? '1px solid rgba(15,23,42,0.06)' : 'none', background: '#FAFAFA', display: 'flex', flexDirection: 'column', minHeight: isMobile ? 'auto' : '100%' }}
        >
          {/* SLA */}
          <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(15,23,42,0.05)' }}>
            <p style={{ ...LABEL, marginBottom: 10 }}>{t('show.sla.title')}</p>
            {ticket.sla_status === 'breached' ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{ width: 8, height: 8, borderRadius: '50%', background: '#DC2626', boxShadow: '0 0 0 3px rgba(220,38,38,0.15)', flexShrink: 0 }}
                  />
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#DC2626', letterSpacing: '-0.01em' }}>{t('show.sla.breached')}</span>
                </div>
                <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>{t('show.sla.opened', { time: formatRelative(ticket.created_at, t) })}</p>
              </div>
            ) : ticket.due_at ? (
              <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{new Date(ticket.due_at).toLocaleString()}</p>
            ) : (
              <p style={{ fontSize: 12, color: '#94A3B8' }}>{t('show.sla.notConfigured')}</p>
            )}
          </div>

          {/* Urgency */}
          {ticket.urgency_score > 0 && (
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(15,23,42,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <p style={LABEL}>{t('show.urgency.title')}</p>
                <motion.span
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.3 }}
                  style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: ticket.urgency_score >= 80 ? '#DC2626' : ticket.urgency_score >= 60 ? '#D97706' : '#15803D' }}
                >
                  {ticket.urgency_score}
                </motion.span>
              </div>
              <div style={{ height: 4, background: 'rgba(15,23,42,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${ticket.urgency_score}%` }}
                  transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.2 }}
                  style={{ height: '100%', background: ticket.urgency_score >= 80 ? 'linear-gradient(90deg,#F59E0B,#DC2626)' : ticket.urgency_score >= 60 ? '#F59E0B' : '#22C55E', borderRadius: 2 }}
                />
              </div>
              <p style={{ fontSize: 10.5, color: ticket.urgency_score >= 80 ? '#DC2626' : '#94A3B8', marginTop: 5, fontWeight: ticket.urgency_score >= 80 ? 500 : 400 }}>
                {ticket.urgency_score >= 80 ? t('show.urgency.critical') : ticket.urgency_score >= 60 ? t('show.urgency.elevated') : t('show.urgency.normal')}
              </p>
            </div>
          )}

          {/* People */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(15,23,42,0.05)' }}>
            <p style={{ ...LABEL, marginBottom: 12 }}>{t('show.people.title')}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { key: 'assignee', label: t('show.people.assignedTo'), user: ticket.assigned_to, reassignable: true },
                { key: 'requester', label: t('show.people.requestedBy'), user: ticket.created_by, reassignable: false },
              ].map(({ key, label, user, reassignable }) => (
                <div key={key}>
                  <p style={{ fontSize: 10.5, color: '#94A3B8', marginBottom: 6 }}>{label}</p>
                  {reassignable && can_assign ? (
                    <select
                      value={ticket.assigned_to?.id ?? ''}
                      disabled={isReassigning}
                      onChange={e => reassignTicket(Number(e.target.value))}
                      style={PANEL_SELECT_STYLE}
                    >
                      <option value="" disabled>{t('show.people.unassigned')}</option>
                      {assignable_agents.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
                    </select>
                  ) : user ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#0D1B2A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>{user.full_name.charAt(0)}</span>
                      </div>
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 600, color: '#0F172A' }}>{user.full_name}</p>
                        <p style={{ fontSize: 10.5, color: '#94A3B8', textTransform: 'capitalize' }}>{user.role.replace(/_/g, ' ')}</p>
                      </div>
                    </div>
                  ) : (
                    <span style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic' }}>{t('show.people.unassigned')}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Properties */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(15,23,42,0.05)' }}>
            <p style={{ ...LABEL, marginBottom: 12 }}>{t('show.properties.title')}</p>
            {[
              { key: 'department', label: t('show.properties.department'), value: departmentName(ticket.department.name), color: undefined },
              { key: 'category',   label: t('show.properties.category'),   value: t(`category.${ticket.category}`), color: undefined },
              { key: 'priority',   label: t('show.properties.priority'),   value: t(`priority.${ticket.priority}`), color: priorityColor },
              { key: 'status',     label: t('show.properties.status'),     value: t(`status.${ticket.status}`),    color: statusCfg.text },
              { key: 'created',    label: t('show.properties.created'),    value: new Date(ticket.created_at).toLocaleDateString(), color: '#94A3B8' },
            ].map(({ key, label, value, color }) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(15,23,42,0.04)' }}>
                <span style={{ fontSize: 11, color: '#94A3B8' }}>{label}</span>
                {key === 'priority' && can_change_priority ? (
                  <select
                    value={ticket.priority}
                    disabled={isChangingPriority}
                    onChange={e => changeTicketPriority(e.target.value as TicketPriority)}
                    style={PANEL_SELECT_STYLE}
                  >
                    {(['critical', 'high', 'medium', 'low'] as const).map(p => (
                      <option key={p} value={p}>{t(`priority.${p}`)}</option>
                    ))}
                  </select>
                ) : (
                  <span style={{ fontSize: 12, fontWeight: 500, color: color ?? '#0F172A' }}>{value}</span>
                )}
              </div>
            ))}
          </div>

          {/* AI Tags */}
          {ticket.ai_metadata?.tags && ticket.ai_metadata.tags.length > 0 && (
            <div style={{ padding: '16px 20px' }}>
              <p style={{ ...LABEL, marginBottom: 10 }}>{t('show.aiTags')}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {ticket.ai_metadata.tags.map((tag, i) => (
                  <motion.span
                    key={tag}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.04 + 0.4 }}
                    style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: 'rgba(15,23,42,0.04)', color: '#475569', fontWeight: 500, border: '1px solid rgba(15,23,42,0.06)' }}
                  >
                    {tag}
                  </motion.span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AppLayout>
  )
}