export type VoiceState = 'idle' | 'listening' | 'processing' | 'error'

export interface VoiceTicketHookResult {
  state: VoiceState
  transcript: string
  interimTranscript: string
  isSupported: boolean
  start: () => void
  stop: () => void
  reset: () => void
  errorMessage: string | null
}
