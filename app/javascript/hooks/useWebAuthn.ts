import { useCallback, useState } from 'react'
import { startAuthentication, startRegistration } from '@simplewebauthn/browser'
import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/browser'

export type WebauthnStatus = 'idle' | 'in_progress' | 'error'

export interface UseWebAuthnResult {
  status:       WebauthnStatus
  errorMessage: string | null
  isSupported:  boolean
  registerPasskey: (nickname?: string) => Promise<boolean>
  authenticateWithPasskey: (email: string) => Promise<string | null>
}

function getCsrfToken(): string {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? ''
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-CSRF-Token': getCsrfToken(),
    },
    body: JSON.stringify(body),
  })

  const data = await response.json() as Record<string, unknown>

  if (!response.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : 'request_failed')
  }

  return data as T
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: { Accept: 'application/json' } })
  const data = await response.json() as Record<string, unknown>

  if (!response.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : 'request_failed')
  }

  return data as T
}

export function useWebAuthn(): UseWebAuthnResult {
  const [status,       setStatus]       = useState<WebauthnStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const isSupported = typeof window !== 'undefined' && !!window.PublicKeyCredential

  const registerPasskey = useCallback(async (nickname?: string): Promise<boolean> => {
    setStatus('in_progress')
    setErrorMessage(null)

    try {
      const optionsJSON = await getJson<PublicKeyCredentialCreationOptionsJSON>('/webauthn/registration/new')
      const attestation: RegistrationResponseJSON = await startRegistration({ optionsJSON })

      await postJson('/webauthn/registration', { credential: attestation, nickname })

      setStatus('idle')
      return true
    } catch (error) {
      setStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'registration_failed')
      return false
    }
  }, [])

  const authenticateWithPasskey = useCallback(async (email: string): Promise<string | null> => {
    setStatus('in_progress')
    setErrorMessage(null)

    try {
      const optionsJSON = await postJson<PublicKeyCredentialRequestOptionsJSON>('/webauthn/authentication/options', { email })
      const assertion: AuthenticationResponseJSON = await startAuthentication({ optionsJSON })
      const result = await postJson<{ redirect_to: string }>('/webauthn/authentication/verify', { credential: assertion })

      setStatus('idle')
      return result.redirect_to
    } catch (error) {
      setStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'authentication_failed')
      return null
    }
  }, [])

  return { status, errorMessage, isSupported, registerPasskey, authenticateWithPasskey }
}