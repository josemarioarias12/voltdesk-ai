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
  const isSupported    = isSpeechRecognitionSupported()

  const startListening = useCallback(async () => {
    if (!isSupported) {
      setErrorMessage('Voice input requires Chrome or Edge')
      setVoiceState('error')
      return
    }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setErrorMessage('Microphone access denied. Please allow microphone access and try again.')
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
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
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
      const messages: Record<string, string> = {
        'not-allowed': 'Microphone access denied.',
        'no-speech':   'No speech detected. Please try again.',
        'network':     'Network error during recognition.',
        'aborted':     'Recording was cancelled.',
      }
      setErrorMessage(messages[event.error] ?? `Recognition error: ${event.error}`)
      setVoiceState('error')
    }

    recognition.onend = () => {
      setInterimTranscript('')
      setVoiceState(prev => prev === 'listening' ? 'idle' : prev)
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [isSupported, lang])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      setVoiceState('processing')
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
  }, [])

  const resetTranscript = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort()
      recognitionRef.current = null
    }
    setVoiceState('idle')
    setTranscript('')
    setInterimTranscript('')
    setErrorMessage(null)
  }, [])

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
