import { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react'
import { X, Send, Loader2, Sparkles, Download, FileSpreadsheet, FileText, FileSpreadsheet as FileCsv } from 'lucide-react'
import { toast } from 'sonner'
import { IconBolt } from '@/components/Icons'

interface ReportAttachment {
  url: string
  filename: string
  content_type: string
}

interface AssistantMessage {
  id: number | string
  role: 'user' | 'assistant'
  content: string
  report?: ReportAttachment | null
}

const DEFAULT_WIDTH = 380
const MIN_WIDTH = 320
const MAX_WIDTH = 520

const REPORT_KIND_MAP: Record<string, { label: string; color: string; icon: 'pdf' | 'xlsx' | 'csv' }> = {
  'application/pdf': { label: 'PDF Document', color: '#DC2626', icon: 'pdf' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { label: 'Excel Spreadsheet', color: '#16A34A', icon: 'xlsx' },
  'text/csv': { label: 'CSV File', color: '#0284C7', icon: 'csv' },
}

function reportKindLabel(contentType: string): string {
  return REPORT_KIND_MAP[contentType]?.label ?? 'File'
}

function ReportFileIcon({ contentType }: { contentType: string }) {
  const kind = REPORT_KIND_MAP[contentType]
  const color = kind?.color ?? '#94A3B8'
  const Icon = kind?.icon === 'pdf' ? FileText : kind?.icon === 'xlsx' ? FileSpreadsheet : FileCsv

  return (
    <div
      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
      style={{ background: `${color}1A` }}
    >
      <Icon size={17} color={color} />
    </div>
  )
}

function csrfToken(): string {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? ''
}

export default function VoltCopilotPanel() {
  const [open, setOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [messages, setMessages] = useState<AssistantMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [width, setWidth] = useState(DEFAULT_WIDTH)
  const [showPulse, setShowPulse] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const resizingRef = useRef(false)

  useEffect(() => {
    if (open && !loaded) fetchConversation()
  }, [open, loaded])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  useEffect(() => {
    const timer = setTimeout(() => setShowPulse(false), 4000)
    return () => clearTimeout(timer)
  }, [])

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!resizingRef.current) return
    const next = window.innerWidth - e.clientX
    setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, next)))
  }, [])

  const handleResizeEnd = useCallback(() => {
    resizingRef.current = false
    window.removeEventListener('mousemove', handleResizeMove)
    window.removeEventListener('mouseup', handleResizeEnd)
  }, [handleResizeMove])

  function handleResizeStart() {
    resizingRef.current = true
    window.addEventListener('mousemove', handleResizeMove)
    window.addEventListener('mouseup', handleResizeEnd)
  }

  async function fetchConversation() {
    try {
      const res = await fetch('/assistant/conversation', { headers: { Accept: 'application/json' } })
      if (!res.ok) throw new Error('Failed to load conversation')
      const data = await res.json()
      setMessages(data.messages)
      setLoaded(true)
    } catch {
      toast.error('Could not load Volt Copilot. Please try again.')
    }
  }

  async function handleSend() {
    const content = input.trim()
    if (!content || sending) return

    setMessages(prev => [...prev, { id: `local-${Date.now()}`, role: 'user', content }])
    setInput('')
    setSending(true)

    try {
      const res = await fetch('/assistant/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-CSRF-Token': csrfToken(),
        },
        body: JSON.stringify({ content }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? 'Volt Copilot could not answer that.')
        return
      }

      setMessages(prev => [
        ...prev,
        { id: `local-${Date.now()}-a`, role: 'assistant', content: data.content, report: data.report },
      ])
    } catch {
      toast.error('Network error — Volt Copilot did not respond.')
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      <style>{`
        .volt-copilot-scroll { scrollbar-width: thin; scrollbar-color: rgba(2,128,144,0.35) transparent; }
        .volt-copilot-scroll::-webkit-scrollbar { width: 6px; }
        .volt-copilot-scroll::-webkit-scrollbar-track { background: transparent; }
        .volt-copilot-scroll::-webkit-scrollbar-thumb { background-color: rgba(2,128,144,0.35); border-radius: 999px; }
        .volt-copilot-scroll::-webkit-scrollbar-thumb:hover { background-color: rgba(2,128,144,0.55); }
        @keyframes volt-copilot-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(2,128,144,0.45); }
          70%  { box-shadow: 0 0 0 10px rgba(2,128,144,0); }
          100% { box-shadow: 0 0 0 0 rgba(2,128,144,0); }
        }
        .volt-copilot-pulse { animation: volt-copilot-pulse 1.8s ease-out 2; }
      `}</style>

      <button
        onClick={() => setOpen(true)}
        aria-label="Open Volt Copilot"
        title="Volt Copilot"
        className={`fixed z-40 flex items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105 ${showPulse ? 'volt-copilot-pulse' : ''}`}
        style={{
          bottom: '24px', right: '24px', width: '52px', height: '52px',
          background: '#028090', border: 'none', cursor: 'pointer',
          display: open ? 'none' : 'flex', position: 'fixed',
        }}
      >
        <IconBolt size={22} color="#fff" />
        <span
          className="absolute flex items-center justify-center rounded-full"
          style={{
            top: '-2px', right: '-2px', width: '18px', height: '18px',
            background: '#02C39A', border: '2px solid #fff',
          }}
        >
          <Sparkles size={9} color="#fff" />
        </span>
      </button>

      <div
        className="fixed top-0 right-0 bottom-0 z-40 flex flex-col transition-transform duration-300"
        style={{
          width: `${width}px`, maxWidth: '100vw', background: '#fff',
          borderLeft: '1px solid rgba(15,23,42,0.08)',
          boxShadow: '-8px 0 24px rgba(0,0,0,0.08)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        <div
          onMouseDown={handleResizeStart}
          className="absolute top-0 bottom-0 left-0"
          style={{ width: '5px', cursor: 'ew-resize', zIndex: 41 }}
        />

        <div className="flex items-center justify-between px-4 py-4 border-b" style={{ borderColor: 'rgba(15,23,42,0.08)' }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#028090' }}>
              <IconBolt size={14} color="#fff" />
            </div>
            <span className="font-semibold text-sm" style={{ color: '#0D1B2A' }}>Volt Copilot</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close Volt Copilot"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="volt-copilot-scroll flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {!loaded && (
            <div className="flex items-center justify-center h-full">
              <Loader2 size={20} className="animate-spin" style={{ color: '#94A3B8' }} />
            </div>
          )}

          {loaded && messages.length === 0 && (
            <p className="text-sm" style={{ color: '#94A3B8' }}>
              Ask Volt Copilot about your tickets, leave requests, or assets.
            </p>
          )}

          {messages.map(message => (
            <div key={message.id} className="max-w-[85%]" style={{ marginLeft: message.role === 'user' ? 'auto' : '0' }}>
              <div
                className="px-3 py-2 rounded-2xl text-sm"
                style={{
                  background: message.role === 'user' ? '#028090' : '#F8FAFC',
                  color: message.role === 'user' ? '#fff' : '#0D1B2A',
                  border: message.role === 'user' ? 'none' : '1px solid rgba(15,23,42,0.08)',
                }}
              >
                {message.content}
              </div>
              {message.report && (
                  <a
                  href={message.report.url}
                  download={message.report.filename}
                  className="flex items-center gap-3 mt-1.5 p-3 rounded-xl transition-colors hover:bg-black/[0.02]"
                  style={{ background: '#fff', border: '1px solid rgba(15,23,42,0.08)', textDecoration: 'none' }}
                >
                  <ReportFileIcon contentType={message.report.content_type} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate" style={{ color: '#0D1B2A' }}>
                      {message.report.filename}
                    </p>
                    <p className="text-xs" style={{ color: '#94A3B8' }}>
                      {reportKindLabel(message.report.content_type)}
                    </p>
                  </div>
                  <Download size={16} style={{ color: '#028090', flexShrink: 0 }} />
                </a>
              )}
            </div>
          ))}

          {sending && (
            <div
              className="max-w-[85%] px-3 py-2 rounded-2xl text-sm flex items-center gap-2"
              style={{ background: '#F8FAFC', border: '1px solid rgba(15,23,42,0.08)', color: '#94A3B8' }}
            >
              <Loader2 size={14} className="animate-spin" />
              Thinking...
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="px-4 py-3 border-t" style={{ borderColor: 'rgba(15,23,42,0.08)' }}>
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Volt Copilot..."
              rows={1}
              className="flex-1 px-3 py-2 rounded-xl text-sm resize-none"
              style={{ border: '1px solid rgba(15,23,42,0.08)', outline: 'none', maxHeight: '96px' }}
            />
            <button
              onClick={handleSend}
              disabled={sending || !input.trim()}
              aria-label="Send message"
              className="flex items-center justify-center rounded-xl flex-shrink-0"
              style={{
                width: '36px', height: '36px', border: 'none', cursor: 'pointer',
                background: sending || !input.trim() ? '#E2E8F0' : '#028090',
              }}
            >
              <Send size={16} color={sending || !input.trim() ? '#94A3B8' : '#fff'} />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
