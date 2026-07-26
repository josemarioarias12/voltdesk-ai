import { useState, useRef, useEffect } from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/style.css'
import { CARD, INPUT, LABEL, SLATE, NAVY, TEAL } from '@/styles/tokens'

interface DatePickerProps {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  minDate?: Date
  disabled?: boolean
}

function CalendarIcon({ size = 16, color = SLATE[400] }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <rect x="3" y="5" width="18" height="16" rx="2" strokeWidth={2} />
      <path strokeLinecap="round" d="M16 3v4M8 3v4M3 10h18" />
    </svg>
  )
}

function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseISODate(value: string): Date | undefined {
  if (!value) return undefined
  const [y, m, d] = value.split('-').map(Number)
  if (!y || !m || !d) return undefined
  return new Date(y, m - 1, d)
}

function formatDisplay(date: Date): string {
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })
}

export default function DatePicker({ value, onChange, label, placeholder = 'Select date', minDate, disabled }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const selected = parseISODate(value)

  useEffect(() => {
    if (!open) return

    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {label && <label style={LABEL}>{label}</label>}
      <button
        type="button"
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        style={{
          ...INPUT, textAlign: 'left', cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <span style={{ color: selected ? NAVY : SLATE[400] }}>
          {selected ? formatDisplay(selected) : placeholder}
        </span>
        <CalendarIcon />
      </button>

      {open && (
        <div
          role="dialog"
          style={{ ...CARD, position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 50, padding: 12, width: 'max-content' }}
        >
          <style>{`
            .voltdesk-daypicker {
              --rdp-accent-color: ${TEAL};
              --rdp-accent-background-color: rgba(2,128,144,0.1);
              --rdp-font-family: inherit;
              font-size: 13px;
            }
            .voltdesk-daypicker .rdp-day_button:hover {
              background: rgba(2,128,144,0.08);
            }
          `}</style>
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={(date) => { if (date) { onChange(toISODate(date)); setOpen(false) } }}
            disabled={minDate ? { before: minDate } : undefined}
            className="voltdesk-daypicker"
            autoFocus
          />
        </div>
      )}
    </div>
  )
}
