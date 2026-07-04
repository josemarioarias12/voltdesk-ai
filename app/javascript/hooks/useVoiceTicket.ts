import { useState, useRef, useCallback } from 'react'

export type VoiceState = 'idle' | 'listening' | 'processing' | 'error'

export interface VoiceTicketHookResult {
  voiceState:       VoiceState
  transcript:       string
  interimTranscript: string
  isSupported:      boolean
  startListening:   () => void
  stopListening:    () => void
  resetTranscript:  () => void
  errorMessage:     string | null
}

declare global {
  interface Window {
    SpeechRecognition:       new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}

// iOS Safari's WebKit implementation frequently gets stuck in the 'listening'
// state indefinitely — no onresult, onerror, or onend ever fires. This is a
// long-documented platform bug, not something fixable from application code.
// The watchdog below resets on every event (interim or final result) so it
// only fires when Safari has gone genuinely silent/stuck, never during normal use.
const SILENCE_WATCHDOG_MS = 8000

function isSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
}

export function useVoiceTicket(lang = 'es-ES'): VoiceTicketHookResult {
  const [voiceState,        setVoiceState]        = useState<VoiceState>('idle')
  const [transcript,        setTranscript]        = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [errorMessage,      setErrorMessage]      = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const watchdogRef    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isSupported    = isSpeechRecognitionSupported()

  const disarmWatchdog = useCallback(() => {
    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current)
      watchdogRef.current = null
    }
  }, [])

  const armWatchdog = useCallback(() => {
    disarmWatchdog()
    watchdogRef.current = setTimeout(() => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop() } catch { /* best-effort only */ }
        recognitionRef.current = null
      }
      setInterimTranscript('')
      setVoiceState(prev => prev === 'listening' ? 'idle' : prev)
    }, SILENCE_WATCHDOG_MS)
  }, [disarmWatchdog])

  const startListening = useCallback(() => {
    if (!isSupported) {
      setErrorMessage('Voice input requires Chrome or Edge')
      setVoiceState('error')
      return
    }

    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognitionClass()

    recognition.lang             = lang
    recognition.continuous       = false
    recognition.interimResults   = true
    recognition.maxAlternatives  = 1

    recognition.onstart = () => {
      setVoiceState('listening')
      setErrorMessage(null)
      armWatchdog()
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      armWatchdog()

      let interim = ''
      let final   = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          final += result[0].transcript
        } else {
          interim += result[0].transcript
        }
      }

      if (final) {
        setTranscript(prev => prev + final)
        setInterimTranscript('')
      } else {
        setInterimTranscript(interim)
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      disarmWatchdog()
      const messages: Record<string, string> = {
        'not-allowed':         'Microphone access denied.',
        'no-speech':           'No speech detected. Please try again.',
        'network':             'Network error during recognition.',
        'aborted':             'Recording was cancelled.',
        'service-not-allowed': 'Voice input isn\'t available right now — you can type your issue below instead.',
      }
      setErrorMessage(messages[event.error] ?? `Recognition error: ${event.error}`)
      setVoiceState('error')
    }

    recognition.onend = () => {
      disarmWatchdog()
      setInterimTranscript('')
      setVoiceState(prev => prev === 'listening' ? 'idle' : prev)
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [isSupported, lang, armWatchdog, disarmWatchdog])

  const stopListening = useCallback(() => {
    disarmWatchdog()
    if (recognitionRef.current) {
      setVoiceState('processing')
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
  }, [disarmWatchdog])

  const resetTranscript = useCallback(() => {
    disarmWatchdog()
    if (recognitionRef.current) {
      recognitionRef.current.abort()
      recognitionRef.current = null
    }
    setVoiceState('idle')
    setTranscript('')
    setInterimTranscript('')
    setErrorMessage(null)
  }, [disarmWatchdog])

  return {
    voiceState,
    transcript,
    interimTranscript,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    errorMessage,
  }
}