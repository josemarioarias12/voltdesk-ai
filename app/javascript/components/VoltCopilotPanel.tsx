import { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react'
import { toast } from 'sonner'
import { IconBolt } from '@/components/Icons'
import { router } from '@inertiajs/react'
import ReactMarkdown from 'react-markdown'
import { X, Send, Loader2, Download, FileSpreadsheet, FileText, FileSpreadsheet as FileCsv, History, Plus, ArrowLeft, Pencil, Trash2, Check, Ticket, Calendar, ChevronRight, Sparkles, Mic, MicOff, Volume2, VolumeX, Maximize2, Minimize2 } from 'lucide-react'
import { useVoiceTicket } from '@/hooks/useVoiceTicket'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useLocale } from '@/hooks/useLocale'
import { useTranslation } from 'react-i18next'
import { stripMarkdownForSpeech } from '@/lib/stripMarkdownForSpeech'

interface ReportAttachment {
  url: string
  filename: string
  content_type: string
}

interface ConversationSummary {
  id: number
  title: string | null
  archived: boolean
  updated_at: string
}
interface ResourceAttachment {
  title: string
  path: string
  icon: 'ticket' | 'calendar' | 'sparkles'
}
interface AuditTrace {
  assistant_message_id: number
}

interface AssistantMessage {
  id: number | string
  role: 'user' | 'assistant'
  content: string
  report?: ReportAttachment | null
  resource_link?: ResourceAttachment | null
  audit_trace?: AuditTrace | null
}

const DEFAULT_WIDTH = 380
const MIN_WIDTH = 320
const MAX_WIDTH = 520
const EXPANDED_WIDTH = 720

const REPORT_KIND_MAP: Record<string, { label: string; color: string; icon: 'pdf' | 'xlsx'| 'csv' }> = {
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

const RESOURCE_ICON_MAP: Record<string, { color: string; Icon: typeof Ticket }> = {
  ticket: { color: '#028090', Icon: Ticket },
  calendar: { color: '#02C39A', Icon: Calendar },
  sparkles: { color: '#028090', Icon: Sparkles },
}

function ResourceLinkIcon({ icon }: { icon: string }) {
  const kind = RESOURCE_ICON_MAP[icon]
  const color = kind?.color ?? '#94A3B8'
  const Icon = kind?.Icon ?? Ticket
  return (
    <div
      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
      style={{ background: `${color}1A` }}
    >
      <Icon size={17} color={color} />
    </div>
  )
}

function AssistantMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
        strong: ({ children }) => <strong style={{ color: '#0D1B2A', fontWeight: 600 }}>{children}</strong>,
        ul: ({ children }) => <ul className="list-disc pl-4 mb-1.5 last:mb-0">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-4 mb-1.5 last:mb-0">{children}</ol>,
        li: ({ children }) => <li className="mb-0.5">{children}</li>,
        a: ({ children, href }) => (
          <a href={href} target="_blank" rel="noreferrer" style={{ color: '#028090' }}>
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

function csrfToken(): string {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? ''
}

function formatConversationLabel(conversation: ConversationSummary): string {
  if (conversation.title) return conversation.title
  const date = new Date(conversation.updated_at)
  return date.toLocaleDateString('es-CR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function VoltCopilotPanel() {
  const { t } = useTranslation('common')
  const { speechLang } = useLocale()
  const {
    transcript: voiceTranscript,
    interimTranscript: voiceInterimTranscript,
    voiceState,
    isSupported: voiceSupported,
    startListening,
    stopListening,
    resetTranscript,
    errorCode: voiceErrorCode,
  } = useVoiceTicket(speechLang)
  const [open, setOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [view, setView] = useState<'chat' | 'history'>('chat')
  const [messages, setMessages] = useState<AssistantMessage[]>([])
  const [conversationId, setConversationId] = useState<number | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const [loadingConversations, setLoadingConversations] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [width, setWidth] = useState(DEFAULT_WIDTH)
  const [expanded, setExpanded] = useState(false)
  const isMobile = useIsMobile()
  const [showPulse, setShowPulse] = useState(true)
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const resizingRef = useRef(false)

  useEffect(() => {
    if (open && !loaded) fetchConversation()
  }, [open, loaded])

  useEffect(() => {
    if (view === 'chat') bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending, view])

  useEffect(() => {
    const timer = setTimeout(() => setShowPulse(false), 4000)
    return () => clearTimeout(timer)
  }, [])

  const voiceBaseInputRef = useRef('')

  useEffect(() => {
    if (voiceTranscript) setInput(voiceBaseInputRef.current + voiceTranscript)
  }, [voiceTranscript])

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
      setConversationId(data.conversation_id)
      setHasMore(data.has_more)
      setLoaded(true)
    } catch {
      toast.error('Could not load Volt Copilot. Please try again.')
    }
  }

  async function handleLoadMore() {
    if (!conversationId || messages.length === 0) return
    setLoadingMore(true)

    try {
      const oldestId = messages[0].id
      const res = await fetch(`/assistant/conversations/${conversationId}/messages?before_id=${oldestId}`, {
        headers: { Accept: 'application/json' },
      })
      if (!res.ok) throw new Error('Failed to load older messages')
      const data = await res.json()
      setMessages(prev => [...data.messages, ...prev])
      setHasMore(data.has_more)
    } catch {
      toast.error('Could not load older messages.')
    } finally {
      setLoadingMore(false)
    }
  }

  async function handleNewConversation(force = false) {
    if (!force && messages.length === 0) {
      toast.info('Ya estás en una conversación nueva.')
      return
    }

    try {
      const res = await fetch('/assistant/conversations', {
        method: 'POST',
        headers: { Accept: 'application/json', 'X-CSRF-Token': csrfToken() },
      })
      if (!res.ok) throw new Error('Failed to create conversation')
      const data = await res.json()
      setMessages(data.messages)
      setConversationId(data.conversation_id)
      setHasMore(data.has_more)
      setView('chat')
      toast.success('Nueva conversación iniciada.')
    } catch {
      toast.error('Could not start a new conversation.')
    }
  }

  async function handleToggleHistory() {
    if (view === 'chat') {
      setView('history')
      setLoadingConversations(true)
      try {
        const res = await fetch('/assistant/conversations', { headers: { Accept: 'application/json' } })
        if (!res.ok) throw new Error('Failed to load conversations')
        const data = await res.json()
        setConversations(data.conversations)
      } catch {
        toast.error('Could not load conversation history.')
      } finally {
        setLoadingConversations(false)
      }
    } else {
      setView('chat')
    }
  }

  async function handleActivateConversation(id: number) {
    try {
      const res = await fetch(`/assistant/conversations/${id}/activate`, {
        method: 'PATCH',
        headers: { Accept: 'application/json', 'X-CSRF-Token': csrfToken() },
      })
      if (!res.ok) throw new Error('Failed to activate conversation')
      const data = await res.json()
      setMessages(data.messages)
      setConversationId(data.conversation_id)
      setHasMore(data.has_more)
      setView('chat')
    } catch {
      toast.error('Could not open that conversation.')
    }
  }

  function startEditing(conversation: ConversationSummary) {
    setEditingId(conversation.id)
    setEditingValue(conversation.title ?? '')
  }

  async function saveEditing(id: number) {
    const title = editingValue.trim()
    setEditingId(null)
    if (!title) return

    try {
      const res = await fetch(`/assistant/conversations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-Token': csrfToken() },
        body: JSON.stringify({ title }),
      })
      if (!res.ok) throw new Error('Failed to rename conversation')
      const data = await res.json()
      setConversations(prev => prev.map(c => (c.id === id ? { ...c, title: data.title } : c)))
    } catch {
      toast.error('Could not rename the conversation.')
    }
  }

  async function handleArchiveConversation(id: number) {
    try {
      const res = await fetch(`/assistant/conversations/${id}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json', 'X-CSRF-Token': csrfToken() },
      })
      if (!res.ok) throw new Error('Failed to archive conversation')
      setConversations(prev => prev.filter(c => c.id !== id))

      if (id === conversationId) await handleNewConversation(true)
    } catch {
      toast.error('Could not archive the conversation.')
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
        {
          id: `local-${Date.now()}-a`,
          role: 'assistant',
          content: data.content,
          report: data.report,
          resource_link: data.resource_link,
          audit_trace: data.audit_trace,
        },
      ])

      if (voiceOutputEnabled && data.content) {
        const utterance = new SpeechSynthesisUtterance(stripMarkdownForSpeech(data.content))
        utterance.lang = speechLang
        window.speechSynthesis.cancel()
        window.speechSynthesis.speak(utterance)
      }
    } catch {
      toast.error('Network error — Volt Copilot did not respond.')
    } finally {
      setSending(false)
    }
  }

  function handleVoiceToggle() {
    if (voiceState === 'listening') {
      stopListening()
      return
    }
    voiceBaseInputRef.current = input
    resetTranscript()
    startListening()
  }

  function handleVoiceOutputToggle() {
    if (voiceOutputEnabled) {
      window.speechSynthesis.cancel()
      setVoiceOutputEnabled(false)
    } else {
      setVoiceOutputEnabled(true)
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
        .volt-copilot-tooltip {
          position: absolute;
          bottom: 64px;
          right: 0;
          background: #0D1B2A;
          color: #fff;
          padding: 6px 10px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          white-space: nowrap;
          opacity: 0;
          transform: translateY(4px);
          pointer-events: none;
          transition: opacity 0.15s ease, transform 0.15s ease;
        }
        @media (hover: hover) and (pointer: fine) {
          .volt-copilot-fab-wrapper:hover .volt-copilot-tooltip {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div
        className="volt-copilot-fab-wrapper"
        style={{
          position: 'fixed',
          bottom: 'calc(24px + env(safe-area-inset-bottom))',
          right: '24px',
          zIndex: 40,
          display: open ? 'none' : 'block',
        }}
      >
        <span className="volt-copilot-tooltip">¿En qué te ayudo?</span>
        <button
          onClick={() => setOpen(true)}
          aria-label="Open Volt Copilot"
          title="Volt Copilot"
          className={`flex items-center justify-center rounded-full transition-transform hover:scale-105 ${showPulse ? 'volt-copilot-pulse' : ''}`}
          style={{
            width: '52px', height: '52px',
            background: 'linear-gradient(135deg, #028090 0%, #02C39A 100%)',
            border: 'none', cursor: 'pointer',
            boxShadow: '0 8px 20px rgba(2,128,144,0.35), 0 2px 6px rgba(2,128,144,0.25)',
          }}
        >
          <IconBolt size={22} color="#fff" />
        </button>
      </div>

      <div
        className="fixed top-0 right-0 bottom-0 z-40 flex flex-col transition-transform duration-300"
        style={{
          width: isMobile ? '100vw' : `${expanded ? EXPANDED_WIDTH : width}px`,
          maxWidth: '100vw', background: '#fff',
          borderLeft: isMobile ? 'none' : '1px solid rgba(15,23,42,0.08)',
          boxShadow: isMobile ? 'none' : '-8px 0 24px rgba(0,0,0,0.08)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        {!isMobile && !expanded && (
          <div
            onMouseDown={handleResizeStart}
            className="hidden sm:block absolute top-0 bottom-0 left-0"
            style={{ width: '5px', cursor: 'ew-resize', zIndex: 41 }}
          />
        )}

        <div className="flex items-center justify-between px-4 py-4 border-b" style={{ borderColor: 'rgba(15,23,42,0.08)' }}>
          <div className="flex items-center gap-2">
            {view === 'history' ? (
              <button
                onClick={handleToggleHistory}
                aria-label="Back to chat"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#0D1B2A', display: 'flex' }}
              >
                <ArrowLeft size={16} />
              </button>
            ) : (
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#028090' }}>
                <IconBolt size={14} color="#fff" />
              </div>
            )}
            <span className="font-semibold text-sm" style={{ color: '#0D1B2A' }}>
              {view === 'history' ? 'Historial' : 'Volt Copilot'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {view === 'chat' && (
              <>
                <button
                  onClick={() => handleNewConversation()}
                  aria-label="New conversation"
                  title="Nueva conversación"
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex' }}
                >
                  <Plus size={17} />
                </button>
                <button
                  onClick={handleToggleHistory}
                  aria-label="Conversation history"
                  title="Historial"
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex' }}
                >
                  <History size={16} />
                </button>
                <button
                  onClick={handleVoiceOutputToggle}
                  aria-label={voiceOutputEnabled ? 'Disable voice output' : 'Enable voice output'}
                  aria-pressed={voiceOutputEnabled}
                  title={voiceOutputEnabled ? 'Voz activada' : 'Voz desactivada'}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: voiceOutputEnabled ? '#028090' : '#94A3B8', display: 'flex' }}
                >
                  {voiceOutputEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>
              </>
            )}
            {!isMobile && (
              <button
                onClick={() => setExpanded((prev) => !prev)}
                aria-label={expanded ? 'Collapse Volt Copilot' : 'Expand Volt Copilot'}
                title={expanded ? 'Contraer' : 'Expandir'}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex' }}
              >
                {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              aria-label="Close Volt Copilot"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {view === 'history' ? (
          <div className="volt-copilot-scroll flex-1 overflow-y-auto px-4 py-4 space-y-2">
            {loadingConversations && (
              <div className="flex items-center justify-center h-full">
                <Loader2 size={20} className="animate-spin" style={{ color: '#94A3B8' }} />
              </div>
            )}

            {!loadingConversations && conversations.length === 0 && (
              <p className="text-sm" style={{ color: '#94A3B8' }}>No hay conversaciones todavía.</p>
            )}

            {conversations.map(conversation => (
              <div
                key={conversation.id}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl transition-colors hover:bg-black/[0.02]"
                style={{
                  border: conversation.id === conversationId ? '1px solid #028090' : '1px solid rgba(15,23,42,0.08)',
                  background: conversation.id === conversationId ? 'rgba(2,128,144,0.05)' : '#fff',
                }}
              >
                {editingId === conversation.id ? (
                  <div className="min-w-0 flex-1 text-left">
                    <input
                      autoFocus
                      value={editingValue}
                      onClick={e => e.stopPropagation()}
                      onChange={e => setEditingValue(e.target.value)}
                      onKeyDown={e => {
                        e.stopPropagation()
                        if (e.key === 'Enter') saveEditing(conversation.id)
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                      className="w-full text-sm font-medium px-1 py-0.5 rounded"
                      style={{ border: '1px solid #028090', outline: 'none', color: '#0D1B2A' }}
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleActivateConversation(conversation.id)}
                    className="min-w-0 flex-1 text-left"
                    style={{ cursor: 'pointer', background: 'transparent', border: 'none', padding: 0, font: 'inherit' }}
                  >
                    <p
                      className="text-sm font-medium truncate"
                      style={{ color: conversation.archived ? '#94A3B8' : '#0D1B2A' }}
                    >
                      {formatConversationLabel(conversation)}
                    </p>
                    {conversation.id === conversationId && (
                      <p className="text-xs mt-0.5" style={{ color: '#028090' }}>Conversación actual</p>
                    )}
                  </button>
                )}

                <div className="flex items-center gap-1 flex-shrink-0">
                  {editingId === conversation.id ? (
                    <>
                      <button
                        onClick={e => { e.stopPropagation(); saveEditing(conversation.id) }}
                        aria-label="Confirm rename"
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#028090', display: 'flex' }}
                      >
                        <Check size={15} />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); setEditingId(null) }}
                        aria-label="Cancel rename"
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex' }}
                      >
                        <X size={15} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={e => { e.stopPropagation(); startEditing(conversation) }}
                        aria-label="Rename conversation"
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex' }}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); handleArchiveConversation(conversation.id) }}
                        aria-label="Archive conversation"
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="volt-copilot-scroll flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {!loaded && (
                <div className="flex items-center justify-center h-full">
                  <Loader2 size={20} className="animate-spin" style={{ color: '#94A3B8' }} />
                </div>
              )}

              {loaded && hasMore && (
                <div className="flex justify-center pb-1">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="text-xs font-medium px-3 py-1.5 rounded-full transition-colors hover:bg-black/[0.02]"
                    style={{ border: '1px solid rgba(15,23,42,0.08)', color: '#028090', background: '#fff', cursor: 'pointer' }}
                  >
                    {loadingMore ? 'Cargando...' : 'Ver mensajes anteriores'}
                  </button>
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
                    {message.role === 'assistant' ? <AssistantMarkdown content={message.content} /> : message.content}
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
                  {message.resource_link && (
                    <button
                      onClick={() => router.get(message.resource_link!.path)}
                      className="flex items-center gap-3 mt-1.5 p-3 rounded-xl transition-colors hover:bg-black/[0.02] w-full text-left"
                      style={{ background: '#fff', border: '1px solid rgba(15,23,42,0.08)', cursor: 'pointer' }}
                    >
                      <ResourceLinkIcon icon={message.resource_link.icon} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate" style={{ color: '#0D1B2A' }}>
                          {message.resource_link.title}
                        </p>
                        <p className="text-xs" style={{ color: '#94A3B8' }}>
                          View details
                        </p>
                      </div>
                      <ChevronRight size={16} style={{ color: '#028090', flexShrink: 0 }} />
                    </button>
                  )}
                  {message.audit_trace && (
                    <a
                      href={`/admin/audit-log?assistant_message_id=${message.audit_trace.assistant_message_id}`}
                      className="text-xs mt-1 inline-block hover:underline"
                      style={{ color: '#028090', textDecoration: 'underline' }}
                    >
                      {t('auditTrace.viewLink')}
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
                  onClick={handleVoiceToggle}
                  disabled={!voiceSupported}
                  type="button"
                  aria-label={voiceState === 'listening' ? 'Stop dictation' : 'Start dictation'}
                  aria-pressed={voiceState === 'listening'}
                  className="flex items-center justify-center rounded-xl flex-shrink-0"
                  style={{
                    width: '36px', height: '36px', border: 'none',
                    cursor: voiceSupported ? 'pointer' : 'not-allowed',
                    background: voiceState === 'listening' ? '#028090' : '#F1F5F9',
                  }}
                >
                  {voiceState === 'listening'
                    ? <Mic size={16} color="#fff" />
                    : <MicOff size={16} color={voiceSupported ? '#64748B' : '#CBD5E1'} />}
                </button>
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

              {voiceErrorCode && (
                <p className="text-xs mt-1.5" style={{ color: '#DC2626' }}>
                  {t(`voice.errors.${voiceErrorCode}`)}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </>
  )
}