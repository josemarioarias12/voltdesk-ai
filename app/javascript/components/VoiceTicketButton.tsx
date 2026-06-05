import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useVoiceTicket } from '@/hooks/useVoiceTicket'

interface VoiceTicketButtonProps {
  onTranscriptReady: (transcript: string) => void
  disabled?:         boolean
}

export function VoiceTicketButton({ onTranscriptReady, disabled = false }: VoiceTicketButtonProps) {
  const {
    voiceState,
    transcript,
    interimTranscript,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    errorMessage,
  } = useVoiceTicket()

  useEffect(() => {
    if (voiceState === 'idle' && transcript.trim().length > 0) {
      onTranscriptReady(transcript.trim())
    }
  }, [voiceState, transcript, onTranscriptReady])

  if (!isSupported) {
    return <p style={{ fontSize: 13, color: '#DC2626' }}>Voice input requires Chrome or Edge.</p>
  }

  const isListening  = voiceState === 'listening'
  const isProcessing = voiceState === 'processing'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <motion.button
          type="button"
          disabled={disabled || isProcessing}
          onMouseDown={startListening}
          onMouseUp={stopListening}
          onTouchStart={startListening}
          onTouchEnd={stopListening}
          whileTap={{ scale: 0.93 }}
          style={{ position: 'relative', width: 48, height: 48, borderRadius: '50%', border: 'none', background: isListening ? '#DC2626' : '#028090', color: '#fff', cursor: disabled || isProcessing ? 'not-allowed' : 'pointer', opacity: disabled || isProcessing ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <AnimatePresence>
            {isListening && [1, 2].map(ring => (
              <motion.span key={ring}
                style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#DC2626' }}
                initial={{ opacity: 0.6, scale: 1 }}
                animate={{ opacity: 0, scale: 1.8 + ring * 0.4 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, repeat: Infinity, delay: ring * 0.3, ease: 'easeOut' }}
              />
            ))}
          </AnimatePresence>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ width: 20, height: 20, position: 'relative', zIndex: 1 }}>
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V22H9v2h6v-2h-2v-1.06A9 9 0 0 0 21 12v-2h-2z" />
          </svg>
        </motion.button>

        <span style={{ fontSize: 13, color: '#475569' }}>
          {isListening   && 'Listening... release to stop'}
          {isProcessing  && 'Processing...'}
          {voiceState === 'idle' && transcript  && 'Ready — transcript captured'}
          {voiceState === 'idle' && !transcript && 'Hold to speak'}
          {voiceState === 'error'               && 'Error — see below'}
        </span>

        {transcript && voiceState === 'idle' && (
          <button type="button" onClick={resetTranscript}
            style={{ fontSize: 12, color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
            Clear
          </button>
        )}
      </div>

      <AnimatePresence>
        {(isListening || interimTranscript || transcript) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ borderRadius: 10, border: '1px solid #E2E8F0', background: '#F8FAFC', padding: '10px 14px', fontSize: 13, minHeight: 48 }}
          >
            <span style={{ color: '#0F172A' }}>{transcript}</span>
            <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>{interimTranscript}</span>
            {isListening && !transcript && !interimTranscript && (
              <span style={{ color: '#94A3B8' }}>Start speaking...</span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {errorMessage && (
        <p style={{ fontSize: 12, color: '#DC2626' }}>{errorMessage}</p>
      )}
    </div>
  )
}
