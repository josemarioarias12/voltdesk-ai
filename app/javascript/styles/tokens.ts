import type { CSSProperties } from 'react'

// ── Brand ─────────────────────────────────────────────────────────────────────
export const TEAL = '#028090'
export const MINT = '#02C39A'
export const NAVY = '#0D1B2A'

// ── Neutrals ──────────────────────────────────────────────────────────────────
export const SLATE = {
  50: '#F8FAFC',
  400: '#94A3B8',
  500: '#64748B',
  600: '#475569',
  900: '#0F172A',
} as const

// ── Semantic ──────────────────────────────────────────────────────────────────
export const DANGER = '#DC2626'
export const DANGER_BG = '#FEF2F2'
export const WARNING = '#D97706'
export const WARNING_BG = '#FEF3C7'
export const SUCCESS = '#16A34A'
export const SUCCESS_BG = '#DCFCE7'

// ── Structural tokens ─────────────────────────────────────────────────────────
export const CARD: CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  border: '1px solid rgba(15,23,42,0.08)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
}

export const INPUT: CSSProperties = {
  width: '100%',
  padding: '9px 14px',
  border: '1px solid rgba(15,23,42,0.18)',
  borderRadius: 8,
  fontSize: 13,
  color: NAVY,
  outline: 'none',
  boxSizing: 'border-box',
  background: '#fff',
  transition: 'border-color 120ms ease',
}

export const LABEL: CSSProperties = {
  display: 'block',
  fontSize: 10.5,
  fontWeight: 600,
  color: SLATE[400],
  textTransform: 'uppercase',
  letterSpacing: '0.09em',
  marginBottom: 6,
}

export const TH_STYLE: CSSProperties = {
  padding: '10px 12px',
  textAlign: 'left',
  fontSize: 11,
  fontWeight: 600,
  color: SLATE[400],
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

export const BADGE: CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  padding: '3px 10px',
  borderRadius: 20,
  display: 'inline-block',
}
