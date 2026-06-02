import { useState, useRef, useCallback, useEffect } from 'react'

export type VoiceState = 'idle' | 'listening' | 'processing' | 'error'

interface UseVoiceTicketReturn {
  transcript: string
  interimTranscript: string
  voiceState: VoiceState
  isSupported: boolean
  startListening: () => void
  stopListening: () => void
  resetTranscript: () => void
  errorMessage: string | null
}

// Web Speech API — not fully typed in lib.dom.d.ts, so we declare manually.
interface ISpeechRecognition extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onstart:  ((this: ISpeechRecognition, ev: Event) => void) | null
  onend:    ((this: ISpeechRecognition, ev: Event) => void) | null
  onresult: ((this: ISpeechRecognition, ev: SpeechRecognitionEvent) => void) | null
  onerror:  ((this: ISpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null
}

interface ISpeechRecognitionConstructor {
  new (): ISpeechRecognition
}

declare global {
  interface Window {
    SpeechRecognition:       ISpeechRecognitionConstructor | undefined
    webkitSpeechRecognition: ISpeechRecognitionConstructor | undefined
  }
}

export function useVoiceTicket(lang = 'es-ES'): UseVoiceTicketReturn {
  const [transcript, setTranscript]           = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [voiceState, setVoiceState]           = useState<VoiceState>('idle')
  const [errorMessage, setErrorMessage]       = useState<string | null>(null)
  const recognitionRef = useRef<ISpeechRecognition | null>(null)

  const SpeechRecognitionAPI: ISpeechRecognitionConstructor | undefined =
    typeof window !== 'undefined'
      ? window.SpeechRecognition ?? window.webkitSpeechRecognition
      : undefined

  const isSupported = SpeechRecognitionAPI !== undefined

  useEffect(() => {
    return () => { recognitionRef.current?.abort() }
  }, [])

  const startListening = useCallback(() => {
    if (!isSupported || !SpeechRecognitionAPI) {
      setErrorMessage('Voice input requires Chrome or Edge.')
      setVoiceState('error')
      return
    }

    setErrorMessage(null)
    setInterimTranscript('')

    const recognition = new SpeechRecognitionAPI()
    recognitionRef.current = recognition
    recognition.lang             = lang
    recognition.continuous       = false
    recognition.interimResults   = true
    recognition.maxAlternatives  = 1

    recognition.onstart = () => { setVoiceState('listening') }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = ''
      let final   = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) { final += result[0].transcript }
        else                { interim += result[0].transcript }
      }
      if (interim) setInterimTranscript(interim)
      if (final)   { setTranscript(prev => prev + final); setInterimTranscript('') }
    }

    recognition.onend = () => { setVoiceState('idle'); setInterimTranscript('') }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const messages: Record<string, string> = {
        'no-speech':     'No speech detected. Please try again.',
        'audio-capture': 'Microphone not found. Please check your device.',
        'not-allowed':   'Microphone permission denied. Allow access in browser settings.',
        'network':       'Network error during recognition. Try again.',
        'aborted':       'Recording cancelled.',
      }
      setErrorMessage(messages[event.error] ?? `Recognition error: ${event.error}`)
      setVoiceState('error')
    }

    try { recognition.start() }
    catch { setErrorMessage('Failed to start voice recognition.'); setVoiceState('error') }
  }, [isSupported, SpeechRecognitionAPI, lang])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setVoiceState('idle')
  }, [])

  const resetTranscript = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
    setErrorMessage(null)
    setVoiceState('idle')
  }, [])

  return {
    transcript, interimTranscript, voiceState,
    isSupported, startListening, stopListening,
    resetTranscript, errorMessage,
  }
}
