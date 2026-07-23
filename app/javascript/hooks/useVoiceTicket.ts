import { useState, useRef, useCallback } from 'react'

export type VoiceState = 'idle' | 'listening' | 'processing' | 'error'
export type VoiceErrorCode =
  | 'unsupported'
  | 'not_allowed'
  | 'no_speech'
  | 'network'
  | 'aborted'
  | 'service_not_allowed'
  | 'unknown'

export interface VoiceTicketHookResult {
  voiceState:       VoiceState
  transcript:       string
  interimTranscript: string
  isSupported:      boolean
  startListening:   () => void
  stopListening:    () => void
  resetTranscript:  () => void
  errorCode:        VoiceErrorCode | null
}

declare global {
  interface Window {
    SpeechRecognition:       new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}

// iOS Safari can get stuck in 'listening' indefinitely with no event ever firing.
// This watchdog resets on every event and only fires when truly stuck.
const SILENCE_WATCHDOG_MS = 8000

const ERROR_CODE_MAP: Record<string, VoiceErrorCode> = {
  'not-allowed':         'not_allowed',
  'no-speech':           'no_speech',
  'network':             'network',
  'aborted':             'aborted',
  'service-not-allowed': 'service_not_allowed',
}

function isSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
}

export function useVoiceTicket(lang: string = typeof navigator !== 'undefined' ? navigator.language : 'en-US'): VoiceTicketHookResult {
  const [voiceState,        setVoiceState]        = useState<VoiceState>('idle')
  const [transcript,        setTranscript]        = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [errorCode,         setErrorCode]         = useState<VoiceErrorCode | null>(null)
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
        try { recognitionRef.current.stop() } catch { /* ignore */ }
        recognitionRef.current = null
      }
      setInterimTranscript('')
      setVoiceState(prev => prev === 'listening' ? 'idle' : prev)
    }, SILENCE_WATCHDOG_MS)
  }, [disarmWatchdog])

  const startListening = useCallback(() => {
    if (!isSupported) {
      setErrorCode('unsupported')
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
      setErrorCode(null)
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
      setErrorCode(ERROR_CODE_MAP[event.error] ?? 'unknown')
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
    setErrorCode(null)
  }, [disarmWatchdog])

  return {
    voiceState,
    transcript,
    interimTranscript,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    errorCode,
  }
}