import { useEffect, useRef } from 'react'
import { cable } from '@/lib/cable'

interface UseActionCableOptions {
  channel: string
  [key: string]: unknown
}

export function useActionCable(
  channelConfig: UseActionCableOptions,
  onReceived: (data: Record<string, unknown>) => void
): void {
  const onReceivedRef = useRef(onReceived)
  onReceivedRef.current = onReceived
  const configKey = JSON.stringify(channelConfig)

  useEffect(() => {
    let active = true
    const subscription = cable.subscriptions.create(channelConfig, {
      received(data: unknown) {
        if (active) {
          onReceivedRef.current(data as Record<string, unknown>)
        }
      },
    })
    return () => {
      active = false
      subscription.unsubscribe()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configKey])
}